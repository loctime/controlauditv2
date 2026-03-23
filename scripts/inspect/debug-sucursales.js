#!/usr/bin/env node

/**
 * Script de depuración de sucursales
 * NO modifica datos
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔴 UID que usa el FRONT
const UID = "wMmxyHYvCKchLJSX3FiZD5nvV2P2";

// Inicializar Firebase Admin
try {
  const serviceAccountPath = join(__dirname, "..", "backend", "serviceAccountKey-controlfile.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  console.log("✅ Firebase Admin SDK inicializado");
  console.log(`📊 Proyecto: ${serviceAccount.project_id}\n`);
} catch (err) {
  console.error("❌ Error inicializando Firebase:", err.message);
  process.exit(1);
}

const db = admin.firestore();

async function debugSucursales() {
  console.log("🔎 Inspeccionando sucursales del usuario:", UID);

  const ref = db
    .collection("apps")
    .doc("auditoria")
    .collection("users")
    .doc(UID)
    .collection("sucursales");

  const snap = await ref.get();

  console.log(`\n📁 Total sucursales: ${snap.size}\n`);

  snap.docs.forEach((doc, i) => {
    const d = doc.data();

    console.log("────────────────────────────────");
    console.log(`#${i + 1}`);
    console.log("ID:", doc.id);
    console.log("nombre:", d.nombre);
    console.log("empresaId:", d.empresaId);
    console.log("activa:", d.activa);
    console.log("estado:", d.estado);
    console.log("fechaCreacion:", d.fechaCreacion);
    console.log("createdAt:", d.createdAt);
    console.log("campos:", Object.keys(d));
  });

  console.log("\n✅ Fin inspección\n");
}

debugSucursales()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
