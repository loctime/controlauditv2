/**
 * MIGRATE ATTENDANCE TO FLAT COLLECTION
 * -------------------------------------------------------
 * Copia los registros de asistencia desde la subcolección de sesiones 
 * hacia la colección plana training_attendance_by_employee.
 *
 * USO:
 *   1. serviceAccountKey-controlfile.json en esta misma carpeta
 *   2. node migrate-attendance-to-flat.js
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey-controlfile.json');

// CONFIG
const OWNER_ID = 'oemyRkkbneaYgG45I1PPiv99z9B3';
const APP_ID   = 'auditoria';
const BASE     = `apps/${APP_ID}/owners/${OWNER_ID}`;

// INIT
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// HELPERS
const p = (...segs) => `${BASE}/${segs.join('/')}`;

// MAIN
async function migrateAttendance() {
  console.log('\n MIGRATE ATTENDANCE TO FLAT COLLECTION');
  console.log('='.repeat(55));

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalSessions = 0;
  let totalAttendanceRecords = 0;

  try {
    // 1. Leer todos los documentos de training_sessions del owner
    console.log('\n Leyendo training_sessions...');
    const sessionsSnapshot = await db.collection(p('training_sessions')).get();
    totalSessions = sessionsSnapshot.size;
    console.log(`   Encontradas ${totalSessions} sesiones`);

    // 2. Para cada sesión, leer su subcolección attendance/
    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionId = sessionDoc.id;
      const sessionData = sessionDoc.data();
      
      console.log(`\n Procesando sesión: ${sessionId} (${sessionData.trainingTypeId})`);
      
      const attendanceSnapshot = await db.collection(p('training_sessions', sessionId, 'attendance')).get();
      totalAttendanceRecords += attendanceSnapshot.size;
      
      console.log(`   Encontrados ${attendanceSnapshot.size} registros de asistencia`);

      // 3. Para cada documento de asistencia, escribirlo en training_attendance_by_employee
      for (const attendanceDoc of attendanceSnapshot.docs) {
        const employeeId = attendanceDoc.id;
        const attendanceData = attendanceDoc.data();
        
        // ID para el nuevo documento: {employeeId}_{sessionId}
        const newDocId = `${employeeId}_${sessionId}`;
        const targetRef = db.doc(p('training_attendance_by_employee', newDocId));
        
        // 4. Verificar si ya existe
        const existingDoc = await targetRef.get();
        
        if (existingDoc.exists) {
          console.log(`   Saltando ${newDocId} - ya existe`);
          totalSkipped++;
        } else {
          // Preparar datos para la colección plana
          const flatData = {
            ...attendanceData,
            id: newDocId,
            // Mantener todos los campos originales
            employeeId: attendanceData.employeeId,
            sessionId: attendanceData.sessionId,
            trainingTypeId: attendanceData.trainingTypeId,
            companyId: attendanceData.companyId,
            branchId: attendanceData.branchId,
            planId: attendanceData.planId,
            planItemId: attendanceData.planItemId,
            attended: attendanceData.attended,
            attendanceStatus: attendanceData.attendanceStatus,
            evaluationStatus: attendanceData.evaluationStatus,
            requiresEvaluation: attendanceData.requiresEvaluation,
            score: attendanceData.score,
            validFrom: attendanceData.validFrom,
            validUntil: attendanceData.validUntil,
            employeeSignature: attendanceData.employeeSignature,
            instructorSignature: attendanceData.instructorSignature,
            notes: attendanceData.notes,
            evidenceIds: attendanceData.evidenceIds || [],
            certificateId: attendanceData.certificateId,
            sourceSessionStatus: attendanceData.sourceSessionStatus,
            sourceExecutedDate: attendanceData.sourceExecutedDate,
            periodType: attendanceData.periodType,
            periodYear: attendanceData.periodYear,
            periodMonth: attendanceData.periodMonth,
            periodKey: attendanceData.periodKey,
            isDeleted: attendanceData.isDeleted,
            attendanceTakenAt: attendanceData.attendanceTakenAt,
            correctedAt: attendanceData.correctedAt,
            correctedBy: attendanceData.correctedBy,
            appId: attendanceData.appId,
            ownerId: attendanceData.ownerId,
            createdAt: attendanceData.createdAt,
            updatedAt: attendanceData.updatedAt,
          };

          // Escribir sin sobreescribir
          await targetRef.set(flatData, { merge: false });
          console.log(`   Migrado ${newDocId}`);
          totalMigrated++;
        }
      }
    }

    // 5. Mostrar resultados
    console.log('\n' + '='.repeat(55));
    console.log(' MIGRACIÓN COMPLETADA\n');
    console.log(' RESUMEN:');
    console.log(`   Total sesiones procesadas:     ${totalSessions}`);
    console.log(`   Total registros de asistencia: ${totalAttendanceRecords}`);
    console.log(`   Documentos migrados:           ${totalMigrated}`);
    console.log(`   Documentos saltados:           ${totalSkipped}`);
    console.log(`   Total documentos escritos:     ${totalMigrated}`);
    console.log('\n Proceso finalizado exitosamente.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n Error durante la migración:', error);
    process.exit(1);
  }
}

migrateAttendance();
