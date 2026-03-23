#!/usr/bin/env node
/**
 * NORMALIZACIÓN FINAL DE EMPLEADOS
 * - Corrige empresaId
 * - Normaliza UIDs al UID canónico
 * - Mantiene historial
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ================= CONFIG ================= */

// 🔁 Primero true. Cambiar a false para aplicar
const DRY_RUN = true

// UID canónico
const CANONICAL_UID = 'hTD8FYeueHhuXxGCjxD0DcYmkRG2'

// Empresa operativa correcta
const CANONICAL_EMPRESA_ID = 'E65GgRA804BtOZuWTJ8o'

// Service Account del proyecto NUEVO
const SA = JSON.parse(
  readFileSync(join(process.cwd(), 'backend', 'serviceAccountKey-controlfile.json'), 'utf8')
)

/* ================= INIT ================= */

admin.initializeApp({
  credential: admin.credential.cert(SA),
  projectId: 'controlstorage-eb796'
})

const db = admin.firestore()

/* ================= NORMALIZE ================= */

async function normalize() {
  console.log('\n👷 NORMALIZACIÓN FINAL DE EMPLEADOS\n')
  console.log('DRY_RUN:', DRY_RUN)
  console.log('UID canónico:', CANONICAL_UID)
  console.log('Empresa canónica:', CANONICAL_EMPRESA_ID)
  console.log('')

  const snap = await db.collection('empleados').get()

  let touched = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const updates = {}

    // empresaId incorrecto
    if (data.empresaId !== CANONICAL_EMPRESA_ID) {
      updates.empresaId = CANONICAL_EMPRESA_ID
    }

    // createdBy
    if (data.createdBy && data.createdBy !== CANONICAL_UID) {
      updates.createdBy = CANONICAL_UID
    }

    // actualizadoPor
    if (data.actualizadoPor && data.actualizadoPor !== CANONICAL_UID) {
      updates.actualizadoPor = CANONICAL_UID
    }

    if (Object.keys(updates).length === 0) continue

    touched++
    console.log(`➡️ Empleado ${doc.id} (${data.nombre || 'sin nombre'})`)
    console.log('   cambios:', updates)

    if (!DRY_RUN) {
      await doc.ref.update({
        ...updates,
        lastUidUpdate: admin.firestore.FieldValue.serverTimestamp()
      })
    }
  }

  console.log('\n📊 RESUMEN')
  console.log('Empleados con cambios:', touched)
  console.log('Modo:', DRY_RUN ? 'DRY_RUN (sin escribir)' : 'APLICADO')
  console.log('\n✅ Normalización de empleados finalizada\n')
  process.exit(0)
}

normalize().catch(console.error)
