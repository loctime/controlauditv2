/**
 * SEED DEMO 1 — ControlAudit
 * Rubro: Construcción
 * -------------------------------------------------------
 * Simula un año real de operación (2025 completo + 2026 hasta hoy)
 *
 * Crea:
 *  - 3 usuarios (admin + 2 inspectores)
 *  - 1 empresa, 2 sucursales
 *  - 20 empleados (10 por sucursal)
 *  - 1 formulario HSE (4 secciones, 20 preguntas)
 *  - ~30 auditorías con formulario (distribución irregular real)
 *  - 10 auditorías manuales
 *  - 14 accidentes/incidentes (mix abiertos/cerrados, con/sin reposo)
 *  - 10 ausencias / salud ocupacional
 *
 * SIN colección legacy `capacitaciones` — eso lo maneja seed-demo-2.js
 *
 * USO:
 *   1. serviceAccountKey-controlfile.json en esta misma carpeta
 *   2. node seed-demo.js
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey-controlfile.json');

// ─── CONFIG ─────────────────────────────────────────────────
const OWNER_ID      = 'F8znUHWDrgZn9dCp2zHKCBBRLCL2';
const APP_ID        = 'auditoria';
const BASE          = `apps/${APP_ID}/owners/${OWNER_ID}`;
const EMPRESA_ID    = 'empresa-constructora-demo';
const SUCURSAL_1    = 'sucursal-obra-norte';
const SUCURSAL_2    = 'sucursal-obra-sur';
const FORMULARIO_ID = 'formulario-hse-construccion';

// ─── INIT ────────────────────────────────────────────────────
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db   = admin.firestore();
const auth = admin.auth();

// ─── HELPERS ────────────────────────────────────────────────
const p  = (...segs) => `${BASE}/${segs.join('/')}`;
const ts = (d) => admin.firestore.Timestamp.fromDate(d instanceof Date ? d : new Date(d));

/** fecha(año, mes 1-12, día, hora=9) → Date */
const fecha = (y, m, d, h = 9) => new Date(y, m - 1, d, h, 0, 0, 0);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── USUARIOS ────────────────────────────────────────────────
const USUARIOS_DEF = [
  {
    email:       'demo@controlaudit.com',
    displayName: 'Carlos Vega',
    uid:         OWNER_ID,
    role:        'admin',
    sucursalId:  null,
    existing:    true,
  },
  {
    email:       'mgonzalez@constructoradelsur.com',
    password:    '123123123',
    displayName: 'María González',
    role:        'operario',
    sucursalId:  SUCURSAL_1,
    existing:    false,
  },
  {
    email:       'aruiz@constructoradelsur.com',
    password:    '123123123',
    displayName: 'Alejandro Ruiz',
    role:        'operario',
    sucursalId:  SUCURSAL_2,
    existing:    false,
  },
];

// ─── EMPLEADOS ───────────────────────────────────────────────
const EMPLEADOS_S1 = [
  { nombre: 'Carlos Méndez',    cargo: 'Operario de obra', area: 'Estructura',    dni: '28441201' },
  { nombre: 'Roberto Paz',      cargo: 'Albañil',          area: 'Mampostería',   dni: '30112345' },
  { nombre: 'Diego Herrera',    cargo: 'Electricista',     area: 'Instalaciones', dni: '25987654' },
  { nombre: 'Martín Ríos',      cargo: 'Plomero',          area: 'Instalaciones', dni: '31456789' },
  { nombre: 'Jorge Castillo',   cargo: 'Carpintero',       area: 'Terminaciones', dni: '27334455' },
  { nombre: 'Luis Fernández',   cargo: 'Pintor',           area: 'Terminaciones', dni: '29876543' },
  { nombre: 'Pablo Soria',      cargo: 'Capataz de obra',  area: 'Supervisión',   dni: '26123456' },
  { nombre: 'Gastón Velázquez', cargo: 'Operario de grúa', area: 'Estructura',    dni: '32234567' },
  { nombre: 'Ariel Bravo',      cargo: 'Soldador',         area: 'Estructura',    dni: '28765432' },
  { nombre: 'Ricardo Torres',   cargo: 'Encofrador',       area: 'Estructura',    dni: '30345678' },
];

const EMPLEADOS_S2 = [
  { nombre: 'Sebastián López',   cargo: 'Operario de obra', area: 'Estructura',    dni: '27889900' },
  { nombre: 'Fabián Ortega',     cargo: 'Albañil',          area: 'Mampostería',   dni: '29001122' },
  { nombre: 'Nicolás Aguirre',   cargo: 'Electricista',     area: 'Instalaciones', dni: '31223344' },
  { nombre: 'Hernán Rojas',      cargo: 'Plomero',          area: 'Instalaciones', dni: '28556677' },
  { nombre: 'Walter Cabrera',    cargo: 'Carpintero',       area: 'Terminaciones', dni: '30778899' },
  { nombre: 'Maximiliano Pérez', cargo: 'Pintor',           area: 'Terminaciones', dni: '26990011' },
  { nombre: 'Eduardo Suárez',    cargo: 'Capataz de obra',  area: 'Supervisión',   dni: '32112233' },
  { nombre: 'Leandro Molina',    cargo: 'Operario de grúa', area: 'Estructura',    dni: '29334455' },
  { nombre: 'Marcos Navarro',    cargo: 'Soldador',         area: 'Estructura',    dni: '27556677' },
  { nombre: 'Daniel Quiroga',    cargo: 'Encofrador',       area: 'Estructura',    dni: '31778899' },
];

