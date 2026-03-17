/**
 * Diagnóstico de cumplimiento de capacitaciones (server-side).
 *
 * Uso:
 *   node backend/scripts/diagnose-training-compliance.js --ownerId <OWNER_ID> [--branchId <SUCURSAL_ID>] [--companyId <EMPRESA_ID>] [--limitEmployees 50]
 *
 * No imprime credenciales.
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

function employeeRoleIdSet(employee) {
  const candidates = [
    employee?.jobRoleId,
    employee?.puestoId,
    employee?.rolId,
    employee?.puesto,
    employee?.rol
  ].map(normalizeId).filter(Boolean);
  return new Set(candidates);
}

function ruleRoleId(rule) {
  return normalizeId(rule?.roleId || rule?.jobRoleId || rule?.puestoId || rule?.rolId || rule?.puesto || rule?.rol || null);
}

function ruleBranchId(rule) {
  return normalizeId(rule?.branchId || rule?.sucursalId || null);
}

function ruleCompanyId(rule) {
  return normalizeId(rule?.companyId || rule?.empresaId || null);
}

function ruleTrainingTypeId(rule) {
  return normalizeId(rule?.trainingTypeId || null);
}

function applies(rule, employee, { companyId = null, branchId = null } = {}) {
  const roleIds = employeeRoleIdSet(employee);
  const rid = ruleRoleId(rule);
  const okRole = !rid || roleIds.has(rid);

  const employeeCompanyId = normalizeId(employee?.empresaId || companyId || null);
  const employeeBranchId = normalizeId(employee?.sucursalId || branchId || null);

  const rb = ruleBranchId(rule);
  const rc = ruleCompanyId(rule);
  const okBranch = !rb || !employeeBranchId || rb === employeeBranchId;
  const okCompany = !rc || !employeeCompanyId || rc === employeeCompanyId;

  return okRole && okBranch && okCompany;
}

function ownersPath(ownerId, collectionName) {
  return `apps/auditoria/owners/${ownerId}/${collectionName}`;
}

function summarizeRules(rules = [], catalogIds = new Set()) {
  const trainingTypeIds = rules.map(ruleTrainingTypeId).filter(Boolean);
  const notInCatalog = trainingTypeIds.filter((id) => !catalogIds.has(id));
  return {
    total: rules.length,
    withRole: rules.filter((r) => ruleRoleId(r)).length,
    withBranch: rules.filter((r) => ruleBranchId(r)).length,
    withCompany: rules.filter((r) => ruleCompanyId(r)).length,
    trainingTypeIdsNotInCatalog: notInCatalog.length
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ownerId = args.ownerId || args.owner || null;
  const branchId = args.branchId ? String(args.branchId) : null;
  const companyId = args.companyId ? String(args.companyId) : null;
  const limitEmployees = Math.max(1, Math.min(500, Number(args.limitEmployees || 50)));

  if (!ownerId) {
    console.error('Falta --ownerId');
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
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();

  // 1) Catálogo activo (ids)
  const catalogSnap = await db
    .collection(ownersPath(ownerId, 'training_catalog'))
    .where('status', '==', 'active')
    .get();
  const catalog = catalogSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const catalogIds = new Set(catalog.map((c) => normalizeId(c.id)).filter(Boolean));

  // 2) Reglas (dos fuentes existentes en tu codebase)
  let rulesMatrixQuery = db
    .collection(ownersPath(ownerId, 'training_requirement_matrix'))
    .where('status', '==', 'active');
  if (branchId) rulesMatrixQuery = rulesMatrixQuery.where('branchId', '==', branchId);
  if (companyId) rulesMatrixQuery = rulesMatrixQuery.where('companyId', '==', companyId);
  const rulesMatrixSnap = await rulesMatrixQuery.get();
  const rulesMatrix = rulesMatrixSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let rulesRoleQuery = db
    .collection(ownersPath(ownerId, 'role_training_requirements'))
    .where('status', '==', 'active');
  if (branchId) rulesRoleQuery = rulesRoleQuery.where('branchId', '==', branchId);
  if (companyId) rulesRoleQuery = rulesRoleQuery.where('companyId', '==', companyId);
  const rulesRoleSnap = await rulesRoleQuery.get();
  const rulesRole = rulesRoleSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 3) Empleados (si hay sucursal, filtrar; si no, tomar últimos N)
  let employeesQuery = db.collection(ownersPath(ownerId, 'empleados'));
  if (branchId) {
    employeesQuery = employeesQuery.where('sucursalId', '==', branchId);
  }
  employeesQuery = employeesQuery.orderBy('updatedAt', 'desc').limit(limitEmployees);
  const employeesSnap = await employeesQuery.get();
  const employees = employeesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const perEmployee = employees.map((e) => {
    const applicableMatrix = rulesMatrix.filter((r) => applies(r, e, { companyId, branchId }));
    const applicableRole = rulesRole.filter((r) => applies(r, e, { companyId, branchId }));
    const required = new Set([
      ...applicableMatrix.map(ruleTrainingTypeId).filter(Boolean),
      ...applicableRole.map(ruleTrainingTypeId).filter(Boolean)
    ]);
    const requiredInCatalog = Array.from(required).filter((id) => catalogIds.has(id));

    return {
      employeeId: e.id,
      sucursalId: e.sucursalId || null,
      empresaId: e.empresaId || null,
      roles: Array.from(employeeRoleIdSet(e)).join(', ') || '(sin rol)',
      rulesMatrixAplicables: applicableMatrix.length,
      rulesRoleAplicables: applicableRole.length,
      requiredTrainingTypes: required.size,
      requiredInCatalog: requiredInCatalog.length
    };
  });

  const summary = {
    ownerId,
    branchId,
    companyId,
    catalogActive: catalog.length,
    rulesTrainingRequirementMatrix: summarizeRules(rulesMatrix, catalogIds),
    rulesRoleTrainingRequirements: summarizeRules(rulesRole, catalogIds),
    employeesLoaded: employees.length,
    employeesWithNoRole: employees.filter((e) => employeeRoleIdSet(e).size === 0).length,
    employeesWithZeroApplicableRules: perEmployee.filter((row) => row.rulesMatrixAplicables + row.rulesRoleAplicables === 0).length,
    employeesWithZeroRequiredInCatalog: perEmployee.filter((row) => row.requiredInCatalog === 0).length
  };

  console.log('\n=== diagnose-training-compliance ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log('\nTabla por empleado (muestra hasta 50 filas en consola):');
  console.table(perEmployee.slice(0, 50));

  console.log('\nMuestra reglas (training_requirement_matrix) [max 3]:');
  console.log(rulesMatrix.slice(0, 3).map((r) => ({
    id: r.id,
    trainingTypeId: r.trainingTypeId ?? null,
    roleId: r.roleId ?? r.jobRoleId ?? null,
    companyId: r.companyId ?? r.empresaId ?? null,
    branchId: r.branchId ?? r.sucursalId ?? null,
    status: r.status ?? null
  })));

  console.log('\nMuestra reglas (role_training_requirements) [max 3]:');
  console.log(rulesRole.slice(0, 3).map((r) => ({
    id: r.id,
    trainingTypeId: r.trainingTypeId ?? null,
    roleId: r.roleId ?? r.jobRoleId ?? null,
    companyId: r.companyId ?? r.empresaId ?? null,
    branchId: r.branchId ?? r.sucursalId ?? null,
    status: r.status ?? null
  })));

  console.log('\n✅ Listo. Si rules=0 o requiredInCatalog=0, ahí está la causa del rows=0 en reportes.');
}

main().catch((err) => {
  console.error('❌ Error ejecutando diagnóstico:', err?.message || err);
  process.exitCode = 1;
});

