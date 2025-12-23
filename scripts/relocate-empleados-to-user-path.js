#!/usr/bin/env node
/**
 * REUBICACIÓN DE EMPPLEADOS
 * Desde: /empleados/{empleadoId}
 * Hacia: /apps/auditoria/users/{uid}/empleados/{empleadoId}
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ================= CONFIG ================= */

// 🔁 PRIMERO true. Cambiar a false para aplicar
const DRY_RUN = false

// UID canónico
const CANONICAL_UID = 'hTD8FYeueHhuXxGCjxD0DcYmkRG2'

// Service Account del proyecto NUEVO (auditoria-new)
const SA = JSON.parse(
  readFileSync(join(process.cwd(), 'backend', 'serviceAccountKey-controlfile.json'), 'utf8')
)

/* ================= INIT ================= */

admin.initializeApp({
  credential: admin.credential.cert(SA),
  projectId: 'controlstorage-eb796'
})

const db = admin.firestore()

/* ================= RELOCATE ================= */

async function relocate() {
  console.log('\n📦 REUBICACIÓN DE EMPLEADOS (ROOT → USER PATH)\n')
  console.log('DRY_RUN:', DRY_RUN)
  console.log('UID destino:', CANONICAL_UID)
  console.log('')

  const snap = await db.collection('empleados').get()

  if (snap.empty) {
    console.log('ℹ️ No hay empleados en raíz para reubicar')
    process.exit(0)
  }

  let total = 0
  let relocated = 0

  for (const doc of snap.docs) {
    total++

    const data = doc.data()
    const targetRef = db
      .collection('apps')
      .doc('auditoria')
      .collection('users')
      .doc(CANONICAL_UID)
      .collection('empleados')
      .doc(doc.id)

    console.log(`➡️ ${doc.id} (${data.nombre || 'sin nombre'})`)
    console.log(`   empresaId: ${data.empresaId}`)
    console.log(`   sucursalId: ${data.sucursalId}`)

    if (!DRY_RUN) {
      await targetRef.set(
        {
          ...data,

          // metadata de reubicación
          relocatedFromRoot: true,
          relocatedAt: admin.firestore.FieldValue.serverTimestamp(),
          relocatedBy: CANONICAL_UID
        },
        { merge: true }
      )

      relocated++
    }
  }

  console.log('\n📊 RESUMEN')
  console.log('Empleados en raíz:', total)
  console.log('Reubicados:', DRY_RUN ? 0 : relocated)
  console.log('Modo:', DRY_RUN ? 'DRY_RUN (sin escribir)' : 'APLICADO')
  console.log('\n✅ Reubicación finalizada\n')
  process.exit(0)
}

relocate().catch(console.error)
