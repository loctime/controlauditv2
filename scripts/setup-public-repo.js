#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('🔧 Configuración de repositorio para APKs descargables', 'magenta');
  log('', 'reset');
  
  log('📋 Opciones disponibles:', 'cyan');
  log('', 'reset');
  log('1. 🔓 Hacer repositorio público (Recomendado)', 'green');
  log('   - Las APKs serán descargables directamente desde GitHub', 'reset');
  log('   - No requiere configuración adicional', 'reset');
  log('   - URL: https://github.com/loctime/controlauditv2/releases', 'yellow');
  log('', 'reset');
  
  log('2. 🔑 Configurar token de GitHub para repositorio privado', 'yellow');
  log('   - Mantiene el repositorio privado', 'reset');
  log('   - Requiere configurar variables de entorno', 'reset');
  log('   - Más complejo de mantener', 'reset');
  log('', 'reset');
  
  log('3. 🌐 Usar backend como proxy de descarga', 'blue');
  log('   - El backend descarga y sirve las APKs', 'reset');
  log('   - Funciona con repositorio privado', 'reset');
  log('   - Requiere configuración en el backend', 'reset');
  log('', 'reset');
  
  log('4. 📦 Generar APK localmente', 'cyan');
  log('   - Build manual sin GitHub Actions', 'reset');
  log('   - Útil para testing', 'reset');
  log('', 'reset');
  
  log('🎯 Recomendación:', 'magenta');
  log('   Para distribución pública: Opción 1 (Repositorio público)', 'green');
  log('   Para distribución privada: Opción 2 (Token GitHub)', 'yellow');
  log('', 'reset');
  
  log('📝 Pasos para hacer el repositorio público:', 'cyan');
  log('   1. Ve a https://github.com/loctime/controlauditv2/settings', 'yellow');
  log('   2. Baja hasta "Danger Zone"', 'yellow');
  log('   3. Haz clic en "Change repository visibility"', 'yellow');
  log('   4. Selecciona "Make public"', 'yellow');
  log('   5. Confirma la acción', 'yellow');
  log('', 'reset');
  
  log('🔗 Enlaces útiles:', 'cyan');
  log('   📱 Releases: https://github.com/loctime/controlauditv2/releases', 'yellow');
  log('   🏗️  Actions: https://github.com/loctime/controlauditv2/actions', 'yellow');
  log('   ⚙️  Settings: https://github.com/loctime/controlauditv2/settings', 'yellow');
  log('', 'reset');
  
  log('💡 Comando para generar nueva versión:', 'cyan');
  log('   npm run die "Descripción de los cambios"', 'green');
  log('', 'reset');
}

main();
