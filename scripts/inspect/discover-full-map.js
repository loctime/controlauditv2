#!/usr/bin/env node
/**
 * DESCUBRIMIENTO COMPLETO DE DATOS (READ ONLY)
 * Construye el mapa real:
 * EMPRESAS -> SUCURSALES -> EMPLEADOS
 */

import admin from 'firebase-admin'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/* ================= CONFIG ================= */

const SERVICE_ACCOUNT = JSON.parse(
  readFileSync(join(process.cwd(), 'backend', 'serviceAccountKey.json'), 'utf8')
)

const PROJECT_ID = 'auditoria-f9fc4'

// identidad histórica
const EMAIL = 'ssanabria.sh@gmail.com'
const HISTORIC_UIDS = [
  'pbLX5nBx2WTZV1Z0sFMJkVtSmZy2',
  'nRULnL7XWAex0U2RtsbWkJEPcYp1',
  'hTD8FYeueHhuXxGCjxD0DcYmkRG2'
]

// campos a inspeccionar
const UID_FIELDS = [
  'creadorId',
  'createdBy',
  'actualizadoPor',
  'usuarioId',
  'propietarioId',
  'clienteAdminId'
]

const EMAIL_FIELDS = [
  'creadorEmail',
  'propietarioEmail',
  'emailUsuario',
  'emailContacto'
]

/* ================= INIT ================= */

admin.initializeApp({
  credential: admin.credential.cert(SERVICE_ACCOUNT),
  projectId: PROJECT_ID
})

const db = admin.firestore()

/* ================= HELPERS ================= */

function extractUIDs(data) {
  return UID_FIELDS
    .filter(f => data[f])
    .map(f => ({ field: f, value: data[f] }))
}

function extractEmails(data) {
  return EMAIL_FIELDS
    .filter(f => data[f])
    .map(f => ({ field: f, value: data[f] }))
}

function isRelatedToIdentity(data) {
  const emailMatch = EMAIL_FIELDS.some(f => data[f] === EMAIL)
  const uidMatch = UID_FIELDS.some(f => HISTORIC_UIDS.includes(data[f]))
  return emailMatch || uidMatch
}

/* ================= DISCOVERY ================= */

async function discover() {
  console.log('\n🧭 INICIANDO DESCUBRIMIENTO COMPLETO\n')

  const result = {
    meta: {
      email: EMAIL,
      historicUIDs: HISTORIC_UIDS,
      discoveredAt: new Date().toISOString()
    },
    empresas: {}
  }

  /* -------- EMPRESAS -------- */

  const empresasSnap = await db.collection('empresas').get()

  for (const doc of empresasSnap.docs) {
    const data = doc.data()
    if (!isRelatedToIdentity(data)) continue

    result.empresas[doc.id] = {
      id: doc.id,
      nombre: data.nombre,
      metadata: {
        uids: extractUIDs(data),
        emails: extractEmails(data),
        migratedFromUid: data.migratedFromUid,
        lastUidUpdate: data.lastUidUpdate
      },
      sucursales: {}
    }
  }

  console.log(`🏢 Empresas encontradas: ${Object.keys(result.empresas).length}`)

  /* -------- SUCURSALES -------- */

  const sucursalesSnap = await db.collection('sucursales').get()

  for (const doc of sucursalesSnap.docs) {
    const data = doc.data()
    const empresaId = data.empresaId
    if (!empresaId || !result.empresas[empresaId]) continue

    result.empresas[empresaId].sucursales[doc.id] = {
      id: doc.id,
      nombre: data.nombre,
      empresaId,
      metadata: {
        uids: extractUIDs(data),
        emails: extractEmails(data),
        migratedFromUid: data.migratedFromUid,
        lastUidUpdate: data.lastUidUpdate
      },
      empleados: {}
    }
  }

  /* -------- EMPLEADOS -------- */

  const empleadosSnap = await db.collection('empleados').get()

  for (const doc of empleadosSnap.docs) {
    const data = doc.data()
    const sucursalId = data.sucursalId
    if (!sucursalId) continue

    // buscar sucursal dentro de empresas descubiertas
    for (const empresa of Object.values(result.empresas)) {
      if (!empresa.sucursales[sucursalId]) continue

      empresa.sucursales[sucursalId].empleados[doc.id] = {
        id: doc.id,
        nombre: `${data.nombre || ''} ${data.apellido || ''}`.trim(),
        empresaId: data.empresaId,
        sucursalId,
        metadata: {
          uids: extractUIDs(data),
          migratedFromUid: data.migratedFromUid,
          lastUidUpdate: data.lastUidUpdate
        }
      }
    }
  }

  /* -------- OUTPUT -------- */

  const file = join(process.cwd(), 'discovery-map.json')
  writeFileSync(file, JSON.stringify(result, null, 2))

  console.log('✅ Descubrimiento finalizado')
  console.log(`📄 Archivo generado: ${file}\n`)
  process.exit(0)
}

discover().catch(console.error)
