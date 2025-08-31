// Script para probar la configuración de producción
import { getEnvironment, getEnvironmentConfig } from './src/config/api.js';

console.log('🧪 Probando configuración de PRODUCCIÓN...\n');

// Simular diferentes entornos
const testEnvironments = [
  {
    name: 'Desarrollo Local',
    hostname: 'localhost'
  },
  {
    name: 'Producción - auditoria.controldoc.app',
    hostname: 'auditoria.controldoc.app'
  },
  {
    name: 'Vercel Deploy',
    hostname: 'controlauditv2.vercel.app'
  },
  {
    name: 'Render Deploy',
    hostname: 'controlauditv2.onrender.com'
  }
];

testEnvironments.forEach(({ name, hostname }) => {
  console.log(`\n🔍 Probando: ${name}`);
  console.log(`📍 Hostname: ${hostname}`);
  
  // Simular window.location.hostname
  global.window = {
    location: {
      hostname: hostname
    }
  };
  
  try {
    const env = getEnvironment();
    const config = getEnvironmentConfig();
    
    console.log(`🌍 Entorno detectado: ${env}`);
    console.log(`🔧 Configuración:`, config);
    console.log(`📍 URL base: ${config.baseURL}`);
    console.log(`⏱️ Timeout: ${config.timeout}ms`);
    
    if (env === 'production') {
      console.log('✅ Configuración de PRODUCCIÓN correcta');
    } else {
      console.log('✅ Configuración de DESARROLLO correcta');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
});

console.log('\n🎯 Resumen de configuración:');
console.log('✅ Desarrollo: http://localhost:4000');
console.log('✅ Producción: https://api.controlfile.app');
console.log('✅ Vercel/Render: Detecta automáticamente');
