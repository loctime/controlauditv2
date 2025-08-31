// Script para solucionar problemas de credenciales de Firebase
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, 'env.local') });
dotenv.config();

console.log('🔧 Solucionando problemas de credenciales de Firebase...');

// Función para limpiar la clave privada
function cleanPrivateKey(privateKey) {
  // Remover comillas si existen
  let cleaned = privateKey.replace(/^["']|["']$/g, '');
  
  // Asegurar que los saltos de línea estén correctos
  cleaned = cleaned.replace(/\\n/g, '\n');
  
  // Verificar que comience y termine correctamente
  if (!cleaned.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌ La clave privada no tiene el formato correcto');
    return null;
  }
  
  if (!cleaned.endsWith('-----END PRIVATE KEY-----')) {
    console.error('❌ La clave privada no termina correctamente');
    return null;
  }
  
  return cleaned;
}

// Función para crear un nuevo archivo env.local
async function createFixedEnvFile() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ No se encontró FIREBASE_PRIVATE_KEY en las variables de entorno');
    return;
  }
  
  console.log('🔍 Analizando clave privada...');
  const cleanedKey = cleanPrivateKey(privateKey);
  
  if (!cleanedKey) {
    console.error('❌ No se pudo limpiar la clave privada');
    return;
  }
  
  console.log('✅ Clave privada limpiada correctamente');
  
  // Crear el nuevo contenido del archivo
  const envContent = `# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=${process.env.FIREBASE_PROJECT_ID}
FIREBASE_CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL}
FIREBASE_PRIVATE_KEY="${cleanedKey}"
FIREBASE_PRIVATE_KEY_ID=${process.env.FIREBASE_PRIVATE_KEY_ID}
FIREBASE_CLIENT_ID=${process.env.FIREBASE_CLIENT_ID}

# Environment
NODE_ENV=development
PORT=4000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
`;
  
  // Crear backup del archivo actual
  const backupPath = path.join(__dirname, 'env.local.backup');
  try {
    await fs.copyFile(path.join(__dirname, 'env.local'), backupPath);
    console.log('✅ Backup creado: env.local.backup');
  } catch (error) {
    console.log('⚠️ No se pudo crear backup (archivo no existe)');
  }
  
  // Escribir el nuevo archivo
  try {
    await fs.writeFile(path.join(__dirname, 'env.local'), envContent, 'utf8');
    console.log('✅ Archivo env.local actualizado con credenciales corregidas');
  } catch (error) {
    console.error('❌ Error escribiendo archivo:', error.message);
    return;
  }
  
  console.log('\n🔧 Credenciales corregidas. Ahora prueba:');
  console.log('   npm run test:firebase');
  console.log('   npm run dev');
}

// Función para verificar el formato de la clave
function verifyKeyFormat(privateKey) {
  console.log('\n🔍 Verificando formato de clave privada...');
  
  // Verificar longitud
  console.log(`📏 Longitud: ${privateKey.length} caracteres`);
  
  // Verificar caracteres especiales
  const hasQuotes = privateKey.includes('"') || privateKey.includes("'");
  console.log(`📝 Tiene comillas: ${hasQuotes ? 'Sí' : 'No'}`);
  
  const hasNewlines = privateKey.includes('\\n');
  console.log(`📝 Tiene \\n: ${hasNewlines ? 'Sí' : 'No'}`);
  
  const hasActualNewlines = privateKey.includes('\n');
  console.log(`📝 Tiene saltos de línea reales: ${hasActualNewlines ? 'Sí' : 'No'}`);
  
  // Verificar estructura
  const hasBegin = privateKey.includes('-----BEGIN PRIVATE KEY-----');
  const hasEnd = privateKey.includes('-----END PRIVATE KEY-----');
  
  console.log(`📝 Tiene BEGIN: ${hasBegin ? 'Sí' : 'No'}`);
  console.log(`📝 Tiene END: ${hasEnd ? 'Sí' : 'No'}`);
  
  return hasBegin && hasEnd;
}

// Ejecutar el script
async function main() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ No se encontró FIREBASE_PRIVATE_KEY');
    return;
  }
  
  console.log('📋 Variables de entorno encontradas:');
  console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`   Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
  console.log(`   Private Key ID: ${process.env.FIREBASE_PRIVATE_KEY_ID}`);
  
  verifyKeyFormat(privateKey);
  
  console.log('\n🔧 ¿Quieres corregir las credenciales? (s/n)');
  console.log('   (Esto creará un backup y actualizará env.local)');
  
  // En un entorno real, aquí pedirías confirmación
  // Por ahora, procedemos automáticamente
  console.log('\n🔄 Procediendo con la corrección...');
  await createFixedEnvFile();
}

main().catch(console.error);
