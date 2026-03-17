import { Timestamp } from 'firebase/firestore';
import {
  createDocument,
  queryDocuments,
  buildOrderBy
} from './trainingBaseService';
import { trainingRequirementService } from './trainingRequirementService';
import { employeeTrainingRecordService } from './employeeTrainingRecordService';
import { trainingCatalogService } from './trainingCatalogService';
import { TRAINING_COMPLIANCE_STATUSES, getTrainingRecordId } from '../../types/trainingDomain';
import { empleadoService } from '../empleadoService';

function complianceFromRecord(record) {
  if (!record) {
    return {
      complianceStatus: TRAINING_COMPLIANCE_STATUSES.MISSING,
      validUntil: null,
      validFrom: null,
      daysToExpire: null,
      lastSessionId: null,
      lastResult: 'missing',
      lastAttendanceStatus: 'missing',
      lastPeriodKey: null,
      lastPeriodResultId: null
    };
  }

  return {
    complianceStatus: record.complianceStatus || TRAINING_COMPLIANCE_STATUSES.MISSING,
    validUntil: record.validUntil || null,
    validFrom: record.validFrom || null,
    daysToExpire: record.daysToExpire ?? null,
    lastSessionId: record.lastSessionId || null,
    lastResult: record.lastAttendanceStatus || record.lastResult || 'pending',
    lastAttendanceStatus: record.lastAttendanceStatus || record.lastResult || 'pending',
    lastPeriodKey: record.lastPeriodKey || null,
    lastPeriodResultId: record.lastPeriodResultId || null
  };
}

function roleCandidate(employee) {
  return employee?.jobRoleId || employee?.puestoId || employee?.rolId || employee?.puesto || employee?.rol || null;
}

function mapById(items = []) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function normalizeRuleRoleId(rule) {
  return rule?.roleId || rule?.jobRoleId || rule?.puestoId || rule?.rolId || rule?.puesto || rule?.rol || null;
}

