// Script para probar la configuración de Firebase
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, 'env.local') });
dotenv.config();

console.log('🧪 Probando configuración de Firebase...');
console.log('📋 Variables de entorno cargadas:');

const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_CLIENT_ID'
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      console.log(`✅ ${varName}: ${value.substring(0, 50)}...`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NO DEFINIDA`);
  }
});

console.log('\n🔧 Verificando formato de credenciales...');

if (process.env.FIREBASE_PRIVATE_KEY) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('✅ Formato de clave privada correcto');
  } else {
    console.log('❌ Formato de clave privada incorrecto');
  }
}

console.log('\n📁 Archivos de configuración:');
const configFiles = ['env.local', '.env', 'serviceAccountKey.json'];
configFiles.forEach(file => {
  try {
    const fs = require('fs');
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file}: ${stats.size} bytes`);
    } else {
      console.log(`❌ ${file}: No encontrado`);
    }
  } catch (error) {
    console.log(`❌ ${file}: Error al verificar`);
  }
});

console.log('\n✅ Prueba de configuración completada');
