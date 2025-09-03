#!/usr/bin/env node

/**
 * Script para limpiar y reconstruir el proyecto Capacitor
 * Resuelve problemas de resolución de módulos
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando limpieza y reconstrucción de Capacitor...');

try {
  // 1. Limpiar directorios de build
  console.log('🧹 Limpiando directorios de build...');
  
  const dirsToClean = [
    'dist',
    'android/app/build',
    'android/build',
    'node_modules/.vite'
  ];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`   Limpiando ${dir}...`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  
  // 2. Limpiar cache de npm
  console.log('📦 Limpiando cache de npm...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  // 3. Reinstalar dependencias
  console.log('📥 Reinstalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });
  
  // 4. Build específico para Capacitor
  console.log('🏗️  Construyendo para Capacitor...');
  execSync('npm run build:capacitor', { stdio: 'inherit' });
  
  // 5. Sincronizar con Capacitor
  console.log('🔄 Sincronizando con Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  // 6. Limpiar build de Android
  console.log('🤖 Limpiando build de Android...');
  execSync('cd android && gradlew clean && cd ..', { stdio: 'inherit' });
  
  // 7. Aplicar fixes de Java
  console.log('☕ Aplicando fixes de Java...');
  if (process.platform === 'win32') {
    execSync('android\\auto-fix-java.bat', { stdio: 'inherit' });
  } else {
    execSync('./android/auto-fix-java.sh', { stdio: 'inherit' });
  }
  
  console.log('✅ Limpieza y reconstrucción completada exitosamente!');
  console.log('🚀 Ahora puedes ejecutar: npm run fer');
  
} catch (error) {
  console.error('❌ Error durante la limpieza y reconstrucción:', error.message);
  process.exit(1);
}
