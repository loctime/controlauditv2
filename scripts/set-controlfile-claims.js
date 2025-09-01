#!/usr/bin/env node

/**
 * Script para configurar claims de acceso a ControlFile
 * Basado en la guía de integración oficial
 * 
 * Uso:
 * node scripts/set-controlfile-claims.js --email tu-correo@dominio --apps controlfile,controlaudit,controldoc --plans controlfile=pro;controlaudit=basic;controldoc=trial
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Configuración para el proyecto central de Auth
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg",
  authDomain: "controlstorage-eb796.firebaseapp.com",
  projectId: "controlstorage-eb796",
  storageBucket: "controlstorage-eb796.appspot.com",
  messagingSenderId: "156800340171",
  appId: "1:156800340171:web:fbe017105fd68b0f114b4e"
};

// Parsear argumentos de línea de comandos
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++; // Skip next argument
      } else {
        options[key] = true;
      }
    }
  }
  
  return options;
}

async function setClaims() {
  const options = parseArgs();
  
  if (!options.email) {
    console.error('❌ Error: Debes especificar --email');
    console.log('Uso: node scripts/set-controlfile-claims.js --email tu-correo@dominio --apps controlfile,controlaudit,controldoc --plans controlfile=pro;controlaudit=basic;controldoc=trial');
    process.exit(1);
  }
  
  const email = options.email;
  const apps = options.apps ? options.apps.split(',') : ['controlfile', 'controlaudit', 'controldoc'];
  const plans = options.plans ? 
    Object.fromEntries(options.plans.split(';').map(p => p.split('='))) : 
    { controlfile: 'pro', controlaudit: 'basic', controldoc: 'trial' };
  
  console.log('🔧 Configurando claims para ControlFile...');
  console.log('📧 Email:', email);
  console.log('📱 Apps:', apps);
  console.log('💳 Plans:', plans);
  
  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // Función Cloud para establecer claims
    const setUserClaims = httpsCallable(functions, 'setUserClaims');
    
    const result = await setUserClaims({
      email: email,
      claims: {
        allowedApps: apps,
        plans: plans
      }
    });
    
    console.log('✅ Claims configurados exitosamente:', result.data);
    
    // Verificar claims
    console.log('🔍 Verificando claims...');
    const verifyClaims = httpsCallable(functions, 'verifyUserClaims');
    const verification = await verifyClaims({ email });
    
    console.log('✅ Claims verificados:', verification.data);
    
  } catch (error) {
    console.error('❌ Error configurando claims:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setClaims();
}

export { setClaims };
