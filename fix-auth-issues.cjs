// Script para diagnosticar y solucionar problemas de autenticación
// Basado en los logs de error encontrados

const fs = require('fs');
const path = require('path');

console.log('🔧 Diagnóstico de problemas de autenticación...\n');

// 1. Verificar configuración de Firebase
console.log('1. Verificando configuración de Firebase...');
const firebaseConfigPath = path.join(__dirname, 'src', 'firebaseConfig.js');
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');
  
  // Verificar que auth esté exportado correctamente
  if (!firebaseConfig.includes('export { db, storage, auth }')) {
    console.log('❌ Problema: auth no está siendo exportado correctamente');
    console.log('✅ Solución: Asegurar que auth esté en las exportaciones');
  } else {
    console.log('✅ auth está siendo exportado correctamente');
  }
  
  // Verificar configuración de Google Auth
  if (!firebaseConfig.includes('GoogleAuthProvider')) {
    console.log('❌ Problema: GoogleAuthProvider no está importado');
  } else {
    console.log('✅ GoogleAuthProvider está importado');
  }
} else {
  console.log('❌ No se encontró firebaseConfig.js');
}

// 2. Verificar servicios de usuario
console.log('\n2. Verificando servicios de usuario...');
const userServicePath = path.join(__dirname, 'src', 'services', 'userService.js');
if (fs.existsSync(userServicePath)) {
  const userService = fs.readFileSync(userServicePath, 'utf8');
  
  // Verificar importación de auth
  if (!userService.includes("import { auth } from '../firebaseConfig'")) {
    console.log('❌ Problema: auth no está siendo importado en userService');
  } else {
    console.log('✅ auth está siendo importado en userService');
  }
  
  // Verificar uso de getIdToken
  if (userService.includes('getIdToken(true)')) {
    console.log('✅ getIdToken está siendo usado correctamente');
  } else {
    console.log('❌ Problema: getIdToken no está siendo usado');
  }
} else {
  console.log('❌ No se encontró userService.js');
}

// 3. Verificar AuthContext
console.log('\n3. Verificando AuthContext...');
const authContextPath = path.join(__dirname, 'src', 'components', 'context', 'AuthContext.jsx');
if (fs.existsSync(authContextPath)) {
  const authContext = fs.readFileSync(authContextPath, 'utf8');
  
  // Verificar importación de auth
  if (!authContext.includes("import { auth, db, handleRedirectResult } from '../../firebaseConfig'")) {
    console.log('❌ Problema: auth no está siendo importado en AuthContext');
  } else {
    console.log('✅ auth está siendo importado en AuthContext');
  }
  
  // Verificar manejo de errores de autenticación
  if (authContext.includes('onAuthStateChanged')) {
    console.log('✅ onAuthStateChanged está siendo usado');
  } else {
    console.log('❌ Problema: onAuthStateChanged no está siendo usado');
  }
} else {
  console.log('❌ No se encontró AuthContext.jsx');
}

// 4. Verificar configuración de Vite
console.log('\n4. Verificando configuración de Vite...');
const viteConfigPath = path.join(__dirname, 'vite.config.js');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Verificar configuración de CORS
  if (viteConfig.includes('cors')) {
    console.log('✅ CORS está configurado en Vite');
  } else {
    console.log('⚠️ CORS no está configurado explícitamente en Vite');
  }
  
  // Verificar configuración de servidor
  if (viteConfig.includes('server')) {
    console.log('✅ Configuración de servidor encontrada');
  } else {
    console.log('⚠️ Configuración de servidor no encontrada');
  }
} else {
  console.log('❌ No se encontró vite.config.js');
}

// 5. Verificar variables de entorno
console.log('\n5. Verificando variables de entorno...');
const envFiles = [
  '.env.local',
  '.env.development',
  '.env.production'
];

envFiles.forEach(envFile => {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasFirebaseConfig = envContent.includes('VITE_FIREBASE_');
    console.log(`✅ ${envFile} encontrado${hasFirebaseConfig ? ' con configuración de Firebase' : ''}`);
  } else {
    console.log(`⚠️ ${envFile} no encontrado`);
  }
});

// 6. Recomendaciones de solución
console.log('\n6. Recomendaciones de solución:');
console.log('📋 Para solucionar los problemas identificados:');
console.log('');
console.log('a) Error "auth is not defined":');
console.log('   - Verificar que auth esté exportado en firebaseConfig.js');
console.log('   - Verificar que esté importado correctamente en todos los archivos que lo usan');
console.log('');
console.log('b) Errores de Cross-Origin-Opener-Policy:');
console.log('   - Agregar headers de seguridad en el servidor de desarrollo');
console.log('   - Configurar CORS correctamente');
console.log('');
console.log('c) Errores de Firestore bloqueados:');
console.log('   - Verificar bloqueadores de anuncios');
console.log('   - Agregar excepciones para localhost');
console.log('');
console.log('d) Optimizaciones generales:');
console.log('   - Implementar manejo de errores más robusto');
console.log('   - Agregar timeouts apropiados');
console.log('   - Mejorar logging para debugging');

console.log('\n🔧 Diagnóstico completado.');
