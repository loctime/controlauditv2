#!/usr/bin/env node

/**
 * Auditoría de uso LEGACY en frontend
 * Busca filtros o accesos que ya no deberían existir
 */

import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(process.cwd(), "src");

const LEGACY_PATTERNS = [
  "clienteAdminId",
  "migratedFromUid",
  "propietarioId",
  "creadoPor",
  "usuarioId",
  "where(",
  "collection(db, 'empresas'",
  "collection(db, 'reportes'",
  "collection(db, 'sucursales'",
  "collection(db, 'empleados'",
  "collection(db, 'accidentes'",
];

const EXCLUDE_DIRS = [
  "node_modules",
  "dist",
  ".git",
  "scripts",
];

function walk(dir, results = []) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        walk(fullPath, results);
      }
    } else if (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(ROOT_DIR);

let found = false;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  LEGACY_PATTERNS.forEach(pattern => {
    if (content.includes(pattern)) {
      found = true;
      console.log("⚠️ LEGACY DETECTADO");
      console.log("📄 Archivo:", file.replace(process.cwd(), ""));
      console.log("🔎 Patrón:", pattern);
      console.log("─".repeat(60));
    }
  });
}

if (!found) {
  console.log("✅ Auditoría OK: no se detectó lógica legacy");
} else {
  console.log("\n❌ Hay restos legacy. Revisar archivos listados arriba.");
}
