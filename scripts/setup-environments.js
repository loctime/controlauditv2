#!/usr/bin/env node

/**
 * Script para configurar automáticamente los diferentes entornos
 * Uso: node scripts/setup-environments.js [environment]
 * 
 * Entornos disponibles:
 * - development: localhost
 * - staging: controlaudit.vercel.app, demo.controlaudit.app
 * - production: controlaudit.app, cliente.controlaudit.app, demo.controlaudit.app
 */

const fs = require('fs');
const path = require('path');

const environments = {
  development: {
    name: 'Desarrollo Local',
    description: 'Entorno de desarrollo en localhost',
    frontend: {
      backendUrl: 'http://localhost:4000',
      debugMode: true,
      enableLogs: true,
      enableAnalytics: false
    },
    backend: {
      port: 4000,
      corsOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ]
    }
  },
  staging: {
    name: 'Staging',
    description: 'Entorno de pruebas en Vercel',
    frontend: {
      backendUrl: 'https://api.controlaudit.app',
      debugMode: true,
      enableLogs: true,
      enableAnalytics: false
    },
    backend: {
      port: process.env.PORT || 4000,
      corsOrigins: [
        'https://controlaudit.vercel.app',
        'https://demo.controlaudit.app'
      ]
    }
  },
  production: {
    name: 'Producción',
    description: 'Entorno de producción con dominios personalizados',
    frontend: {
      backendUrl: 'https://api.controlaudit.app',
      debugMode: false,
      enableLogs: true,
      enableAnalytics: true
    },
    backend: {
      port: process.env.PORT || 4000,
      corsOrigins: [
        'https://controlaudit.app',
        'https://www.controlaudit.app',
        'https://cliente.controlaudit.app',
        'https://demo.controlaudit.app'
      ]
    }
  }
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function createEnvFile(environment, config) {
  const envContent = `# Configuración para ${config.name}
NODE_ENV=${environment}

# Firebase Configuration (configurar según tu proyecto)
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend Configuration
VITE_BACKEND_URL=${config.frontend.backendUrl}

# Admin Codes
VITE_ADMIN_CODE=AUDITORIA2024
VITE_SUPER_ADMIN_CODE=SUPERMAX2024

# Features
VITE_DEBUG_MODE=${config.frontend.debugMode}
VITE_ENABLE_LOGS=${config.frontend.enableLogs}
VITE_ENABLE_ANALYTICS=${config.frontend.enableAnalytics}
`;

  const envPath = path.join(process.cwd(), `.env.${environment}`);
  fs.writeFileSync(envPath, envContent);
  log(`✅ Archivo .env.${environment} creado`, 'success');
}

function createBackendEnvFile(environment, config) {
  const envContent = `# Configuración del Backend para ${config.name}
NODE_ENV=${environment}
PORT=${config.backend.port}
HOST=0.0.0.0

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu_proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu_private_key_aqui\n-----END PRIVATE KEY-----\n"

# Para desarrollo local, usar archivo de credenciales
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# JWT Secret (cambiar en producción)
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# CORS Origins configurados automáticamente para ${environment}
`;

  const envPath = path.join(process.cwd(), 'backend', `.env.${environment}`);
  fs.writeFileSync(envPath, envContent);
  log(`✅ Archivo backend/.env.${environment} creado`, 'success');
}

function showEnvironmentInfo(environment, config) {
  log(`\n📋 Configuración para ${config.name}:`, 'info');
  log(`   Descripción: ${config.description}`, 'info');
  log(`   Backend URL: ${config.frontend.backendUrl}`, 'info');
  log(`   Debug Mode: ${config.frontend.debugMode}`, 'info');
  log(`   Analytics: ${config.frontend.enableAnalytics}`, 'info');
  log(`   CORS Origins: ${config.backend.corsOrigins.join(', ')}`, 'info');
}

function main() {
  const targetEnv = process.argv[2];
  
  if (!targetEnv) {
    log('❌ Debes especificar un entorno', 'error');
    log('Uso: node scripts/setup-environments.js [development|staging|production]', 'info');
    log('\nEntornos disponibles:', 'info');
    Object.keys(environments).forEach(env => {
      log(`   - ${env}: ${environments[env].name}`, 'info');
    });
    process.exit(1);
  }
  
  if (!environments[targetEnv]) {
    log(`❌ Entorno "${targetEnv}" no válido`, 'error');
    log('Entornos disponibles: ' + Object.keys(environments).join(', '), 'info');
    process.exit(1);
  }
  
  const config = environments[targetEnv];
  
  log(`🚀 Configurando entorno: ${targetEnv}`, 'success');
  showEnvironmentInfo(targetEnv, config);
  
  try {
    // Crear archivos de configuración
    createEnvFile(targetEnv, config);
    createBackendEnvFile(targetEnv, config);
    
    log(`\n✅ Configuración completada para ${targetEnv}`, 'success');
    log('\n📝 Próximos pasos:', 'info');
    log('   1. Configura las variables de Firebase en los archivos .env', 'info');
    log('   2. Configura las credenciales del backend', 'info');
    log('   3. Ejecuta el frontend: npm run dev', 'info');
    log('   4. Ejecuta el backend: cd backend && npm start', 'info');
    
  } catch (error) {
    log(`❌ Error al crear configuración: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { environments }; 