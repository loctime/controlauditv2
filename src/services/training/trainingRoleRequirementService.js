import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocuments,
  updateDocument
} from './trainingBaseService';
import { trainingComplianceService } from './trainingComplianceService';
import { trainingSessionService } from './trainingSessionService';
import { employeeTrainingRecordService } from './employeeTrainingRecordService';
import { empleadoService } from '../empleadoService';
import { TRAINING_COMPLIANCE_STATUSES } from '../../types/trainingDomain';

function employeeRoleId(employee) {
  return employee?.jobRoleId || employee?.puestoId || employee?.rolId || employee?.puesto || employee?.rol || null;
}

function requirementAppliesToEmployee(requirement, employee) {
  if (!requirement || !employee) return false;
  const roleId = employeeRoleId(employee);
  if (!requirement.roleId || !roleId || requirement.roleId !== roleId) return false;

  if (requirement.companyId && employee.empresaId && requirement.companyId !== employee.empresaId) return false;
  if (requirement.branchId && employee.sucursalId && requirement.branchId !== employee.sucursalId) return false;

  return true;
}

export const trainingRoleRequirementService = {
  async createJobRole(ownerId, payload) {
    return createDocument(ownerId, 'jobRoles', {
      ...payload,
      status: payload.status || 'active'
    });
  },

  async updateJobRole(ownerId, roleId, payload) {
    return updateDocument(ownerId, 'jobRole', roleId, payload);
  },

  async removeJobRole(ownerId, roleId) {
    return deleteDocument(ownerId, 'jobRole', roleId);
  },

  async getJobRoleById(ownerId, roleId) {
    return getDocument(ownerId, 'jobRole', roleId);
  },

  async listJobRoles(ownerId, filters = {}) {
    const constraints = [];
    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.status) constraints.push(buildWhere('status', '==', filters.status));
    constraints.push(buildOrderBy('updatedAt', 'desc'));
    return queryDocuments(ownerId, 'jobRoles', constraints);
  },

  async createRequirement(ownerId, payload) {
    return createDocument(ownerId, 'roleTrainingRequirements', {
      ...payload,
      source: 'role',
      status: payload.status || 'active'
    });
  },

  async updateRequirement(ownerId, requirementId, payload) {
    return updateDocument(ownerId, 'roleTrainingRequirement', requirementId, payload);
  },

  async removeRequirement(ownerId, requirementId) {
    return deleteDocument(ownerId, 'roleTrainingRequirement', requirementId);
  },

  async listRequirements(ownerId, filters = {}) {
    const constraints = [];
    if (filters.roleId) constraints.push(buildWhere('roleId', '==', filters.roleId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.branchId) constraints.push(buildWhere('branchId', '==', filters.branchId));
    if (filters.status) constraints.push(buildWhere('status', '==', filters.status));
    constraints.push(buildOrderBy('updatedAt', 'desc'));
    return queryDocuments(ownerId, 'roleTrainingRequirements', constraints);
  },

  async resolveRequirementsForEmployee(ownerId, employeeOrId) {
    const employee = typeof employeeOrId === 'string'
      ? await empleadoService.getEmpleadoById(ownerId, employeeOrId)
      : employeeOrId;

    if (!employee) return [];

    const roleId = employeeRoleId(employee);
    if (!roleId) return [];

    return this.listRequirements(ownerId, {
      roleId,
      companyId: employee.empresaId,
      branchId: employee.sucursalId,
      status: 'active'
    });
  },

  async computeMissingByRole(ownerId, { employeeId = null, branchId = null, companyId = null } = {}) {
    const employees = employeeId
      ? [await empleadoService.getEmpleadoById(ownerId, employeeId)].filter(Boolean)
      : branchId
      ? await empleadoService.getEmpleadosBySucursal(ownerId, branchId)
      : companyId
      ? await empleadoService.getEmpleadosByEmpresa(ownerId, companyId)
      : await queryDocuments(ownerId, 'empleados', [buildOrderBy('updatedAt', 'desc')]);

    if (employees.length === 0) return [];

    const records = await employeeTrainingRecordService.listByEmployees(ownerId, employees.map((e) => e.id));
    const recordsByCell = Object.fromEntries(records.map((record) => [
      `${record.employeeId}_${record.trainingTypeId}`,
      record
    ]));

    const requirements = await this.listRequirements(ownerId, {
      companyId: companyId || undefined,
      branchId: branchId || undefined,
      status: 'active'
    });

    const missing = [];

    for (const employee of employees) {
      const applicable = requirements.filter((requirement) => requirementAppliesToEmployee(requirement, employee));
      for (const requirement of applicable) {
        const key = `${employee.id}_${requirement.trainingTypeId}`;
        const record = recordsByCell[key] || null;
        const status = record?.complianceStatus || TRAINING_COMPLIANCE_STATUSES.MISSING;
        if (requirement.mandatory && status !== TRAINING_COMPLIANCE_STATUSES.COMPLIANT) {
          missing.push({
            employeeId: employee.id,
            employeeName: employee.nombreCompleto || employee.nombre || employee.displayName || employee.email || employee.id,
            roleId: employeeRoleId(employee),
            requirementId: requirement.id,
            trainingTypeId: requirement.trainingTypeId,
            frequencyMonths: requirement.frequencyMonths || null,
            complianceStatus: status,
            validUntil: record?.validUntil || null,
            branchId: employee.sucursalId || null,
            companyId: employee.empresaId || null
          });
        }
      }
    }

    return missing;
  },

  async suggestSessionsForMissing(ownerId, input = {}) {
    const missing = Array.isArray(input)
      ? input
      : await this.computeMissingByRole(ownerId, input);

    const suggestions = [];

    for (const item of missing) {
      const sessions = await trainingSessionService.listSessions(ownerId, {
        trainingTypeId: item.trainingTypeId,
        branchId: item.branchId,
        status: 'scheduled',
        dateFrom: new Date().toISOString()
      });

      suggestions.push({
        ...item,
        suggestedSessions: sessions.slice(0, 5)
      });
    }

    return suggestions;
  },

  async rebuildMatrixCellsForEmployee(ownerId, employeeId) {
    const requirements = await this.resolveRequirementsForEmployee(ownerId, employeeId);
    for (const requirement of requirements) {
      await trainingComplianceService.recomputeEmployeeTrainingRecord(ownerId, employeeId, requirement.trainingTypeId, {
        roleId: requirement.roleId
      });
    }
  }
};