// ─── FORMULARIO HSE ──────────────────────────────────────────
const SECCIONES = [
  {
    nombre: 'Condiciones Generales de Obra',
    preguntas: [
      'El acceso a la obra está señalizado y delimitado correctamente',
      'Los pasillos y vías de circulación se encuentran libres de obstáculos',
      'Existe cartelería de seguridad visible en toda la obra',
      'El orden y limpieza del sector es adecuado',
      'Los residuos están correctamente clasificados y contenidos',
    ],
  },
  {
    nombre: 'Equipos de Protección Personal',
    preguntas: [
      'Todo el personal usa casco de seguridad correctamente',
      'Se utilizan calzado de seguridad con puntera de acero',
      'El personal en altura usa arnés homologado',
      'Se observa uso de guantes según la tarea realizada',
      'La protección auditiva está disponible y se usa en zonas ruidosas',
    ],
  },
  {
    nombre: 'Trabajos en Altura',
    preguntas: [
      'Los andamios cuentan con barandas perimetrales reglamentarias',
      'Las escaleras están bien aseguradas y en buen estado',
      'Existe red de seguridad bajo zonas de trabajo en altura',
      'El personal está habilitado para trabajo en altura',
      'Los puntos de anclaje del arnés están correctamente instalados',
    ],
  },
  {
    nombre: 'Equipos y Herramientas',
    preguntas: [
      'Las herramientas eléctricas tienen protecciones en buen estado',
      'La maquinaria cuenta con revisión técnica al día',
      'Los cables eléctricos están protegidos y sin daños visibles',
      'La grúa o equipos de elevación tienen habilitación vigente',
      'Se realiza check pre-operacional de maquinaria pesada',
    ],
  },
];

// ─── AUDITORÍAS CON FORMULARIO ───────────────────────────────
// Distribución irregular real — algunos meses tienen 2, otros 1, alguno ninguno
// formato: { y, m, d, suc, auditor: 'admin'|'insp1'|'insp2' }
const AUDITORIAS_DEF = [
  // 2025
  { y:2025, m:1,  d:14, suc:SUCURSAL_1, auditor:'insp1' },
  { y:2025, m:1,  d:22, suc:SUCURSAL_2, auditor:'insp2' },
  { y:2025, m:2,  d:6,  suc:SUCURSAL_1, auditor:'insp1' },
  { y:2025, m:3,  d:11, suc:SUCURSAL_2, auditor:'admin' },
  { y:2025, m:3,  d:25, suc:SUCURSAL_1, auditor:'insp1' },
  { y:2025, m:4,  d:8,  suc:SUCURSAL_2, auditor:'insp2' },
  { y:2025, m:5,  d:5,  suc:SUCURSAL_1, auditor:'insp1' },
  { y:2025, m:5,  d:19, suc:SUCURSAL_2, auditor:'insp2' },
  { y:2025, m:5,  d:28, suc:SUCURSAL_1, auditor:'admin' },
  { y:2025, m:6,  d:10, suc:SUCURSAL_2, auditor:'insp2' },
  { y:2025, m:7,  d:3,  suc:SUCURSAL_1, auditor:'insp1' },
  { y:2025, m:7,  d:17, suc:SUCURSAL_2, auditor:'admin' },
  { y:2025, m:8,  d:7,  suc:SUCURSAL_1, auditor:'insp1' },
  { y:2025, m:8,  d:21, suc:SUCURSAL_2, auditor:'insp2' },
  { y:2025, m:9,  d:9,  suc:SUCURSAL_1, auditor:'insp1' },
  { y:2025, m:10, d:2,  suc:SUCURSAL_2, auditor:'insp2' },
  { y:2025, m:10, d:16, suc:SUCURSAL_1, auditor:'admin' },
  { y:2025, m:11, d:6,  suc:SUCURSAL_2, auditor:'insp2' },
  { y:2025, m:11, d:20, suc:SUCURSAL_1, auditor:'insp1' },
  { y:2025, m:12, d:4,  suc:SUCURSAL_2, auditor:'insp2' },
  { y:2025, m:12, d:18, suc:SUCURSAL_1, auditor:'admin' },
  // 2026
  { y:2026, m:1,  d:9,  suc:SUCURSAL_2, auditor:'insp2' },
  { y:2026, m:1,  d:23, suc:SUCURSAL_1, auditor:'insp1' },
  { y:2026, m:2,  d:6,  suc:SUCURSAL_2, auditor:'admin' },
  { y:2026, m:2,  d:20, suc:SUCURSAL_1, auditor:'insp1' },
  { y:2026, m:3,  d:5,  suc:SUCURSAL_2, auditor:'insp2' },
  { y:2026, m:3,  d:19, suc:SUCURSAL_1, auditor:'insp1' },
  { y:2026, m:4,  d:3,  suc:SUCURSAL_2, auditor:'admin' },
];

