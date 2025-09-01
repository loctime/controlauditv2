#!/usr/bin/env node

/**
 * Script para configurar Google OAuth URIs de redirección
 * Ejecutar: node scripts/setup-google-oauth.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.bright}[${timestamp}]${colors.reset} ${colors[type]}${message}${colors.reset}`);
}

function showGoogleOAuthSetup() {
  log('\n🔧 CONFIGURACIÓN DE GOOGLE OAUTH PARA CONTROL AUDIT', 'cyan');
  log('==================================================', 'cyan');
  
  log('\n📋 PASOS PARA CONFIGURAR GOOGLE OAUTH:', 'yellow');
  
  log('\n1️⃣ ACCEDER A GOOGLE CLOUD CONSOLE:', 'blue');
  log('   • Ve a: https://console.cloud.google.com/', 'green');
  log('   • Selecciona tu proyecto: controlstorage-eb796', 'green');
  log('   • Ve a: APIs & Services > Credentials', 'green');
  
  log('\n2️⃣ CONFIGURAR URIS DE REDIRECCIÓN:', 'blue');
  log('   En la sección "OAuth 2.0 Client IDs", agrega estas URIs:', 'green');
  
  const redirectUris = [
    'https://controlstorage-eb796.firebaseapp.com/_/auth/handler',
    'https://controlstorage-eb796.firebaseapp.com/__/auth/handler',
    'http://localhost:5173/__/auth/handler',
    'http://localhost:3000/__/auth/handler',
    'https://auditoria.controldoc.app/__/auth/handler',
    'https://controlaudit.app/__/auth/handler',
    'com.controlaudit.app://'
  ];
  
  redirectUris.forEach((uri, index) => {
    log(`   ${index + 1}. ${uri}`, 'green');
  });
  
  log('\n3️⃣ CONFIGURACIÓN ESPECÍFICA PARA APK:', 'blue');
  log('   • Agrega el esquema personalizado: com.controlaudit.app://', 'green');
  log('   • Este esquema ya está configurado en capacitor.config.ts', 'green');
  
  log('\n4️⃣ DOMINIOS AUTORIZADOS:', 'blue');
  log('   En la sección "Authorized domains", agrega:', 'green');
  const authorizedDomains = [
    'controlstorage-eb796.firebaseapp.com',
    'localhost',
    'auditoria.controldoc.app',
    'controlaudit.app'
  ];
  
  authorizedDomains.forEach((domain, index) => {
    log(`   ${index + 1}. ${domain}`, 'green');
  });
  
  log('\n5️⃣ VERIFICAR CONFIGURACIÓN:', 'blue');
  log('   • Después de guardar, espera 5-10 minutos para que los cambios se propaguen', 'green');
  log('   • Prueba el inicio de sesión en la APK', 'green');
  
  log('\n⚠️  NOTAS IMPORTANTES:', 'yellow');
  log('   • Los cambios pueden tardar hasta 10 minutos en propagarse', 'yellow');
  log('   • Asegúrate de que todas las URIs estén exactamente como se muestran', 'yellow');
  log('   • El esquema personalizado es necesario para la APK', 'yellow');
  
  log('\n🔗 ENLACES ÚTILES:', 'cyan');
  log('   • Google Cloud Console: https://console.cloud.google.com/', 'blue');
  log('   • Firebase Console: https://console.firebase.google.com/', 'blue');
  log('   • Documentación OAuth: https://developers.google.com/identity/protocols/oauth2', 'blue');
  
  log('\n✅ CONFIGURACIÓN COMPLETADA', 'green');
  log('   Una vez que hayas configurado las URIs, prueba el inicio de sesión en la APK', 'green');
}

function checkCurrentConfig() {
  log('\n🔍 VERIFICANDO CONFIGURACIÓN ACTUAL:', 'cyan');
  
  try {
    // Verificar capacitor.config.ts
    const capacitorConfigPath = path.join(process.cwd(), 'capacitor.config.ts');
    if (fs.existsSync(capacitorConfigPath)) {
      const config = fs.readFileSync(capacitorConfigPath, 'utf8');
      if (config.includes('scheme: \'com.controlaudit.app\'')) {
        log('✅ Esquema personalizado configurado en Capacitor', 'green');
      } else {
        log('❌ Esquema personalizado NO configurado en Capacitor', 'red');
      }
    }
    
    // Verificar firebaseConfig.js
    const firebaseConfigPath = path.join(process.cwd(), 'src', 'firebaseConfig.js');
    if (fs.existsSync(firebaseConfigPath)) {
      const config = fs.readFileSync(firebaseConfigPath, 'utf8');
      if (config.includes('signInWithGoogle')) {
        log('✅ Función de Google Auth configurada', 'green');
      } else {
        log('❌ Función de Google Auth NO configurada', 'red');
      }
    }
    
  } catch (error) {
    log(`❌ Error al verificar configuración: ${error.message}`, 'red');
  }
}

// Ejecutar el script
showGoogleOAuthSetup();
checkCurrentConfig();
