#!/usr/bin/env node

/**
 * Script para leer datos visibles de un usuario por UID
 * SOLO LECTURAS - NO modifica datos
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Obtener UID del argumento de línea de comandos
const uid = process.argv[2];

if (!uid) {
  console.error('❌ Error: Debes proporcionar un UID como argumento');
  console.log('📋 Uso: node scripts/readUserData.js <UID>');
  process.exit(1);
}

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
  console.log(`🔍 Buscando datos para UID: ${uid}\n`);
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Función para formatear Timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Función para formatear documento
const formatDoc = (doc) => {
  const data = doc.data();
  const formatted = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && value.toDate) {
      formatted[key] = formatTimestamp(value);
    } else if (Array.isArray(value)) {
      formatted[key] = value.map(item => {
        if (item && typeof item === 'object' && item.toDate) {
          return formatTimestamp(item);
        }
        return item;
      });
    } else {
      formatted[key] = value;
    }
  }
  
  return {
    id: doc.id,
    ...formatted
  };
};

// 1. Listar empresas donde propietarioId == UID
async function getEmpresasPropietario() {
  try {
    console.log('📦 1. Empresas donde propietarioId == UID');
    console.log('─'.repeat(60));
    
    const empresasRef = db.collection('empresas');
    const snapshot = await empresasRef.where('propietarioId', '==', uid).get();
    
    if (snapshot.empty) {
      console.log('   No se encontraron empresas\n');
      return [];
    }
    
    const empresas = [];
    snapshot.forEach(doc => {
      const empresa = formatDoc(doc);
      empresas.push(empresa);
      console.log(`   ✓ ${empresa.nombre || empresa.id}`);
      console.log(`     ID: ${empresa.id}`);
      console.log(`     Propietario: ${empresa.propietarioEmail || empresa.propietarioId}`);
      if (empresa.createdAt) console.log(`     Creada: ${empresa.createdAt}`);
      console.log('');
    });
    
    console.log(`   Total: ${empresas.length} empresa(s)\n`);
    return empresas;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return [];
  }
}

// 2. Listar empresas donde socios contiene UID
async function getEmpresasSocio() {
  try {
    console.log('👥 2. Empresas donde socios contiene UID');
    console.log('─'.repeat(60));
    
    const empresasRef = db.collection('empresas');
    const snapshot = await empresasRef.where('socios', 'array-contains', uid).get();
    
    if (snapshot.empty) {
      console.log('   No se encontraron empresas\n');
      return [];
    }
    
    const empresas = [];
    snapshot.forEach(doc => {
      const empresa = formatDoc(doc);
      empresas.push(empresa);
      console.log(`   ✓ ${empresa.nombre || empresa.id}`);
      console.log(`     ID: ${empresa.id}`);
      console.log(`     Propietario: ${empresa.propietarioEmail || empresa.propietarioId}`);
      console.log(`     Socios: ${empresa.socios ? empresa.socios.length : 0}`);
      if (empresa.createdAt) console.log(`     Creada: ${empresa.createdAt}`);
      console.log('');
    });
    
    console.log(`   Total: ${empresas.length} empresa(s)\n`);
    return empresas;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return [];
  }
}

// 3. Listar reportes donde creadorId == UID
async function getReportesCreador() {
  try {
    console.log('📊 3. Reportes donde creadorId == UID');
    console.log('─'.repeat(60));
    
    const reportesRef = db.collection('reportes');
    const snapshot = await reportesRef.where('creadorId', '==', uid).get();
    
    if (snapshot.empty) {
      console.log('   No se encontraron reportes\n');
      return [];
    }
    
    const reportes = [];
    snapshot.forEach(doc => {
      const reporte = formatDoc(doc);
      reportes.push(reporte);
      console.log(`   ✓ Reporte ID: ${reporte.id}`);
      if (reporte.nombreFormulario) console.log(`     Formulario: ${reporte.nombreFormulario}`);
      if (reporte.sucursal) console.log(`     Sucursal: ${reporte.sucursal}`);
      if (reporte.fechaCreacion) console.log(`     Fecha: ${reporte.fechaCreacion}`);
      console.log('');
    });
    
    console.log(`   Total: ${reportes.length} reporte(s)\n`);
    return reportes;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return [];
  }
}

// Ejecutar todas las consultas
async function main() {
  try {
    const empresasPropietario = await getEmpresasPropietario();
    const empresasSocio = await getEmpresasSocio();
    const reportes = await getReportesCreador();
    
    // Resumen final
    console.log('═'.repeat(60));
    console.log('📋 RESUMEN');
    console.log('═'.repeat(60));
    console.log(`   Empresas (propietario): ${empresasPropietario.length}`);
    console.log(`   Empresas (socio): ${empresasSocio.length}`);
    console.log(`   Reportes: ${reportes.length}`);
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  } finally {
    // Cerrar conexión
    process.exit(0);
  }
}

main();

