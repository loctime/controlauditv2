import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  queryDocuments,
  updateDocument
} from './trainingBaseService';
import { employeeTrainingRecordService } from './employeeTrainingRecordService';
import { empleadoService } from '../empleadoService';
import { TRAINING_COMPLIANCE_STATUSES } from '../../types/trainingDomain';

export const trainingRiskComplianceService = {
  async createRequirement(ownerId, payload) {
    return createDocument(ownerId, 'riskTrainingRequirements', {
      ...payload,
      source: 'risk',
      status: payload.status || 'active'
    });
  },

  async updateRequirement(ownerId, requirementId, payload) {
    return updateDocument(ownerId, 'riskTrainingRequirement', requirementId, payload);
  },

  async removeRequirement(ownerId, requirementId) {
    return deleteDocument(ownerId, 'riskTrainingRequirement', requirementId);
  },

  async listRequirements(ownerId, filters = {}) {
    const constraints = [];
    if (filters.riskId) constraints.push(buildWhere('riskId', '==', filters.riskId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.branchId) constraints.push(buildWhere('branchId', '==', filters.branchId));
    if (filters.status) constraints.push(buildWhere('status', '==', filters.status));

    constraints.push(buildOrderBy('updatedAt', 'desc'));
    return queryDocuments(ownerId, 'riskTrainingRequirements', constraints);
  },

  async resolveTrainingForRisk(ownerId, riskId, filters = {}) {
    return this.listRequirements(ownerId, {
      ...filters,
      riskId,
      status: filters.status || 'active'
    });
  },

  async computeComplianceByRisk(ownerId, { riskIds = [], branchId = null, companyId = null } = {}) {
    const requirements = await this.listRequirements(ownerId, {
      branchId: branchId || undefined,
      companyId: companyId || undefined,
      status: 'active'
    });

    const filteredRequirements = riskIds.length > 0
      ? requirements.filter((item) => riskIds.includes(item.riskId))
      : requirements;

    const employees = branchId
      ? await empleadoService.getEmpleadosBySucursal(ownerId, branchId)
      : companyId
      ? await empleadoService.getEmpleadosByEmpresa(ownerId, companyId)
      : await queryDocuments(ownerId, 'empleados', [buildOrderBy('updatedAt', 'desc')]);

    if (employees.length === 0 || filteredRequirements.length === 0) {
      return {
        totals: {
          risks: 0,
          requirements: filteredRequirements.length,
          exposureCount: 0,
          compliantCount: 0,
          nonCompliantCount: 0
        },
        rows: []
      };
    }

    const records = await employeeTrainingRecordService.listByEmployees(ownerId, employees.map((employee) => employee.id));
    const recordsByCell = Object.fromEntries(records.map((record) => [`${record.employeeId}_${record.trainingTypeId}`, record]));

    const grouped = {};

    for (const requirement of filteredRequirements) {
      const riskId = requirement.riskId || 'unmapped_risk';
      if (!grouped[riskId]) {
        grouped[riskId] = {
          riskId,
          requirements: 0,
          compliant: 0,
          nonCompliant: 0,
          exposedEmployees: employees.length
        };
      }

      grouped[riskId].requirements += 1;

      for (const employee of employees) {
        const cellKey = `${employee.id}_${requirement.trainingTypeId}`;
        const record = recordsByCell[cellKey];
        const status = record?.complianceStatus || TRAINING_COMPLIANCE_STATUSES.MISSING;
        if (status === TRAINING_COMPLIANCE_STATUSES.COMPLIANT) {
          grouped[riskId].compliant += 1;
        } else {
          grouped[riskId].nonCompliant += 1;
        }
      }
    }

    const rows = Object.values(grouped).map((row) => ({
      ...row,
      compliancePercent: row.requirements > 0
        ? Math.round((row.compliant / (row.requirements * row.exposedEmployees || 1)) * 100)
        : 0
    }));

    const totals = rows.reduce((acc, row) => {
      acc.risks += 1;
      acc.requirements += row.requirements;
      acc.exposureCount += row.exposedEmployees;
      acc.compliantCount += row.compliant;
      acc.nonCompliantCount += row.nonCompliant;
      return acc;
    }, {
      risks: 0,
      requirements: 0,
      exposureCount: 0,
      compliantCount: 0,
      nonCompliantCount: 0
    });

    return { totals, rows };
  }
};
