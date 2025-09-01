/**
 * Script de prueba para la nueva integración de ControlFile
 * Basado en la guía de integración oficial
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ControlFileClient } from './src/lib/controlfile-sdk.js';

// Configuración para el proyecto central de Auth
const firebaseConfig = {
  apiKey: "AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg",
  authDomain: "controlstorage-eb796.firebaseapp.com",
  projectId: "controlstorage-eb796",
  storageBucket: "controlstorage-eb796.appspot.com",
  messagingSenderId: "156800340171",
  appId: "1:156800340171:web:fbe017105fd68b0f114b4e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Inicializar cliente ControlFile
const controlFile = new ControlFileClient(
  'https://controlfile.onrender.com',
  async () => {
    if (!auth.currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return await auth.currentUser.getIdToken();
  }
);

// Función de login con Google
async function loginWithGoogle() {
  try {
    console.log('🔐 Iniciando login con Google...');
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    console.log('✅ Login exitoso:', result.user.email);
    return result;
  } catch (error) {
    console.error('❌ Error en login:', error);
    throw error;
  }
}

// Función de ejemplo de subida
async function uploadExample(file) {
  try {
    console.log('🚀 Iniciando subida de ejemplo:', file.name);
    
    // 1. Crear sesión de subida
    const presign = await controlFile.presignUpload({ 
      name: file.name, 
      size: file.size, 
      mime: file.type, 
      parentId: null 
    });
    
    console.log('✅ Sesión de subida creada:', presign);
    
    if (presign.url) {
      // 2. Subir archivo (PUT simple)
      const put = await fetch(presign.url, { 
        method: 'PUT', 
        body: file 
      });
      
      if (!put.ok) {
        throw new Error('PUT failed');
      }
      
      // 3. Confirmar subida
      const etag = put.headers.get('etag');
      const confirmResult = await controlFile.confirm({ 
        uploadSessionId: presign.uploadSessionId, 
        etag: etag 
      });
      
      console.log('✅ Archivo subido exitosamente:', confirmResult);
      return confirmResult;
      
    } else if (presign.multipart) {
      console.log('⚠️ Subida multipart no implementada aún');
      throw new Error('Subida multipart no implementada');
    }
    
  } catch (error) {
    console.error('❌ Error en subida:', error);
    throw error;
  }
}

// Función para listar archivos
async function listRoot() {
  try {
    console.log('📁 Listando archivos raíz...');
    const { items } = await controlFile.list({ parentId: null, pageSize: 50 });
    console.log('✅ Archivos listados:', items);
    return items;
  } catch (error) {
    console.error('❌ Error listando archivos:', error);
    throw error;
  }
}

// Función para verificar claims
async function verifyClaims() {
  try {
    console.log('🔍 Verificando claims del usuario...');
    const tokenResult = await auth.currentUser.getIdTokenResult(true);
    console.log('✅ Claims del usuario:', tokenResult.claims);
    return tokenResult.claims;
  } catch (error) {
    console.error('❌ Error verificando claims:', error);
    throw error;
  }
}

// Función principal de prueba
async function runTests() {
  try {
    console.log('🧪 Iniciando pruebas de integración ControlFile...');
    
    // 1. Verificar conectividad
    console.log('\n1️⃣ Verificando conectividad...');
    const health = await controlFile.health();
    console.log('✅ Health check:', health);
    
    // 2. Login
    console.log('\n2️⃣ Iniciando sesión...');
    await loginWithGoogle();
    
    // 3. Verificar claims
    console.log('\n3️⃣ Verificando claims...');
    const claims = await verifyClaims();
    console.log('✅ Claims verificados:', claims);
    
    // 4. Verificar perfil de usuario
    console.log('\n4️⃣ Verificando perfil de usuario...');
    const profile = await controlFile.getUserProfile();
    console.log('✅ Perfil de usuario:', profile);
    
    // 5. Listar archivos
    console.log('\n5️⃣ Listando archivos...');
    const files = await listRoot();
    console.log('✅ Archivos encontrados:', files.length);
    
    // 6. Probar subida (opcional)
    console.log('\n6️⃣ ¿Deseas probar una subida? (s/n)');
    // En un entorno real, aquí pedirías confirmación al usuario
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { loginWithGoogle, uploadExample, listRoot, verifyClaims, runTests };
