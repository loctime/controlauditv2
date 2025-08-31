// Script para probar la configuración de la API
import { getEnvironment, getEnvironmentConfig } from './src/config/api.js';

console.log('🧪 Probando configuración de API...\n');

// Simular window.location.hostname para desarrollo
global.window = {
  location: {
    hostname: 'localhost'
  }
};

try {
  const env = getEnvironment();
  console.log(`🌍 Entorno detectado: ${env}`);
  
  const config = getEnvironmentConfig();
  console.log(`🔧 Configuración:`, config);
  
  console.log('\n✅ Configuración correcta');
  console.log(`📍 URL base: ${config.baseURL}`);
  console.log(`⏱️ Timeout: ${config.timeout}ms`);
  
} catch (error) {
  console.error('❌ Error en configuración:', error);
}
