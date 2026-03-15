import { collection, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { setDocWithAppId, addDocWithAppId } from '../../firebase/firestoreAppWriter';
import { trainingAttendanceService } from './trainingAttendanceService';
import { trainingComplianceService } from './trainingComplianceService';
import { formatPeriodKey } from './trainingPeriodUtils';

function toTimestamp(value) {
  if (!value) return Timestamp.now();
  if (value?.toDate) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Timestamp.now();
  return Timestamp.fromDate(date);
}

function normalizeLegacyState(legacyState) {
  if (legacyState === 'completada') return 'closed';
  if (legacyState === 'activa') return 'scheduled';
  return 'draft';
}

function periodFromTimestamp(value) {
  const date = toTimestamp(value).toDate();
  return {
    periodType: 'monthly',
    periodYear: date.getFullYear(),
    periodMonth: date.getMonth() + 1,
    periodKey: formatPeriodKey(date.getFullYear(), date.getMonth() + 1)
  };
}

export const trainingMigrationService = {
  async migrateOwner(ownerId) {
    if (!ownerId) throw new Error('ownerId is required');

    const summary = {
      sessionsMigrated: 0,
      planItemsMigrated: 0,
      attendanceMigrated: 0,
      evidenceMigrated: 0,
      periodResultsRebuilt: 0,
      employeeRecordsRebuilt: 0
    };

    const trainingSessionsRef = collection(dbAudit, ...firestoreRoutesCore.trainingSessions(ownerId));
    const trainingPlanItemsRef = collection(dbAudit, ...firestoreRoutesCore.trainingPlanItems(ownerId));
    const trainingEvidenceRef = collection(dbAudit, ...firestoreRoutesCore.trainingEvidence(ownerId));

    const legacyCapacitacionesSnap = await getDocs(collection(dbAudit, ...firestoreRoutesCore.capacitaciones(ownerId)));

    for (const legacyDoc of legacyCapacitacionesSnap.docs) {
      const cap = legacyDoc.data();
      const sessionRef = doc(trainingSessionsRef, legacyDoc.id);
      const sessionPeriod = periodFromTimestamp(cap.fechaRealizada || cap.fechaCompletada || cap.fechaCreacion || cap.createdAt);

      await setDocWithAppId(sessionRef, {
        trainingTypeId: cap.capacitacionTipoId || cap.tipo || 'legacy_training',
        companyId: cap.empresaId || null,
        branchId: cap.sucursalId || null,
        scheduledDate: toTimestamp(cap.fechaRealizada || cap.fechaCreacion || cap.createdAt),
        executedDate: toTimestamp(cap.fechaRealizada || cap.fechaCompletada || cap.createdAt),
        ...sessionPeriod,
        instructorId: cap.instructor || null,
        location: cap.ubicacion || null,
        modality: cap.modalidad || 'in_person',
        status: normalizeLegacyState(cap.estado),
        migratedFromLegacy: true,
        legacyCapacitacionId: legacyDoc.id,
        createdAt: cap.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });

      summary.sessionsMigrated += 1;

      const legacyRegistros = await getDocs(query(
        collection(dbAudit, ...firestoreRoutesCore.registrosAsistencia(ownerId)),
        where('capacitacionId', '==', legacyDoc.id)
      ));

      for (const registroDoc of legacyRegistros.docs) {
        const registro = registroDoc.data();
        const employeeIds = Array.isArray(registro.empleadoIds) ? registro.empleadoIds : [];

        for (const employeeId of employeeIds) {
          const attendancePeriod = periodFromTimestamp(registro.fecha || cap.fechaRealizada || cap.fechaCompletada || cap.createdAt);
          const attRef = doc(dbAudit, ...firestoreRoutesCore.trainingSessionAttendanceItem(ownerId, legacyDoc.id, employeeId));
          await setDocWithAppId(attRef, {
            employeeId,
            sessionId: legacyDoc.id,
            trainingTypeId: cap.capacitacionTipoId || cap.tipo || 'legacy_training',
            companyId: cap.empresaId || null,
            branchId: cap.sucursalId || null,
            ...attendancePeriod,
            attendanceStatus: 'present',
            evaluationStatus: 'not_applicable',
            evidenceIds: [],
            validFrom: toTimestamp(registro.fecha || cap.fechaRealizada),
            validUntil: null,
            migratedFromLegacy: true,
            legacyRegistroId: registroDoc.id,
            createdAt: registro.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now()
          }, { merge: true });

          summary.attendanceMigrated += 1;
        }

        if (Array.isArray(registro.imagenes)) {
          for (const img of registro.imagenes) {
            await addDocWithAppId(trainingEvidenceRef, {
              evidenceType: 'photo',
              sessionId: legacyDoc.id,
              employeeId: null,
              fileReference: img.fileId || img.id || img.shareToken || null,
              shareToken: img.shareToken || null,
              notes: img.nombre || 'Migrated legacy evidence',
              uploadedAt: toTimestamp(img.createdAt || registro.fecha),
              uploadedBy: registro.creadoPor || ownerId,
              migratedFromLegacy: true,
              legacyRegistroId: registroDoc.id
            });
            summary.evidenceMigrated += 1;
          }
        }
      }
    }

    const legacyPlansSnap = await getDocs(collection(dbAudit, ...firestoreRoutesCore.planesCapacitacionesAnuales(ownerId)));

    for (const planDoc of legacyPlansSnap.docs) {
      const plan = planDoc.data();
      const planItems = Array.isArray(plan.capacitaciones) ? plan.capacitaciones : [];

      for (const item of planItems) {
        await addDocWithAppId(trainingPlanItemsRef, {
          planId: planDoc.id,
          trainingTypeId: item.id || item.nombre || 'legacy_training_type',
          plannedMonth: item.mes || null,
          plannedYear: Number(plan.year || 0) || null,
          periodType: 'monthly',
          periodYear: Number(plan.year || 0) || null,
          periodMonth: item.mes || null,
          periodKey: plan.year && item.mes ? formatPeriodKey(plan.year, item.mes) : null,
          companyId: plan.empresaId || null,
          branchId: plan.sucursalId || null,
          targetAudience: item.targetAudience || 'legacy',
          estimatedParticipants: Array.isArray(item.empleadosAsistieron) ? item.empleadosAsistieron.length : 0,
          priority: item.priority || 'medium',
          notes: 'Migrated from planes_capacitaciones_anuales.capacitaciones[]',
          status: 'planned',
          migratedFromLegacy: true,
          legacyPlanId: planDoc.id,
          legacyItemId: item.id || null
        });

        summary.planItemsMigrated += 1;
      }
    }

    const migratedSessionsSnap = await getDocs(collection(dbAudit, ...firestoreRoutesCore.trainingSessions(ownerId)));
    for (const sessionDoc of migratedSessionsSnap.docs) {
      const session = { id: sessionDoc.id, ...sessionDoc.data() };
      await trainingAttendanceService.materializeEmployeeRecord(ownerId, session.id, session);
      summary.periodResultsRebuilt += 1;
    }

    const attendanceByEmployeeSnap = await getDocs(collection(dbAudit, ...firestoreRoutesCore.trainingAttendanceByEmployee(ownerId)));
    const uniquePairs = new Map();
    attendanceByEmployeeSnap.docs.forEach((item) => {
      const data = item.data();
      if (!data.employeeId || !data.trainingTypeId) return;
      uniquePairs.set(`${data.employeeId}_${data.trainingTypeId}`, {
        employeeId: data.employeeId,
        trainingTypeId: data.trainingTypeId,
        companyId: data.companyId || null,
        branchId: data.branchId || null
      });
    });

    for (const pair of uniquePairs.values()) {
      await trainingComplianceService.recomputeEmployeeTrainingRecord(
        ownerId,
        pair.employeeId,
        pair.trainingTypeId,
        {
          companyId: pair.companyId,
          branchId: pair.branchId
        }
      );
      summary.employeeRecordsRebuilt += 1;
    }

    return summary;
  }
};