function normalizeId(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value != null) {
    if (value.id != null) return String(value.id);
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

export const trainingComplianceService = {
  async buildSnapshot(ownerId, { companyId = null, branchId = null, persistSnapshot = false } = {}) {
    const [rules, expiring] = await Promise.all([
      trainingRequirementService.listRules(ownerId, {
        companyId: companyId || undefined,
        branchId: branchId || undefined,
        status: 'active'
      }),
      employeeTrainingRecordService.listExpiring(ownerId, branchId || undefined)
    ]);

    const summary = {
      generatedAt: Timestamp.now(),
      companyId,
      branchId,
      totalRules: rules.length,
      expiringSoon: expiring.filter((r) => r.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON).length,
      expired: expiring.filter((r) => r.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED).length,
      rulesByTrainingType: rules.reduce((acc, rule) => {
        acc[rule.trainingTypeId] = (acc[rule.trainingTypeId] || 0) + 1;
        return acc;
      }, {})
    };

    if (persistSnapshot) {
      const ref = await createDocument(ownerId, 'trainingComplianceSnapshots', summary);
      return { id: ref.id, ...summary };
    }

    return summary;
  },

  async recomputeEmployeeTrainingRecord(ownerId, employeeId, trainingTypeId, metadata = {}) {
    return employeeTrainingRecordService.recomputeEmployeeRecord(
      ownerId,
      employeeId,
      trainingTypeId,
      metadata
    );
  },

  async getEmployeeCompliance(ownerId, employeeId, filters = {}) {
    const records = await employeeTrainingRecordService.listByEmployee(ownerId, employeeId);
    let result = records.map((record) => ({
      id: getTrainingRecordId(record.employeeId, record.trainingTypeId),
      employeeId: record.employeeId,
      trainingTypeId: record.trainingTypeId,
      companyId: record.companyId || null,
      branchId: record.branchId || null,
      ...complianceFromRecord(record),
      sourceRecordId: record.id,
      sources: record.sources || []
    }));

    if (filters.complianceStatuses?.length) {
      result = result.filter((r) => filters.complianceStatuses.includes(r.complianceStatus));
    }
    if (filters.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  },

  async buildMatrix(ownerId, {
    companyId = null,
    branchId = null,
    employeeIds = [],
    trainingTypeIds = [],
    asOfDate = new Date().toISOString(),
    page = 1,
    pageSize = 50,
    persist = false
  } = {}) {
    const [catalog, employees, rules] = await Promise.all([
      trainingCatalogService.listActive(ownerId),
      (async () => {
        if (employeeIds?.length > 0) {
          const deduped = Array.from(new Set(employeeIds));
          const all = await Promise.all(deduped.map((id) => empleadoService.getEmpleadoById(ownerId, id)));
          return all.filter(Boolean);
        }

        if (branchId) return empleadoService.getEmpleadosBySucursal(ownerId, branchId);
        if (companyId) return empleadoService.getEmpleadosByEmpresa(ownerId, companyId);
        return queryDocuments(ownerId, 'empleados', [buildOrderBy('updatedAt', 'desc')]);
      })(),
      trainingRequirementService.listRules(ownerId, {
        companyId: companyId || undefined,
        branchId: branchId || undefined,
        status: 'active'
      }).catch(() => [])
    ]);

    const catalogById = mapById(catalog || []);
    const trainingTypeFilterSet = trainingTypeIds?.length > 0 ? new Set(trainingTypeIds) : null;

    // Optimización: indexar reglas por roleId (incluye null/global)
    const rulesByRole = (rules || []).reduce((acc, rule) => {
      const roleKey = normalizeRuleRoleId(rule) || '*';
      if (!acc[roleKey]) acc[roleKey] = [];
      acc[roleKey].push(rule);
      return acc;
    }, {});

    const totalEmployees = employees.length;
    const safePageSize = Math.max(1, Math.min(500, pageSize));
    const safePage = Math.max(1, page);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize;
    const employeesPage = employees.slice(from, to);

    const records = await employeeTrainingRecordService.listByEmployees(ownerId, employeesPage.map((e) => e.id));
    const recordsByCellId = mapById(records.map((record) => ({
      id: getTrainingRecordId(record.employeeId, record.trainingTypeId),
      ...record
    })));

    const matrix = [];

    for (const employee of employeesPage) {
      const roleId = roleCandidate(employee);
      const roleIds = employeeRoleIdSet(employee);
      const employeeCompanyId = normalizeId(employee?.empresaId || companyId || null);
      const employeeBranchId = normalizeId(employee?.sucursalId || branchId || null);

      const candidateRules = [];
      // Reunir reglas de todos los posibles IDs de rol del empleado
      roleIds.forEach((rid) => {
        if (rulesByRole[rid]?.length) candidateRules.push(...rulesByRole[rid]);
      });
      if (rulesByRole['*']?.length) candidateRules.push(...rulesByRole['*']);

      // Capacitación requerida SOLO si matchea alcance (role/company/branch) del empleado.
      const requiredTrainingTypeIds = Array.from(new Set(
        candidateRules
          .filter((rule) => {
            const ruleRoleId = normalizeRuleRoleId(rule);
            const okRole = !ruleRoleId || roleIds.has(normalizeId(ruleRoleId));
            // Mantener compatibilidad con lógica existente: solo descartar si ambos lados existen y no coinciden.
            const ruleBranchId = normalizeId(rule.branchId || rule.sucursalId || null);
            const ruleCompanyId = normalizeId(rule.companyId || rule.empresaId || null);
            const okBranch = !ruleBranchId || !employeeBranchId || ruleBranchId === employeeBranchId;
            const okCompany = !ruleCompanyId || !employeeCompanyId || ruleCompanyId === employeeCompanyId;
            return okRole && okBranch && okCompany;
          })
          .map((rule) => normalizeId(rule.trainingTypeId))
          .filter(Boolean)
          .filter((id) => (trainingTypeFilterSet ? trainingTypeFilterSet.has(id) : true))
      ));

      // Caso sin reglas: no generar filas para ese empleado.
      if (requiredTrainingTypeIds.length === 0) continue;

      for (const trainingTypeId of requiredTrainingTypeIds) {
        const trainingType = catalogById[trainingTypeId];
        if (!trainingType) continue;

        const cellId = getTrainingRecordId(employee.id, trainingType.id);
        const record = recordsByCellId[cellId] || null;
        const normalized = {
          id: cellId,
          employeeId: employee.id,
          employeeName: employee.nombreCompleto || employee.nombre || employee.displayName || employee.email || employee.id,
          roleId,
          trainingTypeId: trainingType.id,
          trainingTypeName: trainingType.name || trainingType.id,
          companyId: employeeCompanyId || record?.companyId || null,
          branchId: employeeBranchId || record?.branchId || null,
          ...complianceFromRecord(record),
          sourceRecordId: record?.id || null,
          sources: record?.sources || []
        };

        matrix.push(normalized);
      }
    }

    return {
      generatedAt: Timestamp.now(),
      asOfDate,
      page: safePage,
      pageSize: safePageSize,
      totalEmployees,
      totalTrainingTypes: (catalog || []).length,
      totalCells: matrix.length,
      rows: matrix
    };
  }
};