// ─── AUDITORÍAS MANUALES ─────────────────────────────────────
const MANUALES_DEF = [
  { y:2025, m:2,  d:18, suc:SUCURSAL_1, auditor:'insp1', nombre:'Inspección de andamios — Bloque A' },
  { y:2025, m:4,  d:14, suc:SUCURSAL_2, auditor:'insp2', nombre:'Control de maquinaria pesada — Grúa Torre' },
  { y:2025, m:6,  d:3,  suc:SUCURSAL_1, auditor:'admin', nombre:'Revisión instalaciones eléctricas provisionales' },
  { y:2025, m:7,  d:22, suc:SUCURSAL_2, auditor:'insp2', nombre:'Auditoría de acopio de materiales' },
  { y:2025, m:9,  d:11, suc:SUCURSAL_1, auditor:'insp1', nombre:'Control de señalización en accesos vehiculares' },
  { y:2025, m:10, d:28, suc:SUCURSAL_2, auditor:'admin', nombre:'Inspección de EPP — stock y estado' },
  { y:2025, m:12, d:9,  suc:SUCURSAL_1, auditor:'insp1', nombre:'Revisión extintores y plan de evacuación' },
  { y:2026, m:1,  d:16, suc:SUCURSAL_2, auditor:'insp2', nombre:'Control de arneses y equipos de altura' },
  { y:2026, m:2,  d:27, suc:SUCURSAL_1, auditor:'insp1', nombre:'Inspección de andamios — Bloque C' },
  { y:2026, m:3,  d:13, suc:SUCURSAL_2, auditor:'admin', nombre:'Verificación de tableros eléctricos provisorios' },
];

// ─── ACCIDENTES E INCIDENTES ─────────────────────────────────
// conReposo solo aplica a accidentes
const EVENTOS_DEF = [
  // 2025
  { y:2025, m:1,  d:17, tipo:'accidente', suc:SUCURSAL_1, empIdx:7, conReposo:true,  diasReposo:5,  reporter:'insp1',
    desc:'Golpe en mano derecha por caída de herramienta desde nivel superior. Contusión con hematoma.' },
  { y:2025, m:2,  d:8,  tipo:'incidente', suc:SUCURSAL_2, empIdx:2, conReposo:false, diasReposo:0,  reporter:'insp2',
    desc:'Fuga de gas en sector de soldadura. Evacuación y ventilación inmediata. Sin afectados.' },
  { y:2025, m:3,  d:22, tipo:'accidente', suc:SUCURSAL_1, empIdx:2, conReposo:true,  diasReposo:10, reporter:'insp1',
    desc:'Caída desde andamio a 1.8m de altura. Contusión en rodilla derecha. Reposo médico indicado.' },
  { y:2025, m:4,  d:5,  tipo:'incidente', suc:SUCURSAL_2, empIdx:6, conReposo:false, diasReposo:0,  reporter:'insp2',
    desc:'Falla de frenos en carretilla eléctrica. Sin impacto ni lesionados. Equipo retirado de servicio.' },
  { y:2025, m:5,  d:14, tipo:'accidente', suc:SUCURSAL_2, empIdx:4, conReposo:true,  diasReposo:7,  reporter:'insp2',
    desc:'Torcedura de tobillo por piso irregular en zona de tránsito. Reposo médico 7 días.' },
  { y:2025, m:6,  d:30, tipo:'incidente', suc:SUCURSAL_1, empIdx:5, conReposo:false, diasReposo:0,  reporter:'admin',
    desc:'Casi atropello por vehículo de obra en zona no delimitada correctamente. Sin lesionados.' },
  { y:2025, m:7,  d:11, tipo:'accidente', suc:SUCURSAL_1, empIdx:0, conReposo:false, diasReposo:0,  reporter:'insp1',
    desc:'Irritación ocular por polvo de cemento. Lavado ocular inmediato. Sin secuelas.' },
  { y:2025, m:8,  d:19, tipo:'incidente', suc:SUCURSAL_2, empIdx:3, conReposo:false, diasReposo:0,  reporter:'insp2',
    desc:'Rotura de línea de agua provisional. Zona inundada brevemente. Sin lesionados.' },
  { y:2025, m:9,  d:4,  tipo:'accidente', suc:SUCURSAL_1, empIdx:8, conReposo:false, diasReposo:0,  reporter:'insp1',
    desc:'Corte superficial en antebrazo por viruta metálica durante soldadura. Cura local.' },
  { y:2025, m:10, d:23, tipo:'accidente', suc:SUCURSAL_2, empIdx:1, conReposo:true,  diasReposo:3,  reporter:'insp2',
    desc:'Corte profundo en mano izquierda por sierra circular. Sutura y reposo 3 días.' },
  { y:2025, m:11, d:7,  tipo:'incidente', suc:SUCURSAL_1, empIdx:6, conReposo:false, diasReposo:0,  reporter:'insp1',
    desc:'Desprendimiento de revoque en zona de circulación. Área cercada preventivamente. Sin lesionados.' },
  { y:2025, m:12, d:15, tipo:'accidente', suc:SUCURSAL_2, empIdx:9, conReposo:false, diasReposo:0,  reporter:'insp2',
    desc:'Pinchadura en planta del pie por clavo expuesto. Vacuna antitetánica aplicada.' },
  // 2026
  { y:2026, m:1,  d:21, tipo:'incidente', suc:SUCURSAL_1, empIdx:4, conReposo:false, diasReposo:0,  reporter:'admin',
    desc:'Cortocircuito en tablero provisional. Sin lesionados. Tablero reemplazado de inmediato.' },
  { y:2026, m:3,  d:10, tipo:'accidente', suc:SUCURSAL_2, empIdx:5, conReposo:true,  diasReposo:4,  reporter:'insp2',
    desc:'Golpe en cabeza al bajar escalera con carga. Casco absorbió impacto. Reposo preventivo 4 días.' },
];

