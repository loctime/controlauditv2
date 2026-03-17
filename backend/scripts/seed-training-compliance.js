/**
 * Seed mínimo para habilitar reportes de cumplimiento en una sucursal.
 *
 * Hace (idempotente):
 * 1) Verifica existencia de empresa/sucursal.
 * 2) Backfill: empleados en sucursal sin rol/puesto pero con cargo -> set rol/puesto=cargo.trim()
 * 3) Crea reglas activas en training_requirement_matrix para la sucursal (sin rol) usando training_catalog activo.
 *
 * Uso:
 *   node backend/scripts/seed-training-compliance.js --ownerId <OWNER> --branchId <SUCURSAL> --companyId <EMPRESA> [--limitTrainings 3] [--trainingTypeIds a,b,c] [--dryRun]
 *
 * Notas:
 * - No imprime credenciales.
 * - Si pasas --trainingTypeIds, se usan esos (filtrados por catálogo activo).
 * - Si NO pasas --trainingTypeIds, usa los primeros N del catálogo activo (N = --limitTrainings, default 3).
 */
import admin from 'firebase-admin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

function parseArgs(argv = []) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
    out[key] = value;
  }
  return out;
}

function ownersPath(ownerId, collectionName) {
  return `apps/auditoria/owners/${ownerId}/${collectionName}`;
}

function normalizeId(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value != null) {
    if (value.id != null) return String(value.id);
    if (typeof value.path === 'string') return value.path.split('/').pop() || null;
  }
  return String(value);
}

function hasRoleFields(employee = {}) {
  return Boolean(
    employee.jobRoleId ||
    employee.puestoId ||
    employee.rolId ||
    (typeof employee.puesto === 'string' && employee.puesto.trim()) ||
    (typeof employee.rol === 'string' && employee.rol.trim())
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ownerId = args.ownerId || null;
  const branchId = args.branchId || null;
  const companyId = args.companyId || null;
  const dryRun = args.dryRun === true || args.dryRun === 'true';
  const limitTrainings = Math.max(1, Math.min(50, Number(args.limitTrainings || 3)));
  const trainingTypeIdsArg = typeof args.trainingTypeIds === 'string'
    ? args.trainingTypeIds.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (!ownerId || !branchId || !companyId) {
    console.error('Faltan parámetros. Requiere --ownerId --branchId --companyId');
    process.exitCode = 1;
    return;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const keyPath = path.resolve(__dirname, '..', 'serviceAccountKey-controlfile.json');
  if (!fs.existsSync(keyPath)) {
    console.error('No se encontró serviceAccountKey-controlfile.json en backend/');
    process.exitCode = 1;
    return;
  }

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const db = admin.firestore();

  console.log('\n=== seed-training-compliance ===');
  console.log(JSON.stringify({ ownerId, branchId, companyId, dryRun, limitTrainings, trainingTypeIdsArg }, null, 2));

  // 1) Verificar empresa y sucursal
  const empresaRef = db.doc(`${ownersPath(ownerId, 'empresas')}/${companyId}`);
  const sucursalRef = db.doc(`${ownersPath(ownerId, 'sucursales')}/${branchId}`);
  const [empresaSnap, sucursalSnap] = await Promise.all([empresaRef.get(), sucursalRef.get()]);
  console.log('\n[check] empresa exists:', empresaSnap.exists);
  console.log('[check] sucursal exists:', sucursalSnap.exists);
  if (!empresaSnap.exists) console.warn('[warn] Empresa no encontrada en owners/{ownerId}/empresas/{companyId}');
  if (!sucursalSnap.exists) console.warn('[warn] Sucursal no encontrada en owners/{ownerId}/sucursales/{branchId}');

  // 2) Backfill empleados: cargo -> rol/puesto
  const empleadosQuery = db
    .collection(ownersPath(ownerId, 'empleados'))
    .where('sucursalId', '==', branchId);
  const empleadosSnap = await empleadosQuery.get();
  const empleados = empleadosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const toBackfill = empleados.filter((e) => !hasRoleFields(e) && typeof e.cargo === 'string' && e.cargo.trim());
  console.log('\n[empleados] total en sucursal:', empleados.length);
  console.log('[empleados] a backfillear (cargo -> rol/puesto):', toBackfill.length);

  if (!dryRun && toBackfill.length > 0) {
    const batch = db.batch();
    toBackfill.forEach((e) => {
      const cargo = e.cargo.trim();
      const ref = db.doc(`${ownersPath(ownerId, 'empleados')}/${e.id}`);
      batch.update(ref, {
        rol: cargo,
        puesto: cargo,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    console.log('[empleados] ✅ backfill aplicado');
  } else if (dryRun) {
    console.log('[empleados] (dryRun) no se aplicaron updates');
  }

  // 3) Crear reglas en training_requirement_matrix
  const catalogSnap = await db
    .collection(ownersPath(ownerId, 'training_catalog'))
    .where('status', '==', 'active')
    .get();
  const catalogActive = catalogSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const catalogIds = new Set(catalogActive.map((c) => normalizeId(c.id)).filter(Boolean));
  console.log('\n[catalog] capacitaciones activas:', catalogActive.length);

  const selectedTrainingTypeIds = (trainingTypeIdsArg.length > 0
    ? trainingTypeIdsArg
    : catalogActive.slice(0, limitTrainings).map((c) => c.id)
  ).map(normalizeId).filter(Boolean).filter((id) => catalogIds.has(id));

  if (selectedTrainingTypeIds.length === 0) {
    console.warn('[rules] No hay trainingTypeIds seleccionables (revisar catálogo activo).');
    return;
  }

  // Idempotencia: usar docId determinístico por sucursal + trainingTypeId
  const rulesCol = db.collection(ownersPath(ownerId, 'training_requirement_matrix'));
  let created = 0;
  let skipped = 0;

  for (const trainingTypeId of selectedTrainingTypeIds) {
    const ruleId = `${branchId}_${trainingTypeId}`;
    const ref = rulesCol.doc(ruleId);
    const snap = await ref.get();
    if (snap.exists) {
      skipped += 1;
      continue;
    }

    const payload = {
      appId: 'auditoria',
      trainingTypeId,
      companyId,
      branchId,
      status: 'active',
      source: 'seed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!dryRun) {
      await ref.set(payload, { merge: true });
    }
    created += 1;
  }

  console.log('\n[rules] training_requirement_matrix');
  console.log('  selectedTrainingTypeIds:', selectedTrainingTypeIds);
  console.log('  created:', created);
  console.log('  skipped(existing):', skipped);
  console.log(dryRun ? '  (dryRun) no se escribieron reglas' : '  ✅ reglas listas');

  console.log('\n✅ Seed completo. Ahora volvé a correr el diagnóstico de reportes.');
}

main().catch((err) => {
  console.error('❌ Error ejecutando seed:', err?.message || err);
  process.exitCode = 1;
});

