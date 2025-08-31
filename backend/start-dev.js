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
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  console.error('💡 Asegúrate de que el archivo env.local esté configurado correctamente');
  process.exit(1);
}

console.log('✅ Variables de entorno verificadas');

// Verificar formato de clave privada
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
  console.error('❌ Formato de clave privada incorrecto');
  process.exit(1);
}

console.log('✅ Formato de credenciales verificado');

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
