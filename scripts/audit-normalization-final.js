#!/usr/bin/env node
/**
 * AUDITORÍA FINAL DE NORMALIZACIÓN
 * NO escribe nada. Solo reporta.
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ================= CONFIG ================= */

const CANONICAL_UID = 'hTD8FYeueHhuXxGCjxD0DcYmkRG2'
const CANONICAL_EMPRESA_ID = 'E65GgRA804BtOZuWTJ8o'

const OLD_UIDS = [
  'pbLX5nBx2WTZV1Z0sFMJkVtSmZy2',
  'nRULnL7XWAex0U2RtsbWkJEPcYp1'
]

// Service Account auditoria-new
const SA = JSON.parse(
  readFileSync(join(process.cwd(), 'backend', 'serviceAccountKey-controlfile.json'), 'utf8')
)

/* ================= INIT ================= */

admin.initializeApp({
  credential: admin.credential.cert(SA),
  projectId: 'controlstorage-eb796'
})

const db = admin.firestore()

/* ================= HELPERS ================= */

function containsOldUid(obj) {
  return JSON.stringify(obj).includes(OLD_UIDS[0]) ||
         JSON.stringify(obj).includes(OLD_UIDS[1])
}

/* ================= AUDIT ================= */

async function auditCollection(path, options = {}) {
  const snap = await db.collection(path).get()

  let issues = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const problems = []

    if (options.checkEmpresa && data.empresaId !== CANONICAL_EMPRESA_ID) {
      problems.push(`empresaId inválido (${data.empresaId})`)
    }

    if (options.checkUid) {
      if (
        data.createdBy && data.createdBy !== CANONICAL_UID ||
        data.creadorId && data.creadorId !== CANONICAL_UID ||
        data.clienteAdminId && data.clienteAdminId !== CANONICAL_UID
      ) {
        problems.push('UID no canónico')
      }
    }

    if (containsOldUid(data)) {
      problems.push('Contiene UID viejo')
    }

    if (problems.length) {
      issues++
      console.log(`❌ ${path}/${doc.id}`)
      problems.forEach(p => console.log('   -', p))
    }
  }

  console.log(`\n📁 ${path}`)
  console.log('Documentos:', snap.size)
  console.log('Con problemas:', issues)
  console.log('-----------------------------\n')
}

/* ================= RUN ================= */

async function run() {
  console.log('\n🔍 AUDITORÍA FINAL DE NORMALIZACIÓN\n')

  await auditCollection('empresas', { checkEmpresa: false, checkUid: true })
  await auditCollection('sucursales', { checkEmpresa: true, checkUid: true })

  await auditCollection(
    `apps/auditoria/users/${CANONICAL_UID}/empleados`,
    { checkEmpresa: true, checkUid: true }
  )

  await auditCollection('accidentes', { checkEmpresa: true, checkUid: true })
  await auditCollection('capacitaciones', { checkEmpresa: true, checkUid: true })
  await auditCollection('ausencias', { checkEmpresa: true, checkUid: true })
  await auditCollection('formularios', { checkEmpresa: false, checkUid: true })
  await auditCollection('reportes', { checkEmpresa: true, checkUid: true })

  console.log('✅ Auditoría finalizada\n')
  process.exit(0)
}

run().catch(console.error)
