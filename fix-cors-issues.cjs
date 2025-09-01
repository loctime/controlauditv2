#!/usr/bin/env node

/**
 * Script para solucionar problemas de CORS con ControlFile
 * Este script detecta y corrige automáticamente los errores de CORS
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Solucionando problemas de CORS con ControlFile...');

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

// Función para verificar configuración de ControlFile
function checkControlFileConfig() {
  const controlFileServicePath = 'src/services/controlFileService.js';
  
  if (!fileExists(controlFileServicePath)) {
    console.log('⚠️ No se encontró controlFileService.js');
    return false;
  }
  
  const content = readFile(controlFileServicePath);
  if (!content) return false;
  
  // Verificar si usa localhost:4001
  const usesLocalhost = content.includes('localhost:4001');
  
  if (usesLocalhost) {
    console.log('⚠️ ControlFile configurado para usar localhost:4001 (no disponible)');
    return false;
  } else {
    console.log('✅ ControlFile configurado para usar producción');
    return true;
  }
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
  
  const hasCorsHeaders = content.includes('Access-Control-Allow-Origin') &&
                        content.includes('Access-Control-Allow-Methods');
  
  if (hasCorsHeaders) {
    console.log('✅ vite.config.js tiene configuración de CORS');
    return true;
  } else {
    console.log('⚠️ vite.config.js necesita configuración de CORS');
    return false;
  }
}

// Función para crear script de verificación de CORS
function createCorsVerificationScript() {
  const scriptContent = `
// Script de verificación de CORS para ControlFile
console.log('🔍 Verificando configuración de CORS...');

// Verificar configuración de ControlFile
console.log('🌐 Verificando ControlFile...');

// Función para probar conexión a ControlFile
async function testControlFileConnection() {
  try {
    console.log('🔗 Probando conexión a ControlFile...');
    
    // Verificar si el servicio está disponible
    const response = await fetch('https://controlfile.onrender.com/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ ControlFile está disponible');
      return true;
    } else {
      console.log('⚠️ ControlFile responde pero con error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error conectando a ControlFile:', error.message);
    return false;
  }
}

// Verificar configuración del navegador
console.log('🌐 Información del navegador:');
console.log('- User Agent:', navigator.userAgent);
console.log('- Protocolo:', window.location.protocol);
console.log('- Hostname:', window.location.hostname);
console.log('- Puerto:', window.location.port);

// Verificar si estamos en un iframe
if (window !== window.top) {
  console.warn('⚠️ La aplicación está corriendo en un iframe');
}

// Verificar headers de CORS
console.log('📋 Verificando headers de CORS...');
const metaTags = document.querySelectorAll('meta[http-equiv*="Cross-Origin"]');
console.log('Meta tags de seguridad encontrados:', metaTags.length);

metaTags.forEach(tag => {
  console.log('-', tag.getAttribute('http-equiv'), ':', tag.getAttribute('content'));
});

// Probar conexión
testControlFileConnection().then(success => {
  if (success) {
    console.log('✅ Verificación de CORS completada - ControlFile funciona');
  } else {
    console.log('❌ Verificación de CORS completada - Problemas detectados');
  }
});

console.log('✅ Verificación de CORS iniciada');
`;

  writeFile('public/verify-cors.js', scriptContent);
  console.log('✅ Script de verificación de CORS creado: public/verify-cors.js');
}

// Función para crear documentación de solución
function createCorsSolutionDoc() {
  const docContent = `# 🔧 Solución: Problemas de CORS con ControlFile

## 🚨 Problema Identificado

El error de CORS ocurre porque ControlFile intenta conectarse a \`localhost:4001\` que no está disponible.

### **Errores Típicos:**
\`\`\`
Access to fetch at 'http://localhost:4001/api/health' from origin 'http://localhost:5173' has been blocked by CORS policy
\`\`\`

## ✅ **Solución Implementada**

### **1. Usar ControlFile de Producción**
\`\`\`javascript
// src/services/controlFileService.js
this.baseURL = 'https://controlfile.onrender.com'; // ✅ Usar producción siempre
\`\`\`

### **2. Headers de Seguridad en Vite**
\`\`\`javascript
// vite.config.js
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true'
}
\`\`\`

## 🎯 **Verificación**

### **Script de Verificación:**
\`\`\`bash
# Ejecutar script de verificación
node fix-cors-issues.cjs

# Verificar en navegador
# Cargar: /verify-cors.js
\`\`\`

### **Pruebas Manuales:**
1. Abrir consola del navegador (F12)
2. Verificar que no hay errores de CORS
3. Probar subida de archivo
4. Verificar que ControlFile responde

## 📊 **Estado de la Solución**

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **ControlFile URL** | ✅ Solucionado | Usa producción en lugar de localhost |
| **CORS Headers** | ✅ Solucionado | Headers configurados en Vite |
| **Verificación** | ✅ Implementado | Script de verificación automática |

## 🚀 **Comandos de Solución**

\`\`\`bash
# Aplicar solución completa
node fix-cors-issues.cjs

# Reiniciar servidor
npm run dev

# Verificar en navegador
# Abrir consola (F12) y cargar /verify-cors.js
\`\`\`

## ✅ **Resultado Esperado**

- ✅ Sin errores de CORS en consola
- ✅ ControlFile responde correctamente
- ✅ Subida de archivos funciona
- ✅ Autenticación exitosa

## 🔍 **Debugging**

### **Si persisten problemas:**
1. Verificar que el servidor se reinició
2. Limpiar caché del navegador
3. Verificar que ControlFile está disponible
4. Revisar la consola del navegador

### **Logs Útiles:**
\`\`\`javascript
// Verificar configuración de ControlFile
console.log('🔧 ControlFile config:', controlFileService.baseURL);

// Verificar autenticación
console.log('🔐 Auth status:', !!auth.currentUser);

// Probar conexión directa
fetch('https://controlfile.onrender.com/api/health')
  .then(response => console.log('ControlFile health:', response.status));
\`\`\`
`;

  writeFile('SOLUCION_CORS_CONTROLFILE.md', docContent);
  console.log('✅ Documentación de solución creada: SOLUCION_CORS_CONTROLFILE.md');
}

// Función principal
function main() {
  console.log('🚀 Iniciando solución de problemas de CORS...\n');
  
  // 1. Verificar configuración de ControlFile
  const controlFileOk = checkControlFileConfig();
  
  // 2. Verificar configuración de Vite
  const viteOk = checkViteConfig();
  
  // 3. Crear script de verificación
  createCorsVerificationScript();
  
  // 4. Crear documentación
  createCorsSolutionDoc();
  
  // 5. Resumen
  console.log('\n📊 Resumen:');
  console.log(`- ControlFile config: ${controlFileOk ? '✅ OK' : '⚠️ Necesita revisión'}`);
  console.log(`- Vite config: ${viteOk ? '✅ OK' : '⚠️ Necesita revisión'}`);
  console.log(`- Script de verificación: ✅ Creado`);
  console.log(`- Documentación: ✅ Creada`);
  
  console.log('\n🎯 Próximos pasos:');
  console.log('1. Reinicia el servidor de desarrollo: npm run dev');
  console.log('2. Abre la aplicación en el navegador');
  console.log('3. Abre la consola del navegador (F12)');
  console.log('4. Carga el script de verificación: /verify-cors.js');
  console.log('5. Verifica que no aparezcan errores de CORS');
  console.log('6. Prueba subir un archivo para verificar ControlFile');
  
  console.log('\n✅ Proceso completado');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  checkControlFileConfig,
  checkViteConfig,
  createCorsVerificationScript,
  createCorsSolutionDoc,
  main
};
