/**
 * Script: cleanup-auditoria-users.js
 * Elimina todos los usuarios de Firestore excepto una whitelist
 */

import admin from "firebase-admin"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 🔐 Inicializar Firebase Admin
try {
  const serviceAccountPath = join(__dirname, "..", "backend", "serviceAccountKey-controlfile.json")
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"))

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    })
  }

  console.log("✅ Firebase Admin SDK inicializado")
  console.log(`📊 Proyecto: ${serviceAccount.project_id}\n`)
} catch (error) {
  console.error("❌ Error inicializando Firebase Admin SDK:", error.message)
  process.exit(1)
}

const db = admin.firestore()

// ✅ WHITELIST (NO SE BORRAN)
const ALLOWED_UIDS = new Set([
  "wMmxyHYvCKchLJSX3FiZD5nvV2P2", // ddd@gmail.com
  "rj3YvdLbmhNIDu0r93sOlGDGFrh1", // gaston.cariota@seguramente.com.ar
  "cdmKQ3eKAIaUkQnNFHVHMDqTWIN2", // paola.aznar@seguramente.com.ar
  "hTD8FYeueHhuXxGCjxD0DcYmkRG2", // ssanabria.sh@gmail.com
])

async function run() {
  console.log("🚨 INICIANDO LIMPIEZA DE USUARIOS AUDITORIA")
  console.log("🔒 Usuarios protegidos:", ALLOWED_UIDS.size)

  const usersRef = db.collection("apps").doc("auditoria").collection("users")
  const snapshot = await usersRef.get()

  let deleted = 0
  let skipped = 0

  for (const doc of snapshot.docs) {
    const uid = doc.id
    const data = doc.data()

    if (ALLOWED_UIDS.has(uid)) {
      console.log(`🛑 SKIP ${uid} (${data.email})`)
      skipped++
      continue
    }

    console.log(`❌ DELETE ${uid} (${data.email})`)
    await doc.ref.delete()
    deleted++
  }

  console.log("===================================")
  console.log(`✅ Eliminados: ${deleted}`)
  console.log(`🔒 Protegidos: ${skipped}`)
  console.log("🎉 LIMPIEZA FINALIZADA")
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("🔥 ERROR:", err)
    process.exit(1)
  })
