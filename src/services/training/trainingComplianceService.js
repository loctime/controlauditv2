import { Timestamp } from 'firebase/firestore';
import { createDocument } from './trainingBaseService';
import { trainingRequirementService } from './trainingRequirementService';
import { employeeTrainingRecordService } from './employeeTrainingRecordService';
import { TRAINING_COMPLIANCE_STATUSES } from '../../types/trainingDomain';

export const trainingComplianceService = {
  async buildSnapshot(ownerId, { companyId = null, branchId = null } = {}) {
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

    const ref = await createDocument(ownerId, 'trainingComplianceSnapshots', summary);
    return { id: ref.id, ...summary };
  }
};
