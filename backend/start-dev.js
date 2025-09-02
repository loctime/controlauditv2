// Script de inicio para desarrollo con verificación de Firebase
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, 'env.local') });
dotenv.config();

console.log('🚀 Iniciando servidor de desarrollo con verificación de Firebase...');

// Verificar variables de entorno requeridas
// Primero intentar con variables individuales, luego con FB_ADMIN_IDENTITY/FB_ADMIN_APPDATA
const hasIndividualVars = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
const hasIdentityVars = process.env.FB_ADMIN_IDENTITY || process.env.FB_ADMIN_APPDATA;

if (!hasIndividualVars && !hasIdentityVars) {
  console.error('❌ Variables de entorno faltantes para Firebase');
  console.error('💡 Necesitas configurar:');
  console.error('   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  console.error('   - O FB_ADMIN_IDENTITY o FB_ADMIN_APPDATA');
  console.error('💡 Asegúrate de que el archivo env.local esté configurado correctamente');
  process.exit(1);
}

if (hasIndividualVars) {
  console.log('✅ Variables de entorno individuales de Firebase verificadas');
  
  // Verificar formato de clave privada
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌ Formato de clave privada incorrecto');
    process.exit(1);
  }
  
  console.log('✅ Formato de credenciales individuales verificado');
} else if (hasIdentityVars) {
  console.log('✅ Variables de entorno FB_ADMIN_IDENTITY/FB_ADMIN_APPDATA verificadas');
  
  // Verificar que se pueda parsear el JSON
  try {
    const identityData = process.env.FB_ADMIN_IDENTITY || process.env.FB_ADMIN_APPDATA;
    const serviceAccount = JSON.parse(identityData);
    
    if (!serviceAccount.private_key || !serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ Formato de clave privada incorrecto en FB_ADMIN_IDENTITY/FB_ADMIN_APPDATA');
      process.exit(1);
    }
    
    console.log('✅ Formato de credenciales FB_ADMIN_IDENTITY/FB_ADMIN_APPDATA verificado');
  } catch (error) {
    console.error('❌ Error parseando FB_ADMIN_IDENTITY/FB_ADMIN_APPDATA:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor con nodemon
console.log('🔄 Iniciando servidor con nodemon...');

const nodemon = spawn('npx', ['nodemon', 'index.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

nodemon.on('error', (error) => {
  console.error('❌ Error iniciando nodemon:', error);
  process.exit(1);
});

nodemon.on('exit', (code) => {
  console.log(`📤 Servidor terminado con código: ${code}`);
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal SIGINT, terminando servidor...');
  nodemon.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal SIGTERM, terminando servidor...');
  nodemon.kill('SIGTERM');
});
