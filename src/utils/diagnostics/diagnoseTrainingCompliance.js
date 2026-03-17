import { empleadoService } from '@/services/empleadoService';
import {
  trainingCatalogService,
  trainingRequirementService,
  trainingRoleRequirementService
} from '@/services/training';

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

/**
 * Diagnóstico para explicar por qué buildMatrix devuelve rows=0.
 * Se ejecuta en el browser (usa SDK cliente) y loguea en consola.
 */
export async function diagnoseTrainingCompliance({ ownerId, branchId = null, companyId = null } = {}) {
  // eslint-disable-next-line no-console
  console.log('[diagnoseTrainingCompliance] start', { ownerId, branchId, companyId });
  if (!ownerId) {
    // eslint-disable-next-line no-console
    console.warn('[diagnoseTrainingCompliance] ownerId requerido');
    return { ok: false, reason: 'missing_ownerId' };
  }

  const [catalogActive, rulesMatrix, rulesByRole, employees] = await Promise.all([
    trainingCatalogService.listActive(ownerId).catch(() => []),
    trainingRequirementService.listRules(ownerId, {
      companyId: companyId || undefined,
      branchId: branchId || undefined,
      status: 'active'
    }).catch(() => []),
    trainingRoleRequirementService.listRequirements(ownerId, {
      companyId: companyId || undefined,
      branchId: branchId || undefined,
      status: 'active'
    }).catch(() => []),
    branchId
      ? empleadoService.getEmpleadosBySucursal(ownerId, branchId).catch(() => [])
      : Promise.resolve([])
  ]);

  const catalogIds = new Set((catalogActive || []).map((c) => normalizeId(c.id)).filter(Boolean));

  const summarizeRules = (rules) => ({
    total: rules.length,
    withRole: rules.filter((r) => ruleRoleId(r)).length,
    withBranch: rules.filter((r) => ruleBranchId(r)).length,
    withCompany: rules.filter((r) => ruleCompanyId(r)).length,
    trainingTypeIdsNotInCatalog: rules
      .map((r) => ruleTrainingTypeId(r))
      .filter(Boolean)
      .filter((id) => !catalogIds.has(id)).length
  });

  const perEmployee = (employees || []).map((e) => {
    const applicableMatrix = (rulesMatrix || []).filter((r) => applies(r, e, { companyId, branchId }));
    const applicableRole = (rulesByRole || []).filter((r) => applies(r, e, { companyId, branchId }));
    const requiredIds = new Set([
      ...applicableMatrix.map((r) => ruleTrainingTypeId(r)).filter(Boolean),
      ...applicableRole.map((r) => ruleTrainingTypeId(r)).filter(Boolean)
    ]);

    const requiredInCatalog = Array.from(requiredIds).filter((id) => catalogIds.has(id));

    return {
      employeeId: e.id,
      nombre: e.nombreCompleto || `${e.apellido || ''} ${e.nombre || ''}`.trim(),
      sucursalId: e.sucursalId || null,
      empresaId: e.empresaId || null,
      roles: Array.from(employeeRoleIdSet(e)).join(', ') || '(sin rol)',
      rulesMatrixAplicables: applicableMatrix.length,
      rulesRoleAplicables: applicableRole.length,
      requiredTrainingTypes: requiredIds.size,
      requiredInCatalog: requiredInCatalog.length
    };
  });

  const summary = {
    catalogActive: (catalogActive || []).length,
    rulesTrainingRequirementMatrix: summarizeRules(rulesMatrix || []),
    rulesRoleTrainingRequirements: summarizeRules(rulesByRole || []),
    employeesLoaded: (employees || []).length,
    employeesWithNoRole: (employees || []).filter((e) => employeeRoleIdSet(e).size === 0).length,
    employeesWithZeroApplicableRules: perEmployee.filter((row) => row.rulesMatrixAplicables + row.rulesRoleAplicables === 0).length,
    employeesWithZeroRequiredInCatalog: perEmployee.filter((row) => row.requiredInCatalog === 0).length
  };

  // eslint-disable-next-line no-console
  console.log('[diagnoseTrainingCompliance] summary', summary);
  // eslint-disable-next-line no-console
  console.table(perEmployee);
  // eslint-disable-next-line no-console
  console.log('[diagnoseTrainingCompliance] sample rules (trainingRequirementMatrix)', (rulesMatrix || []).slice(0, 5));
  // eslint-disable-next-line no-console
  console.log('[diagnoseTrainingCompliance] sample rules (roleTrainingRequirements)', (rulesByRole || []).slice(0, 5));

  return { ok: true, summary, perEmployee };
}

