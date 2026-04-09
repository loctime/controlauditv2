/**
 * SEED MANUALES — ControlAudit
 * -------------------------------------------------------
 * Recrea SOLO las auditorías manuales con distribución irregular real:
 * - Algunos meses tienen 2
 * - Algunos meses tienen 1
 * - Algunos meses no tienen ninguna
 *
 * USO:
 *   1. serviceAccountKey-controlfile.json en esta misma carpeta
 *   2. node seed-manuales.js
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey-controlfile.json');

const OWNER_ID   = 'oemyRkkbneaYgG45I1PPiv99z9B3';
const APP_ID     = 'auditoria';
const BASE       = `apps/${APP_ID}/owners/${OWNER_ID}`;
const EMPRESA_ID = 'empresa-constructora-demo';
const SUCURSAL_1 = 'sucursal-obra-norte';
const SUCURSAL_2 = 'sucursal-obra-sur';

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const p     = (...segs) => `${BASE}/${segs.join('/')}`;
const ts    = (d) => admin.firestore.Timestamp.fromDate(d instanceof Date ? d : new Date(d));
const fecha = (y, m, d, h = 9) => new Date(y, m - 1, d, h, 0, 0, 0);

// Distribución irregular real:
// Enero: 2 (arranque del año, mucho movimiento)
// Febrero: ninguna
// Marzo: 2 (post-accidente, refuerzo de control)
// Abril: 1
// Mayo: ninguna
// Junio: 2 (mitad de año, revisión general)
// Julio: 1
// Agosto: ninguna
// Septiembre: 2 (vuelta de invierno)
// Octubre: 1
// Noviembre: ninguna
// Diciembre: 1 (cierre de año)
// 2026: 3 distribuidas
const MANUALES_DEF = [
  // Enero 2025 — 2 auditorías
  { y:2025, m:1,  d:8,  suc:SUCURSAL_1, auditor:'insp1', nombre:'Inspección de andamios — Sector A' },
  { y:2025, m:1,  d:21, suc:SUCURSAL_2, auditor:'insp2', nombre:'Control de maquinaria pesada — Grúa Torre' },
  // Febrero 2025 — ninguna
  // Marzo 2025 — 2 (refuerzo post-accidente)
  { y:2025, m:3,  d:5,  suc:SUCURSAL_1, auditor:'admin', nombre:'Revisión instalaciones eléctricas provisionales' },
  { y:2025, m:3,  d:26, suc:SUCURSAL_1, auditor:'insp1', nombre:'Control de EPP en zona de altura — Bloque B' },
  // Abril 2025 — 1
  { y:2025, m:4,  d:14, suc:SUCURSAL_2, auditor:'insp2', nombre:'Auditoría de acopio de materiales' },
  // Mayo 2025 — ninguna
  // Junio 2025 — 2 (revisión semestral)
  { y:2025, m:6,  d:4,  suc:SUCURSAL_1, auditor:'insp1', nombre:'Control de señalización en accesos vehiculares' },
  { y:2025, m:6,  d:18, suc:SUCURSAL_2, auditor:'admin', nombre:'Inspección de EPP — stock y estado de equipos' },
  // Julio 2025 — 1
  { y:2025, m:7,  d:10, suc:SUCURSAL_2, auditor:'insp2', nombre:'Verificación de extintores en obra' },
  // Agosto 2025 — ninguna
  // Septiembre 2025 — 2 (vuelta de invierno)
  { y:2025, m:9,  d:3,  suc:SUCURSAL_1, auditor:'insp1', nombre:'Revisión de andamios — Bloque C' },
  { y:2025, m:9,  d:22, suc:SUCURSAL_2, auditor:'insp2', nombre:'Control de arneses y equipos de altura' },
  // Octubre 2025 — 1
  { y:2025, m:10, d:15, suc:SUCURSAL_1, auditor:'admin', nombre:'Inspección de tableros eléctricos provisorios' },
  // Noviembre 2025 — ninguna
  // Diciembre 2025 — 1 (cierre de año)
  { y:2025, m:12, d:9,  suc:SUCURSAL_2, auditor:'insp2', nombre:'Revisión extintores y plan de evacuación anual' },
  // 2026
  { y:2026, m:1,  d:16, suc:SUCURSAL_1, auditor:'insp1', nombre:'Control de andamios — Inicio de temporada' },
  { y:2026, m:2,  d:27, suc:SUCURSAL_2, auditor:'admin', nombre:'Auditoría de maquinaria pesada — Grúa Torre #2' },
  { y:2026, m:3,  d:13, suc:SUCURSAL_1, auditor:'insp1', nombre:'Inspección de EPP — primer trimestre 2026' },
];

async function seed() {
  console.log('\n📝 SEED MANUALES — ControlAudit');
  console.log('─'.repeat(50));

  // Cargar usuarios
  console.log('\n🔍 Cargando usuarios...');
  const usuariosSnap = await db.collection(p('usuarios')).get();
  const usuariosMap  = {};
  usuariosSnap.forEach(doc => { usuariosMap[doc.data().email] = { uid: doc.id, ...doc.data() }; });

  const uAdmin = usuariosMap['demo@controlaudit.com'];
  const uInsp1 = usuariosMap['mgonzalez@constructoradelsur.com'];
  const uInsp2 = usuariosMap['aruiz@constructoradelsur.com'];

  console.log(`  ✅ Admin:  ${uAdmin.displayName}`);
  console.log(`  ✅ Insp1:  ${uInsp1.displayName}`);
  console.log(`  ✅ Insp2:  ${uInsp2.displayName}`);

  const resolverAuditor = (key) =>
    key === 'admin' ? uAdmin : key === 'insp1' ? uInsp1 : uInsp2;

  // Crear auditorías manuales
  console.log(`\n📋 Creando ${MANUALES_DEF.length} auditorías manuales...`);

  // Distribución por mes para el log
  const porMes = {};

  for (const def of MANUALES_DEF) {
    const auditorUser = resolverAuditor(def.auditor);
    const d           = fecha(def.y, def.m, def.d);
    const closedAt    = new Date(d.getTime() + 3 * 24 * 60 * 60 * 1000);
    const ref         = db.collection(p('auditoriasManuales')).doc();

    await ref.set({
      id:            ref.id,
      nombre:        def.nombre,
      empresaId:     EMPRESA_ID,
      sucursalId:    def.suc,
      fecha:         ts(d),
      auditor:       auditorUser.displayName,
      auditorUid:    auditorUser.uid,
      observaciones: 'Revisión periódica completada. Sin novedades críticas fuera de lo registrado.',
      estado:        'cerrada',
      evidenciasCount: 0,
      ownerId:       OWNER_ID,
      createdBy:     auditorUser.uid,
      createdAt:     ts(d),
      updatedAt:     ts(d),
      closedAt:      ts(closedAt),
    });

    const mesKey = `${def.y}/${String(def.m).padStart(2,'0')}`;
    porMes[mesKey] = (porMes[mesKey] || 0) + 1;

    const sucNombre = def.suc === SUCURSAL_1 ? 'Obra Norte' : 'Obra Sur';
    console.log(`  ✅ ${def.y}/${String(def.m).padStart(2,'0')}/${String(def.d).padStart(2,'0')} — ${sucNombre} — "${def.nombre}"`);
  }

  // Resumen por mes
  console.log('\n📊 Distribución por mes:');
  const meses2025 = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  for (const m of meses2025) {
    const key   = `2025/${m}`;
    const count = porMes[key] || 0;
    const bar   = '█'.repeat(count);
    console.log(`  2025/${m}: ${bar || '—'} (${count})`);
  }
  const meses2026 = ['01','02','03','04'];
  for (const m of meses2026) {
    const key   = `2026/${m}`;
    const count = porMes[key] || 0;
    const bar   = '█'.repeat(count);
    console.log(`  2026/${m}: ${bar || '—'} (${count})`);
  }

  console.log(`\n🎉 ${MANUALES_DEF.length} auditorías manuales creadas.\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n💥 Error:', err);
  process.exit(1);
});