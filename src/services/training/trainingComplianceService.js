import { Timestamp } from 'firebase/firestore';
import {
  createDocument,
  queryDocuments
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
    const [catalog, employees] = await Promise.all([
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
      })()
    ]);

    const filteredTrainingTypes = trainingTypeIds?.length > 0
      ? catalog.filter((item) => trainingTypeIds.includes(item.id))
      : catalog;

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
      for (const trainingType of filteredTrainingTypes) {
        const cellId = getTrainingRecordId(employee.id, trainingType.id);
        const record = recordsByCellId[cellId] || null;
        const normalized = {
          id: cellId,
          employeeId: employee.id,
          employeeName: employee.nombreCompleto || employee.nombre || employee.displayName || employee.email || employee.id,
          roleId,
          trainingTypeId: trainingType.id,
          trainingTypeName: trainingType.name || trainingType.id,
          companyId: employee.empresaId || record?.companyId || companyId || null,
          branchId: employee.sucursalId || record?.branchId || branchId || null,
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
      totalTrainingTypes: filteredTrainingTypes.length,
      totalCells: totalEmployees * filteredTrainingTypes.length,
      rows: matrix
    };
  }
};


