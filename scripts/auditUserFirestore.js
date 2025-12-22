#!/usr/bin/env node

/**
 * Script de auditoría para inspeccionar datos en Firestore
 * SOLO LECTURAS - NO modifica datos
 * 
 * Uso: node scripts/auditUserFirestore.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔴 UID ACTUAL (el que usás al loguearte)
const UID_ACTUAL = "M80UldJYWkVBLtzM0meo6Mlj4TJ2";

// 🔴 UID DONDE SABEMOS QUE HAY DATOS
const UID_DATOS = "wMmxyHYvCKchLJSX3FiZD5nvV2P2";

const COLLECTIONS = [
  "empresas",
  "sucursales",
  "empleados",
  "capacitaciones",
  "accidentes",
  "reportes",
];

// Inicializar Firebase Admin SDK
try {
  const serviceAccountPath = join(__dirname, '..', 'backend', 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }
  
  console.log('✅ Firebase Admin SDK inicializado');
  console.log(`📊 Proyecto: ${serviceAccount.project_id}\n`);
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function inspectUser(uid) {
  console.log('\n===============================');
  console.log('INSPECCIONANDO USUARIO:', uid);
  console.log('===============================');

  for (const col of COLLECTIONS) {
    const ref = db
      .collection("apps")
      .doc("auditoria")
      .collection("users")
      .doc(uid)
      .collection(col);

    try {
      const snap = await ref.limit(5).get();

      console.log(`\n📁 ${col}: ${snap.size} documentos`);

      if (snap.empty) {
        console.log(`   └─ (vacío)`);
        continue;
      }

      snap.docs.forEach((doc, i) => {
        const data = doc.data();
        const campos = Object.keys(data);
        console.log(`  └─ ${i + 1}. ${doc.id}`);
        console.log(`     campos: [${campos.join(', ')}]`);
        
        // Mostrar algunos valores clave si existen
        if (data.nombre) console.log(`        nombre: "${data.nombre}"`);
        if (data.createdAt) console.log(`        createdAt: ${data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt}`);
      });
    } catch (error) {
      console.error(`   ❌ Error leyendo ${col}:`, error.message);
    }
  }
}

(async () => {
  try {
    await inspectUser(UID_ACTUAL);
    await inspectUser(UID_DATOS);
    
    console.log('\n═══════════════════════════════════');
    console.log('✅ Auditoría completada');
    console.log('═══════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();