// ─── AUSENCIAS / SALUD OCUPACIONAL ───────────────────────────
const AUSENCIAS_DEF = [
  { y:2025, m:1,  d:20, suc:SUCURSAL_1, empIdx:3, tipo:'enfermedad',        origen:'manual',            motivo:'Infección respiratoria alta. Certificado médico presentado.',          dias:4,  reporter:'insp1' },
  { y:2025, m:3,  d:24, suc:SUCURSAL_1, empIdx:2, tipo:'accidente',         origen:'accidente',         motivo:'Reposo por contusión de rodilla (caída de andamio).',                  dias:10, reporter:'insp1' },
  { y:2025, m:5,  d:15, suc:SUCURSAL_2, empIdx:4, tipo:'accidente',         origen:'accidente',         motivo:'Reposo médico por torcedura de tobillo en obra.',                      dias:7,  reporter:'insp2' },
  { y:2025, m:6,  d:10, suc:SUCURSAL_1, empIdx:5, tipo:'licencia_medica',   origen:'licencia_medica',   motivo:'Licencia por paternidad.',                                             dias:2,  reporter:'admin' },
  { y:2025, m:7,  d:8,  suc:SUCURSAL_2, empIdx:6, tipo:'salud_ocupacional', origen:'salud_ocupacional', motivo:'Examen médico periódico obligatorio.',                                 dias:1,  reporter:'insp2' },
  { y:2025, m:8,  d:5,  suc:SUCURSAL_1, empIdx:7, tipo:'enfermedad',        origen:'manual',            motivo:'Gastroenteritis. Alta médica al 3er día.',                             dias:3,  reporter:'insp1' },
  { y:2025, m:10, d:24, suc:SUCURSAL_2, empIdx:1, tipo:'accidente',         origen:'accidente',         motivo:'Reposo por corte en mano (sutura). Alta médica a los 3 días.',         dias:3,  reporter:'insp2' },
  { y:2025, m:11, d:18, suc:SUCURSAL_1, empIdx:0, tipo:'salud_ocupacional', origen:'salud_ocupacional', motivo:'Control audiométrico por exposición a ruido en obra.',                 dias:1,  reporter:'insp1' },
  { y:2026, m:1,  d:13, suc:SUCURSAL_2, empIdx:5, tipo:'enfermedad',        origen:'manual',            motivo:'Lumbalgia crónica. Reposo preventivo indicado por médico laboral.',    dias:5,  reporter:'insp2' },
  { y:2026, m:3,  d:11, suc:SUCURSAL_2, empIdx:5, tipo:'accidente',         origen:'accidente',         motivo:'Reposo preventivo por golpe en cabeza. Alta médica a los 4 días.',     dias:4,  reporter:'insp2' },
];

