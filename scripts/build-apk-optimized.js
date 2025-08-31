#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build optimizado de APK...');

try {
  // 1. Limpiar build anterior
  console.log('🧹 Limpiando build anterior...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }
  
  // 2. Build optimizado de producción
  console.log('📦 Construyendo aplicación...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  // 3. Sincronizar con Capacitor (optimizado)
  console.log('🔄 Sincronizando con Capacitor...');
  execSync('npx cap sync android --no-build', { stdio: 'inherit' });
  
  // 4. Build de APK optimizado
  console.log('📱 Construyendo APK...');
  execSync('cd android && ./gradlew assembleDebug --parallel --max-workers=4', { 
    stdio: 'inherit',
    env: { ...process.env, GRADLE_OPTS: '-Dorg.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m' }
  });
  
  console.log('✅ APK construida exitosamente!');
  console.log('📁 Ubicación: android/app/build/outputs/apk/debug/app-debug.apk');
  
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}
