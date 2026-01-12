/**
 * Script C — INSPECCIÓN / DRY-RUN owner-centric
 * ---------------------------------------------
 * Analiza el estado de una cuenta migrada (o a migrar)
 * SIN escribir absolutamente nada en Firestore.
 *
 * Compara:
 *   migracion/legacy/{ownerId}/*.json
 * vs
 *   apps/auditoria/owners/{ownerId}/...
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

const COLLECTIONS = [
  "empresas",
  "sucursales",
  "empleados",
  "formularios",
  "capacitaciones",
  "reportes",
];

// ================== HELPERS ==================

function loadLegacy(name) {
  const file = path.join(LEGACY_BASE, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function countOwnerCollection(name) {
  const snap = await db
    .collection("apps")
    .doc("auditoria")
    .collection("owners")
    .doc(OWNER_ID)
    .collection(name)
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function indexById(arr) {
  return new Set(arr.map(d => d.id));
}

// ================== MAIN ==================

async function run() {
  console.log("\n🔍 INSPECCIÓN OWNER-CENTRIC");
  console.log("=".repeat(60));
  console.log("👤 Owner:", OWNER_ID);
  console.log("📁 Legacy:", LEGACY_BASE);
  console.log("=".repeat(60));

  if (!fs.existsSync(LEGACY_BASE)) {
    throw new Error("❌ No existe la carpeta legacy");
  }

  // ---- OWNER DOC
  const ownerRef = db
    .collection("apps")
    .doc("auditoria")
    .collection("owners")
    .doc(OWNER_ID);

  const ownerSnap = await ownerRef.get();

  if (!ownerSnap.exists) {
    console.log("❌ OWNER NO EXISTE en nuevo modelo");
  } else {
    const o = ownerSnap.data();
    console.log("✅ Owner existe");
    console.log(`   role: ${o.role}`);
    console.log(`   status: ${o.status}`);
    console.log(`   appId: ${o.appId}`);
  }

  console.log("\n📊 COMPARACIÓN LEGACY vs OWNER");
  console.log("-".repeat(60));

  const results = {};
  let blockingErrors = 0;

  for (const col of COLLECTIONS) {
    const legacyDocs = loadLegacy(col);
    const ownerDocs = await countOwnerCollection(col);

    const legacyIds = indexById(legacyDocs);
    const ownerIds = indexById(ownerDocs);

    const missing = [...legacyIds].filter(id => !ownerIds.has(id));
    const extra = [...ownerIds].filter(id => !legacyIds.has(id));

    results[col] = {
      legacy: legacyDocs.length,
      owner: ownerDocs.length,
      missing,
      extra,
    };

    const status =
      missing.length === 0
        ? "✅ OK"
        : ownerDocs.length === 0
        ? "❌ VACÍA"
        : "⚠️ INCOMPLETA";

    if (missing.length > 0 && col === "empresas") blockingErrors++;

    console.log(
      `${col.padEnd(15)} | legacy: ${legacyDocs.length
        .toString()
        .padEnd(4)} | owner: ${ownerDocs.length
        .toString()
        .padEnd(4)} | ${status}`
    );
  }

  console.log("\n🧠 VALIDACIONES BÁSICAS");
  console.log("-".repeat(60));

  // sucursal → empresa
  const empresas = indexById(loadLegacy("empresas"));
  const sucursales = loadLegacy("sucursales");

  const badSucursales = sucursales.filter(
    s => s.empresaId && !empresas.has(s.empresaId)
  );

  if (badSucursales.length > 0) {
    console.log(
      `❌ ${badSucursales.length} sucursal(es) con empresaId inexistente`
    );
    blockingErrors++;
  } else {
    console.log("✅ Sucursales → empresas OK");
  }

  console.log("\n🧾 RECOMENDACIÓN FINAL");
  console.log("=".repeat(60));

  if (blockingErrors > 0) {
    console.log("❌ NO IMPORTAR TODAVÍA");
    console.log("➜ Hay errores críticos de integridad");
  } else {
    console.log("✅ LISTO PARA IMPORTAR");
    console.log("➜ Script B puede ejecutarse con seguridad");
  }

  console.log("=".repeat(60));
}

run().catch(err => {
  console.error("💥 Error en inspección:", err);
  process.exit(1);
});
