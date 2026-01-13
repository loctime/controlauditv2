/**
 * Script D — Auditoría de metadata owner-centric (READ-ONLY)
 * ----------------------------------------------------------
 * Recorre todas las colecciones del owner y valida
 * que cada documento tenga metadata correcta.
 */

// ⚠️ Usar la instancia única de Firebase Admin del backend
import admin from "../firebaseAdmin.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ================== SETUP ==================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = admin.firestore();

// ================== CONFIG ==================

const OWNER_ID = "hTD8FYeueHhuXxGCjxD0DcYmkRG2";
const APP_ID = "auditoria";

const COLLECTIONS = [
  "empresas",
  "sucursales",
  "empleados",
  "formularios",
  "capacitaciones",
  "reportes",
];

// ================== MAIN ==================

async function run() {
  console.log("\n🔎 AUDITORÍA DE METADATA");
  console.log("=".repeat(60));
  console.log("Owner:", OWNER_ID);
  console.log("=".repeat(60));

  let errors = 0;

  for (const col of COLLECTIONS) {
    const snap = await db
      .collection("apps")
      .doc(APP_ID)
      .collection("owners")
      .doc(OWNER_ID)
      .collection(col)
      .get();

    console.log(`\n📁 ${col} (${snap.size})`);

    snap.forEach(doc => {
      const d = doc.data();
      const problems = [];

      if (d.ownerId !== OWNER_ID) problems.push("ownerId inválido");
      if (d.appId !== APP_ID) problems.push("appId inválido");
      if (d.migratedFrom !== "legacy") problems.push("migratedFrom faltante");
      if ("clienteAdminId" in d) problems.push("campo legacy clienteAdminId");
      if ("propietarioId" in d) problems.push("campo legacy propietarioId");

      if (problems.length > 0) {
        errors++;
        console.log(`❌ ${col}/${doc.id}`);
        problems.forEach(p => console.log(`   - ${p}`));
      }
    });

    if (errors === 0) {
      console.log("   ✅ OK");
    }
  }

  console.log("\n" + "=".repeat(60));
  if (errors === 0) {
    console.log("✅ METADATA CONSISTENTE — TODO CORRECTO");
  } else {
    console.log(`❌ METADATA CON PROBLEMAS (${errors})`);
  }
  console.log("=".repeat(60));
}

run().catch(err => {
  console.error("💥 Error en auditoría:", err);
  process.exit(1);
});
