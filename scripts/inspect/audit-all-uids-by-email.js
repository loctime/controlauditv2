#!/usr/bin/env node
/**
 * Auditoría completa por EMAIL
 * Descubre TODOS los UID históricos asociados
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
  console.log('\n🔍 AUDITORÍA GLOBAL POR EMAIL\n')
  console.log('Email:', EMAIL)
  console.log('')

  const uidStats = {}   // uid -> { count, collections }
  const hits = []

  for (const col of COLLECTIONS) {
    const snap = await db.collection(col).get()
    if (snap.empty) continue

    for (const doc of snap.docs) {
      const data = doc.data()

      const emailMatch = EMAIL_FIELDS.some(
        f => data[f] && data[f] === EMAIL
      )

      if (!emailMatch) continue

      const foundUIDs = UID_FIELDS
        .filter(f => data[f])
        .map(f => data[f])

      foundUIDs.forEach(uid => {
        if (!uidStats[uid]) {
          uidStats[uid] = { count: 0, collections: new Set() }
        }
        uidStats[uid].count++
        uidStats[uid].collections.add(col)
      })

      hits.push({
        collection: col,
        id: doc.id,
        uids: foundUIDs,
        empresaId: data.empresaId
      })
    }
  }

  /* ================= OUTPUT ================= */

  console.log('📌 UIDs encontrados para este email:\n')

  Object.entries(uidStats).forEach(([uid, info]) => {
    console.log(`🆔 ${uid}`)
    console.log(`   documentos: ${info.count}`)
    console.log(`   colecciones: ${[...info.collections].join(', ')}`)
    console.log('')
  })

  console.log('----------------------------------------')
  console.log(`📊 Total documentos relacionados al email: ${hits.length}`)
  console.log('----------------------------------------\n')

  console.log('✅ Auditoría finalizada\n')
  process.exit(0)
}

audit().catch(console.error)
