import { Capacitor } from '@capacitor/core';
import fs from 'fs';
import path from 'path';

async function runGoogleAuthDiagnostics() {
  console.log('🔍 Iniciando diagnóstico detallado de Google Auth');
  
  // Información de plataforma
  console.log('📱 Información de Plataforma:');
  console.log('Platform:', Capacitor.getPlatform());
  console.log('Is Native Platform:', Capacitor.isNativePlatform());
  
  // Verificar disponibilidad de módulos
  console.log('\n🧩 Verificación de Módulos:');
  try {
    const googleAuthModule = await import('@southdevs/capacitor-google-auth');
    console.log('✅ Módulo @southdevs/capacitor-google-auth disponible');
    console.log('Módulos disponibles:', Object.keys(googleAuthModule));
  } catch (error) {
    console.error('❌ Error al cargar módulo @southdevs/capacitor-google-auth:', error);
  }
  
  // Verificar configuración de Firebase
  console.log('\n🔥 Configuración de Firebase:');
  try {
    const configPath = path.resolve(__dirname, '../src/config/environment.js');
    const firebaseConfig = await import(configPath);
    console.log('Firebase Config:', JSON.stringify(
      firebaseConfig.FIREBASE_APK_config || 
      firebaseConfig.FIREBASE_APK_CONFIGURATION || 
      firebaseConfig.default?.FIREBASE_APK_config, 
      null, 2
    ));
  } catch (error) {
    console.error('❌ Error al obtener configuración de Firebase:', error);
  }
  
  // Verificar credenciales de Google
  console.log('\n🔑 Verificación de Credenciales de Google:');
  try {
    const configPath = path.resolve(__dirname, '../capacitor.config.ts');
    const capacitorConfig = await import(configPath);
    console.log('Google Auth Config:', JSON.stringify(
      capacitorConfig.default?.plugins?.GoogleAuth || 
      capacitorConfig.plugins?.GoogleAuth, 
      null, 2
    ));
  } catch (error) {
    console.error('❌ Error al obtener configuración de Google Auth:', error);
  }
  
  // Intentar inicialización de Google Auth
  console.log('\n🚀 Prueba de Inicialización de Google Auth:');
  try {
    const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
    await GoogleAuth.initialize({
      scopes: ['profile', 'email'],
      serverClientId: '909876364192-dhqhd9k0h0qkidt4p4pv4ck3utgob7pt.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    });
    console.log('✅ Inicialización de Google Auth exitosa');
  } catch (error) {
    console.error('❌ Error en inicialización de Google Auth:', error);
    console.error('Detalles completos:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  }
  
  // Verificar estado de Play Services
  console.log('\n🌐 Estado de Play Services:');
  try {
    const { Plugins } = await import('@capacitor/core');
    const playServicesAvailable = await Plugins.GoogleAuth?.isPlayServicesAvailable?.();
    console.log('Play Services Disponibles:', playServicesAvailable);
  } catch (error) {
    console.error('❌ Error al verificar Play Services:', error);
  }
}

// Ejecutar diagnóstico
runGoogleAuthDiagnostics().catch(console.error);
