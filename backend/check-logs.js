#!/usr/bin/env node

// Script para verificar logs en producción
import fetch from 'node-fetch';
import { getEnvironmentInfo } from './config/environment.js';

const envInfo = getEnvironmentInfo();
const baseUrl = process.env.BACKEND_URL || 'https://controlauditv2.onrender.com';

console.log('🔍 Verificando logs en producción...');
console.log(`📍 URL del backend: ${baseUrl}`);
console.log(`🌍 Entorno: ${envInfo.nodeEnv}`);
console.log('');

async function checkEndpoint(endpoint, description) {
  try {
    console.log(`📡 Probando: ${description}`);
    const response = await fetch(`${baseUrl}${endpoint}`);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📋 Respuesta:`, data);
    console.log('');
    
    return { success: true, data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('');
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando verificación de logs...\n');
  
  // Verificar endpoints básicos
  await checkEndpoint('/', 'Endpoint raíz');
  await checkEndpoint('/health', 'Health check');
  await checkEndpoint('/api/health', 'Health check alternativo');
  await checkEndpoint('/api/status', 'Status del sistema');
  
  // Verificar Firebase
  await checkEndpoint('/api/test-firebase', 'Test de Firebase');
  
  console.log('📝 Para ver logs en tiempo real:');
  console.log('1. Ve a https://dashboard.render.com');
  console.log('2. Busca tu servicio "controlaudit-backend"');
  console.log('3. Haz clic en la pestaña "Logs"');
  console.log('4. Los logs aparecerán en formato JSON en producción');
  console.log('');
  console.log('🔧 Consejos para debugging:');
  console.log('- Los logs en producción están en formato JSON');
  console.log('- Cada log incluye timestamp, nivel, entorno y mensaje');
  console.log('- Usa el endpoint /api/status para verificar el estado del sistema');
  console.log('- Los errores se loggean automáticamente con contexto');
}

main().catch(console.error);
