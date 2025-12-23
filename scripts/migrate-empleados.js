#!/usr/bin/env node
/**
 * MIGRACIÓN DE EMPLEADOS (LEGACY → FIRESTORE NUEVO)
 * Fuente: Firestore legacy
 * Destino: Firestore nuevo
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ================= CONFIG ================= */

// 🔁 cambiar a false cuando estés seguro
const DRY_RUN = false


// UID canónico (ACTUAL)
const CANONICAL_UID = 'hTD8FYeueHhuXxGCjxD0DcYmkRG2'

// Empresa canónica (según discovery)
const CANONICAL_EMPRESA_ID = 'E65GgRA804BtOZuWTJ8o'

// Ruta del mapa descubierto
const DISCOVERY_FILE = join(process.cwd(), 'discovery-map.json')

// Service accounts
const LEGACY_SA = JSON.parse(
  readFileSync(join(process.cwd(), 'backend', 'serviceAccountKey.json'), 'utf8')
)

const NEW_SA = JSON.parse(
  readFileSync(join(process.cwd(), 'backend', 'serviceAccountKey-controlfile.json'), 'utf8')
)

/* ================= INIT ================= */

const legacyApp = admin.initializeApp(
  {
    credential: admin.credential.cert(LEGACY_SA),
    projectId: 'auditoria-f9fc4'
  },
  'legacy'
)

const newApp = admin.initializeApp(
  {
    credential: admin.credential.cert(NEW_SA),
    projectId: 'controlstorage-eb796'
  },
  'controlfile'
)

const legacyDb = legacyApp.firestore()
const newDb = newApp.firestore()

/* ================= LOAD MAP ================= */

const discovery = JSON.parse(readFileSync(DISCOVERY_FILE, 'utf8'))

/* ================= MIGRATION ================= */

async function migrate() {
  console.log('\n👷 MIGRACIÓN DE EMPLEADOS\n')
  console.log('DRY_RUN:', DRY_RUN)
  console.log('UID canónico:', CANONICAL_UID)
  console.log('Empresa canónica:', CANONICAL_EMPRESA_ID)
  console.log('')

  let total = 0
  let migrated = 0

  for (const empresa of Object.values(discovery.empresas)) {
    for (const sucursal of Object.values(empresa.sucursales)) {
      for (const empleado of Object.values(sucursal.empleados)) {
        total++

        const legacySnap = await legacyDb
          .collection('empleados')
          .doc(empleado.id)
          .get()

        if (!legacySnap.exists) {
          console.warn(`⚠️ Empleado no encontrado en legacy: ${empleado.id}`)
          continue
        }

        const data = legacySnap.data()

        const newEmpleado = {
          ...data,

          // 🔁 normalización inicial
          empresaId: CANONICAL_EMPRESA_ID,
          sucursalId: sucursal.id,

          createdBy: CANONICAL_UID,
          actualizadoPor: CANONICAL_UID,

          // metadata de migración
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          migratedFromEmpleadoId: empleado.id,
          migratedFromProject: 'legacy-auditoria'
        }

        console.log(`➡️ ${empleado.nombre} (${empleado.id})`)
        console.log(`   sucursal: ${sucursal.nombre}`)
        console.log(`   empresaId: ${CANONICAL_EMPRESA_ID}`)

        if (!DRY_RUN) {
          await newDb
            .collection('empleados')
            .doc(empleado.id) // mantenemos ID
            .set(newEmpleado, { merge: true })

          migrated++
        }
      }
    }
  }

  console.log('\n📊 RESUMEN')
  console.log('Total empleados detectados:', total)
  console.log('Migrados:', DRY_RUN ? 0 : migrated)
  console.log('\n✅ Migración finalizada\n')
  process.exit(0)
}

migrate().catch(console.error)
