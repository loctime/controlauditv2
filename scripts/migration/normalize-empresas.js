#!/usr/bin/env node
/**
 * NORMALIZACIÓN DE EMPRESAS
 * Corrige ownership al UID canónico
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ================= CONFIG ================= */

// 🔁 dejar true para revisar; cambiar a false para ejecutar real
const DRY_RUN = true

// UID canónico (ACTUAL)
const CANONICAL_UID = 'hTD8FYeueHhuXxGCjxD0DcYmkRG2'

// Service account del proyecto NUEVO (auditoria-new)
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
  console.log('\n🏢 NORMALIZACIÓN DE EMPRESAS\n')
  console.log('DRY_RUN:', DRY_RUN)
  console.log('UID canónico:', CANONICAL_UID)
  console.log('')

  const snap = await db.collection('empresas').get()

  let touched = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const updates = {}

    // propietario
    if (data.propietarioId && data.propietarioId !== CANONICAL_UID) {
      updates.propietarioId = CANONICAL_UID
    }

    // creador
    if (data.creadorId && data.creadorId !== CANONICAL_UID) {
      updates.creadorId = CANONICAL_UID
    }

    // admin
    if (data.clienteAdminId && data.clienteAdminId !== CANONICAL_UID) {
      updates.clienteAdminId = CANONICAL_UID
    }

    // socios: dejar solo el UID canónico (sin duplicados)
    if (Array.isArray(data.socios)) {
      const normalized = [...new Set(
        data.socios.map(uid => (uid === CANONICAL_UID ? uid : CANONICAL_UID))
      )]
      if (JSON.stringify(normalized) !== JSON.stringify(data.socios)) {
        updates.socios = normalized
      }
    }

    if (Object.keys(updates).length === 0) continue

    touched++
    console.log(`➡️ Empresa ${doc.id}`)
    console.log('   cambios:', updates)

    if (!DRY_RUN) {
      await doc.ref.update({
        ...updates,
        lastUidUpdate: admin.firestore.FieldValue.serverTimestamp()
      })
    }
  }

  console.log('\n📊 RESUMEN')
  console.log('Empresas con cambios:', touched)
  console.log('Modo:', DRY_RUN ? 'DRY_RUN (sin escribir)' : 'APLICADO')
  console.log('\n✅ Normalización de empresas finalizada\n')
  process.exit(0)
}

normalize().catch(console.error)
