#!/usr/bin/env node
/**
 * Auditoría de datos por UID y EMAIL
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ================= CONFIG ================= */

const SERVICE_ACCOUNT = JSON.parse(
  readFileSync(join(process.cwd(), 'backend', 'serviceAccountKey.json'), 'utf8')
)

const PROJECT_ID = 'auditoria-f9fc4'

const EMAIL = 'ssanabria.sh@gmail.com'
const UIDS = [
  'pbLX5nBx2WTZV1Z0sFMJkVtSmZy2',
  'nRULnL7XWAex0U2RtsbWkJEPcYp1'
]

const COLLECTIONS = [
  'empresas',
  'sucursales',
  'empleados',
  'auditorias',
  'formularios',
  'reportes',
  'capacitaciones',
  'files',
  'uploadSessions'
]

const EMAIL_FIELDS = [
  'email',
  'emailUsuario',
  'creadoPorEmail',
  'usuarioEmail',
  'emailContacto'
]

const UID_FIELDS = [
  'userId',
  'usuarioId',
  'creadoPor',
  'propietarioId',
  'clienteAdminId'
]

/* ================= INIT ================= */

admin.initializeApp({
  credential: admin.credential.cert(SERVICE_ACCOUNT),
  projectId: PROJECT_ID
})

const db = admin.firestore()

/* ================= AUDIT ================= */

async function audit() {
  console.log('\n🔍 AUDITORÍA UID + EMAIL\n')
  console.log('Email:', EMAIL)
  console.log('UIDs:', UIDS.join(', '))
  console.log('')

  for (const col of COLLECTIONS) {
    const snap = await db.collection(col).get()
    if (snap.empty) continue

    let hits = []

    for (const doc of snap.docs) {
      const data = doc.data()

      const emailMatch = EMAIL_FIELDS.some(
        f => data[f] && data[f] === EMAIL
      )

      const uidMatch = UID_FIELDS.some(
        f => data[f] && UIDS.includes(data[f])
      )

      if (emailMatch || uidMatch) {
        hits.push({
          id: doc.id,
          emailMatch,
          uidMatch,
          matchedUIDs: UID_FIELDS
            .filter(f => UIDS.includes(data[f]))
            .map(f => `${f}:${data[f]}`),
          empresaId: data.empresaId,
          sucursalId: data.sucursalId
        })
      }
    }

    if (hits.length > 0) {
      console.log(`📁 ${col}: ${hits.length} coincidencias`)
      hits.forEach(h =>
        console.log('  -', h.id, h)
      )
      console.log('----------------------------------------')
    }
  }

  console.log('✅ Auditoría finalizada\n')
  process.exit(0)
}

audit().catch(console.error)
