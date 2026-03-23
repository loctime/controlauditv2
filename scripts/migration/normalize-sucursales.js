#!/usr/bin/env node
/**
 * NORMALIZACIÓN DE SUCURSALES
 * Corrige ownership y referencias de UID al UID canónico
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ================= CONFIG ================= */

// 🔁 Dejar true para revisar; poner false para aplicar
const DRY_RUN = true

// UID canónico (ACTUAL)
const CANONICAL_UID = 'hTD8FYeueHhuXxGCjxD0DcYmkRG2'

// Empresa canónica (solo validación)
const CANONICAL_EMPRESA_ID = 'E65GgRA804BtOZuWTJ8o'

// Service account del proyecto NUEVO
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
  console.log('\n🏬 NORMALIZACIÓN DE SUCURSALES\n')
  console.log('DRY_RUN:', DRY_RUN)
  console.log('UID canónico:', CANONICAL_UID)
  console.log('Empresa canónica (validación):', CANONICAL_EMPRESA_ID)
  console.log('')

  const snap = await db.collection('sucursales').get()

  let touched = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const updates = {}

    // Validación empresa
    if (data.empresaId && data.empresaId !== CANONICAL_EMPRESA_ID) {
      console.warn(`⚠️ Sucursal ${doc.id} apunta a otra empresa:`, data.empresaId)
      // NO corregimos empresaId automáticamente
    }

    // Ownership / tracking
    if (data.creadorId && data.creadorId !== CANONICAL_UID) {
      updates.creadorId = CANONICAL_UID
    }

    if (data.creadoPor && data.creadoPor !== CANONICAL_UID) {
      updates.creadoPor = CANONICAL_UID
    }

    if (data.clienteAdminId && data.clienteAdminId !== CANONICAL_UID) {
      updates.clienteAdminId = CANONICAL_UID
    }

    if (data.modificadoPor && data.modificadoPor !== CANONICAL_UID) {
      updates.modificadoPor = CANONICAL_UID
    }

    // Emails (si existen, mantenerlos; no normalizamos emails acá)
    // migratedFromUid se conserva

    if (Object.keys(updates).length === 0) continue

    touched++
    console.log(`➡️ Sucursal ${doc.id} (${data.nombre || 'sin nombre'})`)
    console.log('   cambios:', updates)

    if (!DRY_RUN) {
      await doc.ref.update({
        ...updates,
        lastUidUpdate: admin.firestore.FieldValue.serverTimestamp()
      })
    }
  }

  console.log('\n📊 RESUMEN')
  console.log('Sucursales con cambios:', touched)
  console.log('Modo:', DRY_RUN ? 'DRY_RUN (sin escribir)' : 'APLICADO')
  console.log('\n✅ Normalización de sucursales finalizada\n')
  process.exit(0)
}

normalize().catch(console.error)
