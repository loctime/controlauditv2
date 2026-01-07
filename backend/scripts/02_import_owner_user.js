/**
 * Script B — Importación owner-centric desde datos legacy
 * ------------------------------------------------------
 * Importa datos legacy exportados al modelo owner-centric
 * SIN tocar los datos legacy originales.
 *
 * Origen: migracion/legacy/{uid}/*.json
 * Destino: apps/auditoria/owners/{ownerId}/...
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

// ================== PATH SETUP ==================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== FIREBASE ADMIN ==================

const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../serviceAccountKey-controlfile.json"),
    "utf8"
  )
);

console.log("🔧 Inicializando Firebase Admin...");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ================== CONFIG ==================

const OWNER_ID = "hTD8FYeueHhuXxGCjxD0DcYmkRG2";

const LEGACY_BASE = path.resolve(
  process.cwd(),
  "migracion",
  "legacy",
  OWNER_ID
);

// ❌ usuarios.json NO se importa automáticamente
const COLLECTION_MAP = {
  empresas: "empresas",
  sucursales: "sucursales",
  empleados: "empleados",
  formularios: "formularios",
  capacitaciones: "capacitaciones",
  reportes: "reportes",
};

const EXPECTED_FILES = Object.keys(COLLECTION_MAP).map(
  (name) => `${name}.json`
);

// ================== HELPERS ==================

function reviveTimestamps(obj) {
  for (const k in obj) {
    if (
      obj[k] &&
      typeof obj[k] === "object" &&
      obj[k]._seconds !== undefined
    ) {
      obj[k] = new admin.firestore.Timestamp(
        obj[k]._seconds,
        obj[k]._nanoseconds || 0
      );
    }
  }
  return obj;
}

function transformDocument(doc, ownerId) {
  const { clienteAdminId, propietarioId, ...rest } = doc;

  return reviveTimestamps({
    ...rest,
    ownerId,
    appId: "auditoria",
    migratedFrom: "legacy",
  });
}

async function ensureOwnerDocument(ownerId) {
  const ownerRef = db
    .collection("apps")
    .doc("auditoria")
    .collection("owners")
    .doc(ownerId);

  const snap = await ownerRef.get();

  if (!snap.exists) {
    await ownerRef.set({
      uid: ownerId,
      appId: "auditoria",
      role: "admin",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedFrom: "legacy",
    });

    console.log("✅ Documento owner creado");
  } else {
    console.log("ℹ️ Documento owner ya existe");
  }
}

async function importCollection(collectionName, documents, ownerId) {
  const colRef = db
    .collection("apps")
    .doc("auditoria")
    .collection("owners")
    .doc(ownerId)
    .collection(collectionName);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of documents) {
    try {
      const docId =
        doc.id ||
        doc.uid ||
        doc.empresaId ||
        doc.sucursalId ||
        doc.empleadoId ||
        doc.formularioId ||
        doc.capacitacionId ||
        doc.reporteId;

      if (!docId) {
        console.warn(`⚠️ Documento sin ID en ${collectionName}`, doc);
        errors++;
        continue;
      }

      const ref = colRef.doc(docId);
      const snap = await ref.get();

      if (snap.exists) {
        skipped++;
        continue;
      }

      const transformed = transformDocument(doc, ownerId);
      await ref.set(transformed);

      imported++;
    } catch (err) {
      console.error(`❌ Error en ${collectionName}:`, err.message);
      errors++;
    }
  }

  return { imported, skipped, errors };
}

// ================== MAIN ==================

async function run() {
  console.log("🚀 Iniciando importación owner-centric");
  console.log("👤 Owner ID:", OWNER_ID);
  console.log("📁 Origen:", LEGACY_BASE);

  if (!fs.existsSync(LEGACY_BASE)) {
    throw new Error(`❌ No existe la carpeta legacy: ${LEGACY_BASE}`);
  }

  for (const file of EXPECTED_FILES) {
    if (!fs.existsSync(path.join(LEGACY_BASE, file))) {
      throw new Error(`❌ Falta archivo requerido: ${file}`);
    }
  }

  console.log("✅ Archivos legacy verificados");

  await ensureOwnerDocument(OWNER_ID);

  const results = {};
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [legacyName, collectionName] of Object.entries(COLLECTION_MAP)) {
    const filePath = path.join(LEGACY_BASE, `${legacyName}.json`);
    const documents = JSON.parse(fs.readFileSync(filePath, "utf8"));

    console.log(`\n📦 Importando ${collectionName} (${documents.length})`);

    const { imported, skipped, errors } = await importCollection(
      collectionName,
      documents,
      OWNER_ID
    );

    results[collectionName] = { imported, skipped, errors };
    totalImported += imported;
    totalSkipped += skipped;
    totalErrors += errors;

    console.log(
      `   ✅ ${collectionName}: ${imported} importados, ${skipped} existentes, ${errors} errores`
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN FINAL");
  console.log("=".repeat(60));

  Object.entries(results).forEach(([col, r]) => {
    console.log(
      `  ${col}: ${r.imported} importados, ${r.skipped} saltados, ${r.errors} errores`
    );
  });

  console.log("=".repeat(60));
  console.log(
    `TOTAL → ${totalImported} importados | ${totalSkipped} existentes | ${totalErrors} errores`
  );
  console.log("=".repeat(60));
  console.log("\n🎉 Migración owner-centric COMPLETA");
}

run().catch((err) => {
  console.error("💥 Error en migración:", err);
  process.exit(1);
});
