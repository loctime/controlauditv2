#!/usr/bin/env node

/**
 * Script para solucionar problemas de Cross-Origin-Opener-Policy
 * Este script detecta y corrige automáticamente los errores de COOP
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Solucionando problemas de Cross-Origin-Opener-Policy...');

// Función para verificar si existe un archivo
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para leer archivo
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Error leyendo ${filePath}:`, error.message);
    return null;
  }
}

// Función para escribir archivo
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Archivo actualizado: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error escribiendo ${filePath}:`, error.message);
    return false;
  }
}

// Función para agregar meta tags de seguridad
function addSecurityMetaTags(htmlContent) {
  const metaTags = `
    <!-- Configuración de políticas de seguridad para evitar errores de Cross-Origin -->
    <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin-allow-popups">
    <meta http-equiv="Cross-Origin-Embedder-Policy" content="unsafe-none">
    <meta http-equiv="Cross-Origin-Resource-Policy" content="cross-origin">
  `;
  
  // Buscar la posición después del viewport meta tag
  const viewportIndex = htmlContent.indexOf('<meta name="viewport"');
  if (viewportIndex !== -1) {
    const endOfViewport = htmlContent.indexOf('>', viewportIndex) + 1;
    return htmlContent.slice(0, endOfViewport) + metaTags + htmlContent.slice(endOfViewport);
  }
  
  // Si no encuentra viewport, agregar después del charset
  const charsetIndex = htmlContent.indexOf('<meta charset');
  if (charsetIndex !== -1) {
    const endOfCharset = htmlContent.indexOf('>', charsetIndex) + 1;
    return htmlContent.slice(0, endOfCharset) + metaTags + htmlContent.slice(endOfCharset);
  }
  
  // Si no encuentra ninguno, agregar después del head
  const headIndex = htmlContent.indexOf('<head>');
  if (headIndex !== -1) {
    const endOfHead = htmlContent.indexOf('>', headIndex) + 1;
    return htmlContent.slice(0, endOfHead) + metaTags + htmlContent.slice(endOfHead);
  }
  
  return htmlContent;
}

// Función para verificar si ya tiene los meta tags
function hasSecurityMetaTags(htmlContent) {
  return htmlContent.includes('Cross-Origin-Opener-Policy') &&
         htmlContent.includes('Cross-Origin-Embedder-Policy') &&
         htmlContent.includes('Cross-Origin-Resource-Policy');
}

// Función para actualizar archivos HTML
function updateHtmlFiles() {
  const htmlFiles = [
    'public/index.html',
    'index.html',
    'dist/index.html'
  ];
  
  let updatedCount = 0;
  
  htmlFiles.forEach(filePath => {
    if (fileExists(filePath)) {
      console.log(`📄 Procesando: ${filePath}`);
      
      const content = readFile(filePath);
      if (!content) return;
      
      if (!hasSecurityMetaTags(content)) {
        const updatedContent = addSecurityMetaTags(content);
        if (writeFile(filePath, updatedContent)) {
          updatedCount++;
        }
      } else {
        console.log(`✅ ${filePath} ya tiene los meta tags de seguridad`);
      }
    } else {
      console.log(`⚠️ Archivo no encontrado: ${filePath}`);
    }
  });
  
  return updatedCount;
}

// Función para verificar configuración de Vite
function checkViteConfig() {
  const viteConfigPath = 'vite.config.js';
  
  if (!fileExists(viteConfigPath)) {
    console.log('⚠️ No se encontró vite.config.js');
    return false;
  }
  
  const content = readFile(viteConfigPath);
  if (!content) return false;
  
  const hasCoopHeaders = content.includes('Cross-Origin-Opener-Policy') &&
                        content.includes('same-origin-allow-popups');
  
  if (hasCoopHeaders) {
    console.log('✅ vite.config.js ya tiene la configuración de COOP');
    return true;
  } else {
    console.log('⚠️ vite.config.js necesita configuración de COOP');
    return false;
  }
}

// Función para crear script de verificación
function createVerificationScript() {
  const scriptContent = `
// Script de verificación de Cross-Origin-Opener-Policy
console.log('🔍 Verificando configuración de COOP...');

// Verificar meta tags en el DOM
const metaTags = document.querySelectorAll('meta[http-equiv*="Cross-Origin"]');
console.log('📋 Meta tags de seguridad encontrados:', metaTags.length);

metaTags.forEach(tag => {
  console.log('-', tag.getAttribute('http-equiv'), ':', tag.getAttribute('content'));
});

// Verificar si hay errores de COOP en la consola
const originalError = console.error;
console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Cross-Origin-Opener-Policy')) {
    console.warn('🚨 Error de COOP detectado:', ...args);
  }
  originalError.apply(console, args);
};

// Verificar configuración del navegador
console.log('🌐 Información del navegador:');
console.log('- User Agent:', navigator.userAgent);
console.log('- Protocolo:', window.location.protocol);
console.log('- Hostname:', window.location.hostname);

// Verificar si estamos en un iframe
if (window !== window.top) {
  console.warn('⚠️ La aplicación está corriendo en un iframe');
}

console.log('✅ Verificación de COOP completada');
`;

  writeFile('public/verify-coop.js', scriptContent);
  console.log('✅ Script de verificación creado: public/verify-coop.js');
}

// Función principal
function main() {
  console.log('🚀 Iniciando solución de problemas de Cross-Origin...\n');
  
  // 1. Verificar configuración de Vite
  const viteOk = checkViteConfig();
  
  // 2. Actualizar archivos HTML
  const updatedFiles = updateHtmlFiles();
  
  // 3. Crear script de verificación
  createVerificationScript();
  
  // 4. Resumen
  console.log('\n📊 Resumen:');
  console.log(`- Vite config: ${viteOk ? '✅ OK' : '⚠️ Necesita revisión'}`);
  console.log(`- Archivos HTML actualizados: ${updatedFiles}`);
  console.log(`- Script de verificación: ✅ Creado`);
  
  console.log('\n🎯 Próximos pasos:');
  console.log('1. Reinicia el servidor de desarrollo: npm run dev');
  console.log('2. Abre la aplicación en el navegador');
  console.log('3. Abre la consola del navegador (F12)');
  console.log('4. Verifica que no aparezcan errores de Cross-Origin');
  console.log('5. Si persisten errores, ejecuta: node fix-cross-origin-issues.cjs');
  
  console.log('\n✅ Proceso completado');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  updateHtmlFiles,
  checkViteConfig,
  createVerificationScript,
  main
};