// ────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🏗️  SEED DEMO 1 — ControlAudit (Construcción)');
  console.log('─'.repeat(55));

  // ── 1. USUARIOS ─────────────────────────────────────────
  console.log('\n👥 Configurando usuarios...');
  const usuarios = {};

  for (const def of USUARIOS_DEF) {
    if (def.existing) {
      await db.doc(p('usuarios', def.uid)).set({
        uid:         def.uid,
        email:       def.email,
        displayName: def.displayName,
        role:        def.role,
        ownerId:     OWNER_ID,
        sucursalId:  def.sucursalId,
        empresaId:   EMPRESA_ID,
        activo:      true,
        createdAt:   ts(fecha(2024, 12, 1)),
      }, { merge: true });
      usuarios.admin = { uid: def.uid, ...def };
      console.log(`  ✅ Owner existente: ${def.email}`);
      continue;
    }

    let record;
    try {
      record = await auth.getUserByEmail(def.email);
      console.log(`  ♻️  Ya existe: ${def.email}`);
    } catch {
      record = await auth.createUser({
        email:         def.email,
        password:      def.password,
        displayName:   def.displayName,
        emailVerified: true,
      });
      console.log(`  ✅ Creado: ${def.email}`);
    }

    await auth.setCustomUserClaims(record.uid, {
      appId:   APP_ID,
      role:    def.role,
      ownerId: OWNER_ID,
    });

    await db.doc(p('usuarios', record.uid)).set({
      uid:         record.uid,
      email:       def.email,
      displayName: def.displayName,
      role:        def.role,
      ownerId:     OWNER_ID,
      sucursalId:  def.sucursalId,
      empresaId:   EMPRESA_ID,
      activo:      true,
      createdAt:   ts(fecha(2024, 12, 1)),
    });

    const key = def.sucursalId === SUCURSAL_1 ? 'insp1' : 'insp2';
    usuarios[key] = { uid: record.uid, ...def };
  }

  const uAdmin = usuarios.admin;
  const uInsp1 = usuarios.insp1;
  const uInsp2 = usuarios.insp2;

  const resolverAuditor = (key) =>
    key === 'admin' ? uAdmin : key === 'insp1' ? uInsp1 : uInsp2;

  console.log(`  → Admin:  ${uAdmin.displayName}`);
  console.log(`  → Insp1:  ${uInsp1.displayName}`);
  console.log(`  → Insp2:  ${uInsp2.displayName}`);

  // ── 2. EMPRESA ──────────────────────────────────────────
  console.log('\n📦 Creando empresa...');
  await db.doc(p('empresas', EMPRESA_ID)).set({
    id:        EMPRESA_ID,
    nombre:    'Constructora del Sur S.A.',
    rubro:     'Construcción',
    cuit:      '30-71234567-0',
    direccion: 'Av. San Martín 1450, Bariloche',
    telefono:  '+54 294 442-1000',
    email:     'contacto@constructoradelsur.com',
    logo:      null,
    activa:    true,
    ownerId:   OWNER_ID,
    createdAt: ts(fecha(2024, 12, 1)),
    updatedAt: ts(fecha(2025, 1, 5)),
    createdBy: uAdmin.uid,
  });
  console.log('  ✅ Constructora del Sur S.A.');

  // ── 3. SUCURSALES ────────────────────────────────────────
  console.log('\n🏢 Creando sucursales...');
  await db.doc(p('sucursales', SUCURSAL_1)).set({
    id:          SUCURSAL_1,
    nombre:      'Obra Norte — Complejo Residencial',
    empresaId:   EMPRESA_ID,
    direccion:   'Ruta 40 Km 2110, Bariloche',
    responsable: uInsp1.displayName,
    activa:      true,
    ownerId:     OWNER_ID,
    createdAt:   ts(fecha(2024, 12, 1)),
    createdBy:   uAdmin.uid,
  });
  await db.doc(p('sucursales', SUCURSAL_2)).set({
    id:          SUCURSAL_2,
    nombre:      'Obra Sur — Centro Comercial',
    empresaId:   EMPRESA_ID,
    direccion:   'Av. Bustillo 3200, Bariloche',
    responsable: uInsp2.displayName,
    activa:      true,
    ownerId:     OWNER_ID,
    createdAt:   ts(fecha(2024, 12, 1)),
    createdBy:   uAdmin.uid,
  });
  console.log('  ✅ Obra Norte — Complejo Residencial');
  console.log('  ✅ Obra Sur   — Centro Comercial');

  // ── 4. EMPLEADOS ─────────────────────────────────────────
  console.log('\n👷 Creando empleados...');
  const emps = { s1: [], s2: [] };

  for (const emp of EMPLEADOS_S1) {
    const ref = db.collection(p('empleados')).doc();
    await ref.set({
      id:           ref.id,
      nombre:       emp.nombre,
      cargo:        emp.cargo,
      area:         emp.area,
      dni:          emp.dni,
      tipo:         emp.cargo.includes('Capataz') ? 'administrativo' : 'operativo',
      sucursalId:   SUCURSAL_1,
      empresaId:    EMPRESA_ID,
      ownerId:      OWNER_ID,
      estado:       'activo',
      fechaIngreso: ts(fecha(2024, 11, 1)),
      createdAt:    ts(fecha(2024, 12, 1)),
      createdBy:    uInsp1.uid,
    });
    emps.s1.push({ id: ref.id, nombre: emp.nombre, area: emp.area });
  }
  console.log(`  ✅ ${EMPLEADOS_S1.length} empleados — Obra Norte`);

  for (const emp of EMPLEADOS_S2) {
    const ref = db.collection(p('empleados')).doc();
    await ref.set({
      id:           ref.id,
      nombre:       emp.nombre,
      cargo:        emp.cargo,
      area:         emp.area,
      dni:          emp.dni,
      tipo:         emp.cargo.includes('Capataz') ? 'administrativo' : 'operativo',
      sucursalId:   SUCURSAL_2,
      empresaId:    EMPRESA_ID,
      ownerId:      OWNER_ID,
      estado:       'activo',
      fechaIngreso: ts(fecha(2024, 11, 1)),
      createdAt:    ts(fecha(2024, 12, 1)),
      createdBy:    uInsp2.uid,
    });
    emps.s2.push({ id: ref.id, nombre: emp.nombre, area: emp.area });
  }
  console.log(`  ✅ ${EMPLEADOS_S2.length} empleados — Obra Sur`);

  // ── 5. FORMULARIO HSE ────────────────────────────────────
  console.log('\n📋 Creando formulario HSE...');
  const seccionesConIds = SECCIONES.map((sec, si) => ({
    id:     `sec-${si + 1}`,
    nombre: sec.nombre,
    orden:  si + 1,
    preguntas: sec.preguntas.map((texto, pi) => ({
      id:        `preg-${si + 1}-${pi + 1}`,
      texto,
      tipo:      'si_no_na',
      orden:     pi + 1,
      requerida: true,
    })),
  }));
  const todasLasPreguntas = seccionesConIds.flatMap(sec =>
    sec.preguntas.map(preg => ({ ...preg, seccionId: sec.id }))
  );

  await db.doc(p('formularios', FORMULARIO_ID)).set({
    id:          FORMULARIO_ID,
    nombre:      'Inspección HSE — Obra en Construcción',
    descripcion: 'Formulario estándar de higiene y seguridad para obras civiles',
    version:     '2.0',
    activo:      true,
    secciones:   seccionesConIds,
    ownerId:     OWNER_ID,
    createdAt:   ts(fecha(2024, 12, 1)),
    createdBy:   uAdmin.uid,
    updatedAt:   ts(fecha(2025, 1, 5)),
  });
  console.log('  ✅ Formulario HSE — 4 secciones / 20 preguntas');

  // ── 6. AUDITORÍAS CON FORMULARIO ─────────────────────────
  console.log(`\n🔍 Creando ${AUDITORIAS_DEF.length} auditorías con formulario...`);

  for (const def of AUDITORIAS_DEF) {
    const auditorUser = resolverAuditor(def.auditor);
    const sucNombre   = def.suc === SUCURSAL_1
      ? 'Obra Norte — Complejo Residencial'
      : 'Obra Sur — Centro Comercial';
    const d = fecha(def.y, def.m, def.d);

    // Generar respuestas variadas y realistas
    const opciones = ['Conforme', 'No conforme', 'Necesita mejora', 'No aplica'];
    const respuestas = {};
    const comentarios = {};
    
    // Determinar distribución para esta auditoría (50-85% Conforme)
    const porcentajeConforme = 50 + Math.floor(Math.random() * 36); // 50-85%
    const totalPreguntas = todasLasPreguntas.length;
    const cantidadConforme = Math.floor((porcentajeConforme / 100) * totalPreguntas);
    
    // Generar respuestas aleatorias con la distribución deseada
    const respuestasArray = [];
    for (let i = 0; i < totalPreguntas; i++) {
      if (i < cantidadConforme) {
        respuestasArray.push('Conforme');
      } else {
        // Distribuir el resto entre No conforme, Necesita mejora y ocasionalmente No aplica
        const resto = totalPreguntas - cantidadConforme;
        if (Math.random() < 0.1 && resto > 2) { // 10% chance de No aplica
          respuestasArray.push('No aplica');
        } else {
          respuestasArray.push(Math.random() < 0.6 ? 'No conforme' : 'Necesita mejora');
        }
      }
    }
    
    // Mezclar las respuestas para que no estén agrupadas
    for (let i = respuestasArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [respuestasArray[i], respuestasArray[j]] = [respuestasArray[j], respuestasArray[i]];
    }
    
    // Asignar respuestas con claves seccion_X_pregunta_Y
    todasLasPreguntas.forEach((preg, idx) => {
      // Extraer índice de sección del ID de pregunta (ej: preg-1-3 -> sección 0)
      const seccionNum = parseInt(preg.id.split('-')[1]) - 1;
      const preguntaNum = parseInt(preg.id.split('-')[2]) - 1;
      const clave = `seccion_${seccionNum}_pregunta_${preguntaNum}`;
      respuestas[clave] = respuestasArray[idx];
      comentarios[clave] = respuestasArray[idx] === 'Conforme' ? '' : 
        respuestasArray[idx] === 'No aplica' ? 'No aplica a esta sección' : 
        'Requiere corrección inmediata';
    });
    
    // Calcular estadísticas desde las respuestas generadas
    const conteo = {
      'Conforme': 0,
      'No conforme': 0,
      'Necesita mejora': 0,
      'No aplica': 0
    };
    
    Object.values(respuestas).forEach(resp => {
      conteo[resp]++;
    });
    
    const totalSinNoAplica = totalPreguntas - conteo['No aplica'];
    const porcentajes = {};
    Object.keys(conteo).forEach(key => {
      const base = key === 'No aplica' ? totalPreguntas : totalSinNoAplica;
      porcentajes[key] = base > 0 ? ((conteo[key] / base) * 100).toFixed(2) : '0.00';
    });
    
    const sinNoAplica = {
      'Conforme': conteo['Conforme'],
      'No conforme': conteo['No conforme'],
      'Necesita mejora': conteo['Necesita mejora'],
      'No aplica': 0,
      total: totalSinNoAplica
    };
    
    // Generar clasificaciones por sección
    const clasificaciones = SECCIONES.map((sec, secIdx) => {
      const valores = [];
      for (let i = 0; i < 5; i++) {
        const preguntaKey = `seccion_${secIdx}_pregunta_${i}`;
        const respuesta = respuestas[preguntaKey] || 'Conforme';
        const condicion = respuesta === 'No conforme' ? Math.random() < 0.7 : Math.random() < 0.1;
        const actitud = respuesta === 'No conforme' ? Math.random() < 0.5 : Math.random() < 0.05;
        valores.push({ condicion, actitud });
      }
      return { seccion: secIdx, valores };
    });
    
    const ref = db.collection(p('reportes')).doc();
    await ref.set({
      // Identificación
      ownerId: OWNER_ID,
      appId: 'auditoria',
      version: '3.0',
      schemaVersion: 1,

      // Formulario y ubicación
      formularioId: FORMULARIO_ID,
      nombreForm: 'Inspección HSE - Obra en Construcción',
      empresaId: EMPRESA_ID,
      empresaNombre: 'Constructora del Sur S.A.',
      sucursal: sucNombre, // string directo, NO sucursalId
      
      // Quién hizo la auditoría
      creadoPor: auditorUser.uid,
      creadoPorEmail: auditorUser.email,
      nombreInspector: auditorUser.displayName,
      nombreResponsable: '',
      supervisor: auditorUser.displayName,

      // Fechas
      fechaCreacion: d.toISOString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),

      // Estado
      estado: 'completada',

      // Campos adicionales del formulario
      lugarSector: 'Sector principal',
      tareaObservada: 'Inspección general',
      numeroTrabajadores: '20',
      equiposInvolucrados: '4',

      // Secciones completas (igual que el formulario)
      secciones: seccionesConIds, // el array completo

      // Respuestas con clave seccion_X_pregunta_Y (base 0)
      respuestas,

      // Comentarios con misma clave
      comentarios,

      // Clasificaciones por sección
      clasificaciones,

      // Acciones requeridas (array, puede estar vacío)
      accionesRequeridas: [],

      // Imágenes (map vacío)
      imagenes: {},

      // Estadísticas calculadas desde las respuestas
      estadisticas: {
        conteo,
        porcentajes,
        sinNoAplica
      },

      // Archivos
      filesCount: 0,
      hasUploadFailures: false,
      filesUploadFailures: [],

      // Firmas
      firmaAuditor: null,
      firmaResponsable: null,

      // Nombre del archivo de reporte
      nombreArchivo: `Constructora del Sur S.A._${sucNombre.replace(/ - /g, '_')}_${def.y}-${String(def.m).padStart(2, '0')}-${String(def.d).padStart(2, '0')}`,
    });
  }
  console.log(`  ? ${AUDITORIAS_DEF.length} auditorías creadas`);

  // ── 7. AUDITORÍAS MANUALES ───────────────────────────────
  console.log(`\n📝 Creando ${MANUALES_DEF.length} auditorías manuales...`);

  for (const def of MANUALES_DEF) {
    const auditorUser = resolverAuditor(def.auditor);
    const d           = fecha(def.y, def.m, def.d);
    const closedAt    = new Date(d.getTime() + 3 * 24 * 60 * 60 * 1000);
    const ref         = db.collection(p('auditoriasManuales')).doc();
    await ref.set({
      id:            ref.id,
      nombre:        def.nombre,
      empresaId:     EMPRESA_ID,
      sucursalId:    def.suc,
      fecha:         ts(d),
      auditor:       auditorUser.displayName,
      auditorUid:    auditorUser.uid,
      observaciones: 'Revisión periódica completada. Sin novedades críticas fuera de lo registrado.',
      estado:        'cerrada',
      evidenciasCount: 0,
      ownerId:       OWNER_ID,
      createdBy:     auditorUser.uid,
      createdAt:     ts(d),
      updatedAt:     ts(d),
      closedAt:      ts(closedAt),
    });
    console.log(`  ✅ "${def.nombre}"`);
  }

  // ── 8. ACCIDENTES E INCIDENTES ───────────────────────────
  console.log(`\n⚠️  Creando ${EVENTOS_DEF.length} accidentes/incidentes...`);

  for (const ev of EVENTOS_DEF) {
    const reporterUser = resolverAuditor(ev.reporter);
    const empsPool     = ev.suc === SUCURSAL_1 ? emps.s1 : emps.s2;
    const empInv       = empsPool[ev.empIdx] || empsPool[0];
    const d            = fecha(ev.y, ev.m, ev.d);
    const closedAt     = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
    const ref          = db.collection(p('accidentes')).doc();

    await ref.set({
      id:          ref.id,
      tipo:        ev.tipo,
      descripcion: ev.desc,
      sucursalId:  ev.suc,
      empresaId:   EMPRESA_ID,
      ownerId:     OWNER_ID,
      estado:      'cerrado',
      activa:      false,
      fecha:       ts(d),
      fechaHora:   ts(d),
      fechaCreacion: ts(d),
      closedAt:    ts(closedAt),
      empleadosInvolucrados: ev.tipo === 'accidente' ? [{
        empleadoId:        empInv.id,
        empleadoNombre:    empInv.nombre,
        conReposo:         ev.conReposo,
        diasReposo:        ev.diasReposo || 0,
        fechaInicioReposo: ev.conReposo ? ts(d) : null,
        fechaFinReposo:    ev.conReposo
          ? ts(new Date(d.getTime() + ev.diasReposo * 24 * 60 * 60 * 1000))
          : null,
      }] : [],
      testigos: ev.tipo === 'incidente' ? [{
        empleadoId:     empInv.id,
        empleadoNombre: empInv.nombre,
      }] : [],
      accionesCorrectivas: 'Se reforzó protocolo de seguridad. Capacitación correctiva programada.',
      reportadoPor:        reporterUser.uid,
      reportadoPorNombre:  reporterUser.displayName,
      createdBy:           reporterUser.uid,
      createdAt:           ts(d),
    });
    console.log(`  ✅ ${ev.tipo.toUpperCase()} ${ev.y}/${ev.m} — ${empInv.nombre}${ev.conReposo ? ` (${ev.diasReposo}d reposo)` : ''}`);
  }

  // ── 9. AUSENCIAS / SALUD OCUPACIONAL ────────────────────
  console.log(`\n🏥 Creando ${AUSENCIAS_DEF.length} ausencias...`);

  for (const aus of AUSENCIAS_DEF) {
    const reporterUser = resolverAuditor(aus.reporter);
    const empsPool     = aus.suc === SUCURSAL_1 ? emps.s1 : emps.s2;
    const emp          = empsPool[aus.empIdx] || empsPool[0];
    const sucNombre    = aus.suc === SUCURSAL_1
      ? 'Obra Norte — Complejo Residencial'
      : 'Obra Sur — Centro Comercial';
    const fi      = fecha(aus.y, aus.m, aus.d);
    const ff      = new Date(fi); ff.setDate(ff.getDate() + aus.dias);
    const dedupe  = `${emp.id}|${aus.origen}|manual|${aus.y}-${String(aus.m).padStart(2,'0')}-${String(aus.d).padStart(2,'0')}`;
    const ref     = db.collection(p('ausencias')).doc();

    await ref.set({
      id:             ref.id,
      empresaId:      EMPRESA_ID,
      empresaNombre:  'Constructora del Sur S.A.',
      sucursalId:     aus.suc,
      sucursalNombre: sucNombre,
      empleadoId:     emp.id,
      empleadoNombre: emp.nombre,
      tipo:           aus.tipo,
      motivo:         aus.motivo,
      origen:         aus.origen,
      origenId:       null,
      dedupeKey:      dedupe,
      estado:         'cerrada',
      fechaInicio:    ts(fi),
      fechaFin:       ts(ff),
      diasAusente:    aus.dias,
      observaciones:  '',
      filesCount:     0,
      lastFileAt:     null,
      historial: [{
        tipo:    'created',
        detalle: 'Ausencia registrada',
        estado:  'cerrada',
        fecha:   ts(fi),
        uid:     reporterUser.uid,
        nombre:  reporterUser.displayName,
      }],
      ownerId:         OWNER_ID,
      createdBy:       reporterUser.uid,
      createdByNombre: reporterUser.displayName,
      createdAt:       ts(fi),
      updatedAt:       ts(fi),
    });
    console.log(`  ✅ ${aus.tipo} — ${emp.nombre} (${aus.dias}d)`);
  }

  // ── RESUMEN ──────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));
  console.log('🎉 SEED 1 COMPLETADO\n');
  console.log('📌 CUENTAS:');
  console.log(`   👑 demo@controlaudit.com                  (Admin/Owner)`);
  console.log(`   🔵 mgonzalez@constructoradelsur.com / 123123123  (Inspectora — Obra Norte)`);
  console.log(`   🔵 aruiz@constructoradelsur.com    / 123123123  (Inspector  — Obra Sur)\n`);
  console.log('📌 DATOS CREADOS:');
  console.log(`   ✅ 1 empresa, 2 sucursales, 20 empleados`);
  console.log(`   ✅ 1 formulario HSE (4 secciones / 20 preguntas)`);
  console.log(`   ✅ ${AUDITORIAS_DEF.length} auditorías con formulario (2025 + 2026)`);
  console.log(`   ✅ ${MANUALES_DEF.length} auditorías manuales`);
  console.log(`   ✅ ${EVENTOS_DEF.length} accidentes/incidentes (con días de reposo reales)`);
  console.log(`   ✅ ${AUSENCIAS_DEF.length} ausencias / salud ocupacional`);
  console.log('\n⚠️  Corré seed-demo-2.js para agregar el módulo de capacitaciones.');
  console.log('⚠️  Cerrá sesión y volvé a entrar para refrescar los claims.\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('\n💥 Error en seed-1:', err);
  process.exit(1);
});