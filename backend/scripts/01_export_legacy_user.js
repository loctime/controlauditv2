/**
 * Script A — Exportación READ-ONLY de usuario legacy ControlAudit
 * --------------------------------------------------------------
 * Exporta TODO el contenido de:
 *   apps/auditoria/users/{legacyUserId}
 *
 * Salida:
 *   backend/migracion/legacy/{legacyUserId}/
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ========= CONFIG =========

// ⚠️ PONER ACÁ EL UID LEGACY (el único usuario a migrar)
const LEGACY_USER_ID = "hTD8FYeueHhuXxGCjxD0DcYmkRG2";

// Carpeta de salida
const OUTPUT_BASE = path.resolve(
  process.cwd(),
  "migracion",
  "legacy",
  LEGACY_USER_ID
);

const db = admin.firestore();

// ========= HELPERS =========

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function exportCollection(colRef, outputFile) {
  const snap = await colRef.get();
  const data = [];

  snap.forEach((doc) => {
    data.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf8");
  console.log(`📄 Exportado ${outputFile} (${data.length} docs)`);
}

// ========= MAIN =========

async function run() {
  console.log("🚀 Iniciando exportación legacy (READ-ONLY)");
  console.log("👤 Legacy UID:", LEGACY_USER_ID);

  ensureDir(OUTPUT_BASE);

  const userRef = db
    .collection("apps")
    .doc("auditoria")
    .collection("users")
    .doc(LEGACY_USER_ID);

  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("❌ El usuario legacy NO existe");
  }

  // ---- Documento principal
  const userData = {
    id: userSnap.id,
    ...userSnap.data(),
  };

  fs.writeFileSync(
    path.join(OUTPUT_BASE, "usuario.json"),
    JSON.stringify(userData, null, 2),
    "utf8"
  );

  console.log("✅ Documento principal exportado");

  // ---- Subcolecciones
  const subcols = await userRef.listCollections();

  const resumen = {
    legacyUserId: LEGACY_USER_ID,
    subcolecciones: {},
  };

  for (const col of subcols) {
    const colName = col.id;
    const outFile = path.join(OUTPUT_BASE, `${colName}.json`);

    await exportCollection(col, outFile);

    const count = JSON.parse(fs.readFileSync(outFile)).length;
    resumen.subcolecciones[colName] = count;
  }

  // ---- Resumen final
  fs.writeFileSync(
    path.join(OUTPUT_BASE, "resumen.json"),
    JSON.stringify(resumen, null, 2),
    "utf8"
  );

  console.log("🎉 Exportación legacy completa");
  console.log("📁 Carpeta:", OUTPUT_BASE);
}

run().catch((err) => {
  console.error("💥 Error en exportación legacy:", err);
  process.exit(1);
});
