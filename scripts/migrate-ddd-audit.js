#!/usr/bin/env node

/**
 * Script FINAL de migración de auditoría
 * Limpio, determinístico y coherente
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/* ================= CONFIG ================= */

const USER_EMAIL = 'ddd@gmail.com'
const OLD_UID = 'M80UldJYWkVBLtzM0meo6Mlj4TJ2'
const SOURCE_PROJECT_ID = 'auditoria-f9fc4'
const TARGET_PROJECT_ID = 'controlstorage-eb796'

const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1'
const newUserId = process.argv[2]

if (!newUserId) {
  console.error('❌ Falta newUserId')
  process.exit(1)
}

/* ================= INIT FIREBASE ================= */

const sourceSA = JSON.parse(
  readFileSync(join(__dirname, '..', 'backend', 'serviceAccountKey.json'), 'utf8')
)

const targetSA = JSON.parse(
  readFileSync(join(__dirname, '..', 'backend', 'serviceAccountKey-controlfile.json'), 'utf8')
)

const sourceApp = admin.initializeApp(
  { credential: admin.credential.cert(sourceSA), projectId: SOURCE_PROJECT_ID },
  'source'
)

const targetApp = admin.initializeApp(
  { credential: admin.credential.cert(targetSA), projectId: TARGET_PROJECT_ID },
  'target'
)

const sourceDb = admin.firestore(sourceApp)
const targetDb = admin.firestore(targetApp)

/* ================= HELPERS ================= */

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

const COLLECTIONS = [
  'empresas',
  'sucursales',
  'empleados',
  'auditorias',
  'auditorias_agendadas',
  'formularios',
  'reportes',
  'capacitaciones',
  'files',
  'uploadSessions'
]

function belongsToUser(data) {
  if (!data) return false

  if (EMAIL_FIELDS.some(f => data[f] === USER_EMAIL)) return true
  if (UID_FIELDS.some(f => data[f] === OLD_UID)) return true

  return false
}

function normalizeUIDs(data) {
  const cloned = { ...data }

  for (const field of UID_FIELDS) {
    if (cloned[field] === OLD_UID) {
      cloned[field] = newUserId
    }
  }

  return cloned
}

/* ================= MIGRATION ================= */

async function migrateCollection(name) {
  console.log(`📦 ${name}`)
  const snap = await sourceDb.collection(name).get()

  if (snap.empty) {
    console.log('   (vacía)')
    return
  }

  for (const doc of snap.docs) {
    if (!belongsToUser(doc.data())) continue

    const data = normalizeUIDs(doc.data())
    const path = `apps/auditoria/users/${newUserId}/${name}/${doc.id}`

    if (DRY_RUN) {
      console.log(`   [DRY] ${path}`)
    } else {
      await targetDb
        .collection('apps')
        .doc('auditoria')
        .collection('users')
        .doc(newUserId)
        .collection(name)
        .doc(doc.id)
        .set(data)
      console.log(`   ✅ ${doc.id}`)
    }
  }
}

/* ================= META ================= */

async function createMeta() {
  const meta = {
    email: USER_EMAIL,
    role: 'supermax',
    migratedFrom: {
      oldUid: OLD_UID,
      projectId: SOURCE_PROJECT_ID
    },
    migratedAt: admin.firestore.FieldValue.serverTimestamp()
  }

  if (DRY_RUN) {
    console.log('[DRY] meta/user')
  } else {
    await targetDb
      .collection('apps')
      .doc('auditoria')
      .collection('users')
      .doc(newUserId)
      .collection('meta')
      .doc('user')
      .set(meta)
  }
}

/* ================= MAIN ================= */

async function main() {
  console.log('🚀 MIGRACIÓN AUDITORÍA')
  console.log(`Modo: ${DRY_RUN ? 'DRY' : 'REAL'}`)
  console.log('')

  if (!DRY_RUN) {
    console.log('⏳ Ejecutando en 5s… CTRL+C para cancelar')
    await new Promise(r => setTimeout(r, 5000))
  }

  await createMeta()

  for (const col of COLLECTIONS) {
    await migrateCollection(col)
  }

  console.log('✅ Migración finalizada')
  process.exit(0)
}

main()
