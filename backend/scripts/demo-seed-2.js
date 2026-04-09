/**
 * SEED DEMO 2 — ControlAudit
 * -------------------------------------------------------
 * Corre DESPUÉS de seed-demo.js (lee IDs existentes de Firestore).
 * Agrega:
 *  - Catálogo de capacitaciones (training_catalog) con modalidades variadas
 *  - Plan anual 2025 completo (todas las sesiones cerradas)
 *  - Plan anual 2026 en curso (meses pasados ejecutados, futuros planificados)
 *  - Asistencia real por empleado en cada sesión
 *  - Calendario de auditorías agendadas (historial + próximas)
 *
 * USO:
 *   1. serviceAccountKey-controlfile.json en esta misma carpeta
 *   2. node seed-demo-2.js
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey-controlfile.json');

// ─── CONFIG ─────────────────────────────────────────────────
const OWNER_ID      = 'oemyRkkbneaYgG45I1PPiv99z9B3';
const APP_ID        = 'auditoria';
const BASE          = `apps/${APP_ID}/owners/${OWNER_ID}`;
const EMPRESA_ID    = 'empresa-constructora-demo';
const SUCURSAL_1    = 'sucursal-obra-norte';
const SUCURSAL_2    = 'sucursal-obra-sur';
const FORMULARIO_ID = 'formulario-hse-construccion';

// ─── INIT ────────────────────────────────────────────────────
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── HELPERS ────────────────────────────────────────────────
const p     = (...segs) => `${BASE}/${segs.join('/')}`;
const ts    = (d) => admin.firestore.Timestamp.fromDate(d instanceof Date ? d : new Date(d));
const fecha = (y, m, d, h = 9) => new Date(y, m - 1, d, h, 0, 0, 0);

// ─── CATÁLOGO ────────────────────────────────────────────────
// modality define cómo se clasifica en el reporte:
//   'virtual'   → Charla
//   'hybrid'    → Entrenamiento
//   'in_person' → Capacitación Formal
const CATALOG = [
  { id: 'uso-epp',                name: 'Uso correcto de EPP',                       validityMonths: 12, requiresEvaluation: false, category: 'seguridad',   modality: 'virtual'   },
  { id: 'trabajo-altura',         name: 'Trabajos en altura',                         validityMonths: 6,  requiresEvaluation: true,  category: 'seguridad',   modality: 'in_person' },
  { id: 'herramientas-electricas',name: 'Manejo de herramientas eléctricas',           validityMonths: 12, requiresEvaluation: true,  category: 'seguridad',   modality: 'in_person' },
  { id: 'primeros-auxilios',      name: 'Primeros auxilios básicos',                  validityMonths: 12, requiresEvaluation: true,  category: 'salud',       modality: 'hybrid'    },
  { id: 'prevencion-incendios',   name: 'Prevención y extinción de incendios',        validityMonths: 12, requiresEvaluation: false, category: 'emergencias', modality: 'virtual'   },
  { id: 'riesgos-electricos',     name: 'Riesgos eléctricos — Bloqueo y etiquetado', validityMonths: 6,  requiresEvaluation: true,  category: 'seguridad',   modality: 'in_person' },
  { id: 'orden-limpieza',         name: 'Orden y limpieza en obra',                   validityMonths: 12, requiresEvaluation: false, category: 'higiene',     modality: 'virtual'   },
  { id: 'manejo-cargas',          name: 'Manejo manual de cargas',                    validityMonths: 12, requiresEvaluation: false, category: 'ergonomia',   modality: 'hybrid'    },
  { id: 'señalizacion',           name: 'Señalización y delimitación de zonas',       validityMonths: 12, requiresEvaluation: false, category: 'seguridad',   modality: 'virtual'   },
  { id: 'gruas-elevacion',        name: 'Uso de grúas y equipos de elevación',        validityMonths: 6,  requiresEvaluation: true,  category: 'equipos',     modality: 'in_person' },
];

// ─── PLANES ──────────────────────────────────────────────────
const PLAN_2025 = [
  { typeId: 'uso-epp',                meses: [2]    },
  { typeId: 'trabajo-altura',         meses: [3, 9] },
  { typeId: 'herramientas-electricas',meses: [4]    },
  { typeId: 'primeros-auxilios',      meses: [5]    },
  { typeId: 'prevencion-incendios',   meses: [6]    },
  { typeId: 'riesgos-electricos',     meses: [7, 11]},
  { typeId: 'orden-limpieza',         meses: [8]    },
  { typeId: 'manejo-cargas',          meses: [9]    },
  { typeId: 'señalizacion',           meses: [10]   },
  { typeId: 'gruas-elevacion',        meses: [4, 10]},
];

const PLAN_2026 = [
  { typeId: 'uso-epp',                meses: [2]    },
  { typeId: 'trabajo-altura',         meses: [3, 9] },
  { typeId: 'herramientas-electricas',meses: [4]    },
  { typeId: 'primeros-auxilios',      meses: [5]    },
  { typeId: 'prevencion-incendios',   meses: [6]    },
  { typeId: 'riesgos-electricos',     meses: [7, 11]},
  { typeId: 'orden-limpieza',         meses: [2]    },
  { typeId: 'manejo-cargas',          meses: [3]    },
  { typeId: 'señalizacion',           meses: [4]    },
  { typeId: 'gruas-elevacion',        meses: [3, 9] },
];

// ─── MAIN ────────────────────────────────────────────────────
async function seed() {
  console.log('\n🏗️  SEED DEMO 2 — ControlAudit (Capacitaciones + Calendario)');
  console.log('─'.repeat(55));

  // ── 0. CARGAR DATOS EXISTENTES ───────────────────────────
  console.log('\n🔍 Cargando datos del seed 1...');

  const usuariosSnap = await db.collection(p('usuarios')).get();
  const usuariosMap  = {};
  usuariosSnap.forEach(doc => { usuariosMap[doc.data().email] = { uid: doc.id, ...doc.data() }; });

  const uAdmin = usuariosMap['demo@controlaudit.com']         || { uid: OWNER_ID,  displayName: 'Carlos Vega' };
  const uInsp1 = usuariosMap['mgonzalez@constructoradelsur.com'] || { uid: 'insp1', displayName: 'María González' };
  const uInsp2 = usuariosMap['aruiz@constructoradelsur.com']     || { uid: 'insp2', displayName: 'Alejandro Ruiz' };

  console.log(`  ✅ Admin:  ${uAdmin.displayName}`);
  console.log(`  ✅ Insp1:  ${uInsp1.displayName}`);
  console.log(`  ✅ Insp2:  ${uInsp2.displayName}`);

  const emps = { s1: [], s2: [] };
  const empsSnap = await db.collection(p('empleados')).get();
  empsSnap.forEach(doc => {
    const d = doc.data();
    const emp = { id: doc.id, nombre: d.nombre };
    if (d.sucursalId === SUCURSAL_1) emps.s1.push(emp);
    else emps.s2.push(emp);
  });
  console.log(`  ✅ Empleados: ${emps.s1.length} en Obra Norte, ${emps.s2.length} en Obra Sur`);

  // ── 1. CATÁLOGO ──────────────────────────────────────────
  console.log('\n📖 Creando catálogo de capacitaciones...');
  for (const item of CATALOG) {
    await db.doc(p('training_catalog', item.id)).set({
      id:                 item.id,
      name:               item.name,
      validityMonths:     item.validityMonths,
      requiresEvaluation: item.requiresEvaluation,
      requiresScore:      false,
      category:           item.category,
      modality:           item.modality,
      durationMinutes:    item.requiresEvaluation ? 120 : 60,
      description:        `Capacitación obligatoria: ${item.name}`,
      status:             'active',
      version:            1,
      appId:              APP_ID,
      ownerId:            OWNER_ID,
      createdAt:          ts(fecha(2024, 12, 1)),
      updatedAt:          ts(fecha(2024, 12, 1)),
    }, { merge: true });
    console.log(`  ✅ ${item.name} [${item.modality}]`);
  }

  // ── 2. PLANES + SESIONES + ASISTENCIA ────────────────────
  const sucursales = [
    { id: SUCURSAL_1, nombre: 'Obra Norte — Complejo Residencial', emps: emps.s1, inspector: uInsp1 },
    { id: SUCURSAL_2, nombre: 'Obra Sur — Centro Comercial',       emps: emps.s2, inspector: uInsp2 },
  ];

  const mesActual = new Date().getMonth() + 1;

  for (const suc of sucursales) {

    // ── PLAN 2025 ────────────────────────────────────────
    console.log(`\n📅 Plan 2025 — ${suc.nombre}`);
    const plan2025Ref = db.collection(p('training_plans')).doc();
    const plan2025Id  = plan2025Ref.id;

    await plan2025Ref.set({
      id: plan2025Id, companyId: EMPRESA_ID, branchId: suc.id,
      year: 2025, status: 'approved',
      appId: APP_ID, ownerId: OWNER_ID, createdBy: uAdmin.uid,
      createdAt: ts(fecha(2024, 12, 15)), updatedAt: ts(fecha(2025, 1, 5)),
    });

    for (const planDef of PLAN_2025) {
      const catalogItem = CATALOG.find(c => c.id === planDef.typeId);

      await db.doc(p('training_plan_training_types', `${plan2025Id}_${planDef.typeId}`)).set({
        planId: plan2025Id, trainingTypeId: planDef.typeId,
        frequencyMonths: catalogItem.validityMonths <= 6 ? 6 : 12,
        startMonth: planDef.meses[0],
        appId: APP_ID, ownerId: OWNER_ID,
        createdAt: ts(fecha(2025, 1, 5)), updatedAt: ts(fecha(2025, 1, 5)),
      }, { merge: true });

      for (const mes of planDef.meses) {
        const itemRef = db.collection(p('training_plan_items')).doc();
        const itemId  = itemRef.id;
        const diaEjec = 8 + Math.floor(Math.random() * 12);
        const fSesion = fecha(2025, mes, diaEjec);
        const registradoPor = mes <= 3 ? uAdmin : suc.inspector;

        await itemRef.set({
          id: itemId, planId: plan2025Id, trainingTypeId: planDef.typeId,
          plannedMonth: mes, periodYear: 2025, periodMonth: mes,
          periodKey: `monthly_2025_${String(mes).padStart(2,'0')}`,
          periodType: 'monthly', companyId: EMPRESA_ID, branchId: suc.id,
          status: 'completed', targetAudience: 'Todos los operarios de obra',
          estimatedParticipants: suc.emps.length, priority: 'medium', notes: '',
          appId: APP_ID, ownerId: OWNER_ID,
          createdAt: ts(fecha(2025, 1, 5)), updatedAt: ts(fSesion),
        });

        const sessionRef = db.collection(p('training_sessions')).doc();
        const sessionId  = sessionRef.id;

        await sessionRef.set({
          id: sessionId, trainingTypeId: planDef.typeId,
          companyId: EMPRESA_ID, branchId: suc.id,
          planId: plan2025Id, planItemId: itemId,
          sessionOrigin: 'plan', planLinkedAt: ts(fSesion), planLinkedBy: registradoPor.uid,
          status: 'closed',
          modality: catalogItem.modality,
          location: suc.id === SUCURSAL_1 ? 'Sala de reuniones Obra Norte' : 'Comedor Obra Sur',
          instructor: mes % 2 === 0 ? 'Ing. Marcelo Figueroa' : 'Lic. Sandra Montoya',
          instructorId: null,
          scheduledDate: ts(fSesion), executedDate: ts(fSesion),
          periodType: 'monthly', periodYear: 2025, periodMonth: mes,
          periodKey: `monthly_2025_${String(mes).padStart(2,'0')}`,
          closedAt: ts(new Date(fSesion.getTime() + 2 * 60 * 60 * 1000)),
          closedBy: registradoPor.uid, createdBy: registradoPor.uid,
          closureChecklist: { attendanceComplete: true, requiredSignaturesComplete: false, requiredEvidenceComplete: false },
          version: 1, deletedAt: null, deletionReason: null,
          appId: APP_ID, ownerId: OWNER_ID,
          createdAt: ts(fSesion), updatedAt: ts(fSesion),
        });

        await itemRef.update({ sessionId, updatedAt: ts(fSesion) });

        for (const emp of suc.emps) {
          const asistio    = Math.random() > 0.12;
          const attStatus  = asistio ? 'present' : (Math.random() > 0.5 ? 'justified_absence' : 'unjustified_absence');
          const evalStatus = catalogItem.requiresEvaluation
            ? (asistio ? (Math.random() > 0.15 ? 'approved' : 'failed') : 'failed')
            : 'not_applicable';
          const validUntil = asistio && evalStatus !== 'failed'
            ? ts(new Date(fSesion.getFullYear(), fSesion.getMonth() + catalogItem.validityMonths, fSesion.getDate()))
            : null;

          await db.doc(p('training_sessions', sessionId, 'attendance', emp.id)).set({
            employeeId: emp.id, sessionId, trainingTypeId: planDef.typeId,
            companyId: EMPRESA_ID, branchId: suc.id,
            planId: plan2025Id, planItemId: itemId,
            attended: asistio, attendanceStatus: attStatus, evaluationStatus: evalStatus,
            requiresEvaluation: catalogItem.requiresEvaluation,
            score: evalStatus === 'approved' ? (70 + Math.floor(Math.random() * 30)) : null,
            validFrom: asistio ? ts(fSesion) : null, validUntil,
            employeeSignature: asistio ? 'ref-firma-empleado' : null,
            instructorSignature: 'ref-firma-instructor',
            notes: '', evidenceIds: [], certificateId: null,
            sourceSessionStatus: 'closed', sourceExecutedDate: ts(fSesion),
            periodType: 'monthly', periodYear: 2025, periodMonth: mes,
            periodKey: `monthly_2025_${String(mes).padStart(2,'0')}`,
            isDeleted: false, attendanceTakenAt: ts(fSesion),
            correctedAt: null, correctedBy: null,
            appId: APP_ID, ownerId: OWNER_ID,
            createdAt: ts(fSesion), updatedAt: ts(fSesion),
          });
        }
      }
    }
    const total2025 = PLAN_2025.reduce((a, p) => a + p.meses.length, 0);
    console.log(`  ✅ ${total2025} sesiones 2025 cerradas con asistencia`);

    // ── PLAN 2026 ────────────────────────────────────────
    console.log(`\n📅 Plan 2026 — ${suc.nombre}`);
    const plan2026Ref = db.collection(p('training_plans')).doc();
    const plan2026Id  = plan2026Ref.id;

    await plan2026Ref.set({
      id: plan2026Id, companyId: EMPRESA_ID, branchId: suc.id,
      year: 2026, status: 'in_progress',
      appId: APP_ID, ownerId: OWNER_ID, createdBy: uAdmin.uid,
      createdAt: ts(fecha(2025, 12, 20)), updatedAt: ts(fecha(2026, 1, 3)),
    });

    for (const planDef of PLAN_2026) {
      const catalogItem = CATALOG.find(c => c.id === planDef.typeId);

      await db.doc(p('training_plan_training_types', `${plan2026Id}_${planDef.typeId}`)).set({
        planId: plan2026Id, trainingTypeId: planDef.typeId,
        frequencyMonths: catalogItem.validityMonths <= 6 ? 6 : 12,
        startMonth: planDef.meses[0],
        appId: APP_ID, ownerId: OWNER_ID,
        createdAt: ts(fecha(2026, 1, 3)), updatedAt: ts(fecha(2026, 1, 3)),
      }, { merge: true });

      for (const mes of planDef.meses) {
        const esPasadoOActual = mes <= mesActual;
        const itemStatus      = esPasadoOActual ? 'completed' : 'planned';
        const itemRef         = db.collection(p('training_plan_items')).doc();
        const itemId          = itemRef.id;

        await itemRef.set({
          id: itemId, planId: plan2026Id, trainingTypeId: planDef.typeId,
          plannedMonth: mes, periodYear: 2026, periodMonth: mes,
          periodKey: `monthly_2026_${String(mes).padStart(2,'0')}`,
          periodType: 'monthly', companyId: EMPRESA_ID, branchId: suc.id,
          status: itemStatus, targetAudience: 'Todos los operarios de obra',
          estimatedParticipants: suc.emps.length, priority: 'medium', notes: '',
          appId: APP_ID, ownerId: OWNER_ID,
          createdAt: ts(fecha(2026, 1, 3)),
          updatedAt: ts(fecha(2026, esPasadoOActual ? mes : 1, 20)),
        });

        if (!esPasadoOActual) continue;

        const diaEjec   = 8 + Math.floor(Math.random() * 12);
        const fSesion   = fecha(2026, mes, diaEjec);
        const sessionRef = db.collection(p('training_sessions')).doc();
        const sessionId  = sessionRef.id;

        await sessionRef.set({
          id: sessionId, trainingTypeId: planDef.typeId,
          companyId: EMPRESA_ID, branchId: suc.id,
          planId: plan2026Id, planItemId: itemId,
          sessionOrigin: 'plan', planLinkedAt: ts(fSesion), planLinkedBy: suc.inspector.uid,
          status: 'closed',
          modality: catalogItem.modality,
          location: suc.id === SUCURSAL_1 ? 'Sala de reuniones Obra Norte' : 'Comedor Obra Sur',
          instructor: mes % 2 === 0 ? 'Ing. Marcelo Figueroa' : 'Lic. Sandra Montoya',
          instructorId: null,
          scheduledDate: ts(fSesion), executedDate: ts(fSesion),
          periodType: 'monthly', periodYear: 2026, periodMonth: mes,
          periodKey: `monthly_2026_${String(mes).padStart(2,'0')}`,
          closedAt: ts(new Date(fSesion.getTime() + 2 * 60 * 60 * 1000)),
          closedBy: suc.inspector.uid, createdBy: suc.inspector.uid,
          closureChecklist: { attendanceComplete: true, requiredSignaturesComplete: false, requiredEvidenceComplete: false },
          version: 1, deletedAt: null, deletionReason: null,
          appId: APP_ID, ownerId: OWNER_ID,
          createdAt: ts(fSesion), updatedAt: ts(fSesion),
        });

        await itemRef.update({ sessionId, updatedAt: ts(fSesion) });

        for (const emp of suc.emps) {
          const asistio    = Math.random() > 0.10;
          const attStatus  = asistio ? 'present' : 'justified_absence';
          const evalStatus = catalogItem.requiresEvaluation
            ? (asistio ? (Math.random() > 0.10 ? 'approved' : 'failed') : 'failed')
            : 'not_applicable';
          const validUntil = asistio && evalStatus !== 'failed'
            ? ts(new Date(fSesion.getFullYear(), fSesion.getMonth() + catalogItem.validityMonths, fSesion.getDate()))
            : null;

          await db.doc(p('training_sessions', sessionId, 'attendance', emp.id)).set({
            employeeId: emp.id, sessionId, trainingTypeId: planDef.typeId,
            companyId: EMPRESA_ID, branchId: suc.id,
            planId: plan2026Id, planItemId: itemId,
            attended: asistio, attendanceStatus: attStatus, evaluationStatus: evalStatus,
            requiresEvaluation: catalogItem.requiresEvaluation,
            score: evalStatus === 'approved' ? (70 + Math.floor(Math.random() * 30)) : null,
            validFrom: asistio ? ts(fSesion) : null, validUntil,
            employeeSignature: asistio ? 'ref-firma-empleado' : null,
            instructorSignature: 'ref-firma-instructor',
            notes: '', evidenceIds: [], certificateId: null,
            sourceSessionStatus: 'closed', sourceExecutedDate: ts(fSesion),
            periodType: 'monthly', periodYear: 2026, periodMonth: mes,
            periodKey: `monthly_2026_${String(mes).padStart(2,'0')}`,
            isDeleted: false, attendanceTakenAt: ts(fSesion),
            correctedAt: null, correctedBy: null,
            appId: APP_ID, ownerId: OWNER_ID,
            createdAt: ts(fSesion), updatedAt: ts(fSesion),
          });
        }
      }
    }
    const ejec2026 = PLAN_2026.reduce((a, p) => a + p.meses.filter(m => m <= mesActual).length, 0);
    const plan2026 = PLAN_2026.reduce((a, p) => a + p.meses.filter(m => m > mesActual).length, 0);
    console.log(`  ✅ ${ejec2026} sesiones ejecutadas, ${plan2026} planificadas`);
  }

  // ── 3. CALENDARIO DE AUDITORÍAS AGENDADAS ───────────────
  console.log('\n📆 Creando calendario de auditorías agendadas...');

  const agendadas = [
    // 2025 — historial completado
    { y:2025, m:2,  d:12, suc:SUCURSAL_1, encargado:uInsp1, estado:'completada' },
    { y:2025, m:4,  d:9,  suc:SUCURSAL_2, encargado:uInsp2, estado:'completada' },
    { y:2025, m:6,  d:17, suc:SUCURSAL_1, encargado:uAdmin, estado:'completada' },
    { y:2025, m:8,  d:5,  suc:SUCURSAL_2, encargado:uInsp2, estado:'completada' },
    { y:2025, m:10, d:21, suc:SUCURSAL_1, encargado:uInsp1, estado:'completada' },
    { y:2025, m:12, d:3,  suc:SUCURSAL_2, encargado:uAdmin, estado:'completada' },
    // 2026 — pasados completados
    { y:2026, m:1,  d:14, suc:SUCURSAL_1, encargado:uInsp1, estado:'completada' },
    { y:2026, m:2,  d:19, suc:SUCURSAL_2, encargado:uInsp2, estado:'completada' },
    { y:2026, m:3,  d:11, suc:SUCURSAL_1, encargado:uAdmin, estado:'completada' },
    // 2026 — próximas
    { y:2026, m:5,  d:7,  suc:SUCURSAL_2, encargado:uInsp2, estado:'agendada'   },
    { y:2026, m:7,  d:15, suc:SUCURSAL_1, encargado:uInsp1, estado:'agendada'   },
    { y:2026, m:9,  d:3,  suc:SUCURSAL_2, encargado:uAdmin, estado:'agendada'   },
    { y:2026, m:11, d:18, suc:SUCURSAL_1, encargado:uInsp1, estado:'agendada'   },
  ];

  for (const ag of agendadas) {
    const ref      = db.collection(p('auditorias_agendadas')).doc();
    const fechaStr = `${ag.y}-${String(ag.m).padStart(2,'0')}-${String(ag.d).padStart(2,'0')}`;
    const sucNombre = ag.suc === SUCURSAL_1 ? 'Obra Norte' : 'Obra Sur';
    await ref.set({
      id:           ref.id,
      fecha:        fechaStr,
      hora:         '09:00',
      estado:       ag.estado,
      empresaId:    EMPRESA_ID,
      sucursalId:   ag.suc,
      formularioId: FORMULARIO_ID,
      encargado: {
        uid:    ag.encargado.uid,
        nombre: ag.encargado.displayName,
        email:  ag.encargado.email,
      },
      ownerId:            OWNER_ID,
      fechaCreacion:      ts(fecha(ag.y, ag.m, 1)),
      fechaActualizacion: ts(fecha(ag.y, ag.m, ag.d)),
    });
    console.log(`  ✅ ${fechaStr} — ${sucNombre} — ${ag.encargado.displayName} [${ag.estado}]`);
  }

  // ── RESUMEN ──────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));
  console.log('🎉 SEED 2 COMPLETADO\n');
  console.log('📌 CAPACITACIONES:');
  console.log('   ✅ 10 tipos en catálogo (mix: virtual / hybrid / in_person)');
  console.log('   ✅ Plan 2025 completo — 2 sucursales × 12 sesiones cerradas');
  console.log('   ✅ Plan 2026 en curso — meses ejecutados + futuros planificados');
  console.log('   ✅ Asistencia real por empleado (88-90% presencia)');
  console.log('\n📌 CALENDARIO:');
  console.log(`   ✅ ${agendadas.length} auditorías agendadas (historial + próximas)`);
  console.log('\n📌 TIPOS EN REPORTE:');
  console.log('   🟢 Charlas        → uso-epp, prevencion-incendios, orden-limpieza, señalizacion');
  console.log('   🟡 Entrenamientos → primeros-auxilios, manejo-cargas');
  console.log('   🔵 Formales       → trabajo-altura, herramientas-electricas, riesgos-electricos, gruas-elevacion');
  console.log('\n⚠️  Cerrá sesión y volvé a entrar para refrescar la app.\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('\n💥 Error en seed-2:', err);
  process.exit(1);
});