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

function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    log(`❌ Error ejecutando: ${command}`, 'red');
    process.exit(1);
  }
}

function executeCommandWithOutput(command, options = {}) {
  try {
    execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    log(`❌ Error ejecutando: ${command}`, 'red');
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('🚀 DIE - Script de Release Automático para ControlAudit', 'magenta');
    log('', 'reset');
    log('Este script hace TODO automáticamente:', 'cyan');
    log('  ✅ Build de la aplicación web', 'green');
    log('  ✅ Sync con Capacitor', 'green');
    log('  ✅ Commit de cambios', 'green');
    log('  ✅ Actualización de versión (patch)', 'green');
    log('  ✅ Creación de tag', 'green');
    log('  ✅ Push a GitHub', 'green');
    log('  ✅ Generación automática de APK', 'green');
    log('  ✅ Release en GitHub', 'green');
    log('', 'reset');
    log('Uso:', 'yellow');
    log('  npm run die "mensaje del commit"', 'reset');
    log('', 'reset');
    log('Ejemplos:', 'yellow');
    log('  npm run die "Fix login bug"', 'reset');
    log('  npm run die "Add new dashboard"', 'reset');
    log('  npm run die "Complete redesign"', 'reset');
    log('', 'reset');
    log('🎯 Comandos alternativos:', 'cyan');
    log('  npm run dev        - Desarrollo web + backend + Android (local)', 'reset');
    log('  npm run dev:web    - Solo desarrollo web', 'reset');
    log('  npm run fer        - Solo build + sync Android', 'reset');
    log('  npm run build:full - Build + sync completo', 'reset');
    return;
  }

  const commitMessage = args.join(' ') || 'Release automático';
  const releaseType = 'patch'; // Siempre patch para simplificar

  log('🚀 DIE - Iniciando proceso de release automático...', 'magenta');
  log('', 'reset');

  // 1. Verificar que no hay cambios pendientes
  log('📋 Paso 1: Verificando estado del repositorio...', 'yellow');
  const status = executeCommand('git status --porcelain');
  if (status && status.trim()) {
    log('⚠️  Hay cambios pendientes. Haciendo commit...', 'yellow');
    executeCommandWithOutput('git add .');
    executeCommandWithOutput(`git commit -m "${commitMessage}"`);
  } else {
    log('✅ No hay cambios pendientes', 'green');
  }

  // 2. Obtener versión actual
  const currentVersion = getCurrentVersion();
  log(`📦 Paso 2: Versión actual: ${currentVersion}`, 'blue');

  // 3. Calcular nueva versión
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  let newVersion;
  
  switch (releaseType) {
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
  }

  log(`🆕 Nueva versión: ${newVersion}`, 'green');

  // 4. Actualizar package.json
  log('📝 Paso 3: Actualizando package.json...', 'yellow');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');

  // 5. Build de la aplicación web
  log('🏗️  Paso 4: Construyendo aplicación web...', 'yellow');
  executeCommandWithOutput('npm run build');

  // 6. Sync con Capacitor
  log('📱 Paso 5: Sincronizando con Capacitor...', 'yellow');
  executeCommandWithOutput('npx cap sync android');

  // 7. Commit de la nueva versión y build
  log('💾 Paso 6: Haciendo commit del build...', 'yellow');
  executeCommandWithOutput('git add .');
  executeCommandWithOutput(`git commit -m "Build v${newVersion} - ${commitMessage}"`);

  // 8. Crear tag
  log(`🏷️  Paso 7: Creando tag v${newVersion}...`, 'yellow');
  executeCommandWithOutput(`git tag v${newVersion}`);

  // 9. Push de commits y tags
  log('📤 Paso 8: Subiendo cambios a GitHub...', 'yellow');
  executeCommandWithOutput('git push origin main');
  executeCommandWithOutput(`git push origin v${newVersion}`);

  log('', 'reset');
  log('🎉 ¡DIE completado exitosamente!', 'magenta');
  log('', 'reset');
  log('📱 Lo que se ejecutó automáticamente:', 'cyan');
  log(`  ✅ Commit creado: "${commitMessage}"`, 'green');
  log(`  ✅ Versión actualizada: ${currentVersion} → ${newVersion}`, 'green');
  log(`  ✅ Build de aplicación web completado`, 'green');
  log(`  ✅ Sync con Capacitor completado`, 'green');
  log(`  ✅ Tag creado: v${newVersion}`, 'green');
  log(`  ✅ Cambios subidos a GitHub`, 'green');
  log(`  ✅ GitHub Actions iniciará el build automáticamente`, 'green');
  log(`  ✅ APK se generará automáticamente`, 'green');
  log(`  ✅ Release se creará en GitHub`, 'green');
  log('', 'reset');
  log('🔗 Enlaces útiles:', 'cyan');
  log(`  📊 Progreso del build: https://github.com/[tu-usuario]/controlauditv2/actions`, 'yellow');
  log(`  📱 APK disponible en: https://github.com/[tu-usuario]/controlauditv2/releases/tag/v${newVersion}`, 'yellow');
  log('', 'reset');
  log('⚡ Próximos pasos:', 'cyan');
  log('  • Espera 5-10 minutos para que se genere la APK', 'reset');
  log('  • Descarga la APK desde GitHub Releases', 'reset');
  log('  • ¡Listo para distribuir!', 'reset');
}

main();
