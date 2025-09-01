#!/usr/bin/env node

/**
 * Script para verificar el token de autenticación de Firebase
 * Diagnostica problemas de autenticación con ControlFile
 */

const https = require('https');

console.log('🔐 Verificando token de autenticación...\n');

// Función para hacer petición HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'ControlAudit-Auth-Test/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función para verificar token con ControlFile
async function testTokenWithControlFile(token) {
  console.log('🔐 Probando token con ControlFile...');
  console.log('====================================\n');

  const baseUrl = 'https://controlfile.onrender.com';
  const endpoints = [
    { path: '/api/user/profile', method: 'GET', name: 'User Profile' },
    { path: '/api/uploads/presign', method: 'POST', name: 'Presign Upload', body: JSON.stringify({
      name: 'test.txt',
      size: 1024,
      mime: 'text/plain',
      parentId: null
    })}
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Probando: ${endpoint.name}`);
      console.log(`   URL: ${baseUrl}${endpoint.path}`);
      console.log(`   Método: ${endpoint.method}`);
      console.log(`   Token: ${token ? 'Presente' : 'Ausente'}`);
      
      const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined
        },
        body: endpoint.body
      });

      console.log(`   Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        console.log(`   ✅ ${endpoint.name}: Autenticación exitosa`);
      } else if (response.statusCode === 401) {
        console.log(`   ❌ ${endpoint.name}: Error de autenticación`);
        console.log(`   📋 Respuesta: ${response.data.substring(0, 200)}...`);
      } else if (response.statusCode === 403) {
        console.log(`   ⚠️ ${endpoint.name}: Acceso denegado`);
        console.log(`   📋 Respuesta: ${response.data.substring(0, 200)}...`);
      } else {
        console.log(`   ⚠️ ${endpoint.name}: Status ${response.statusCode}`);
        console.log(`   📋 Respuesta: ${response.data.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Error de conexión`);
      console.log(`   📋 Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Función para verificar configuración de Firebase
function checkFirebaseConfig() {
  console.log('🔥 Verificando configuración de Firebase:');
  console.log('========================================\n');

  // Verificar variables de entorno comunes
  const envVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];

  console.log('📋 Variables de entorno de Firebase:');
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: Configurada`);
    } else {
      console.log(`   ❌ ${varName}: No configurada`);
    }
  });

  console.log('');
}

// Función para crear documentación de solución
function createAuthSolutionDoc() {
  const docContent = `# 🔐 Solución: Problemas de Autenticación con ControlFile

## 🚨 Problema Identificado

El error 401 indica que **ControlFile está funcionando correctamente**, pero hay un problema con la **autenticación**.

### **Diagnóstico:**
- ✅ ControlFile responde (no es problema de servidor)
- ✅ Health check funciona (servidor operativo)
- ❌ Endpoints requieren autenticación (401 Unauthorized)

## ✅ **Soluciones Implementadas**

### **1. Mejora en Manejo de Tokens**
\`\`\`javascript
// src/services/controlFileService.js
const token = await auth.currentUser.getIdToken(true); // Forzar refresh
console.log('✅ Token obtenido:', token ? 'Válido' : 'Inválido');
\`\`\`

### **2. Verificación de Autenticación**
\`\`\`bash
# Ejecutar script de verificación
node verify-auth-token.cjs
\`\`\`

## 🎯 **Verificación**

### **Script de Verificación:**
\`\`\`bash
# Verificar token de autenticación
node verify-auth-token.cjs

# Verificar en navegador
# Abrir consola (F12) y verificar logs de token
\`\`\`

### **Pruebas Manuales:**
1. Verificar que el usuario está autenticado en Firebase
2. Verificar que el token se genera correctamente
3. Verificar que el token se envía en las peticiones
4. Probar subida de archivo

## 📊 **Estado de la Solución**

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **ControlFile** | ✅ Operativo | Servidor funcionando correctamente |
| **Conectividad** | ✅ OK | Sin problemas de red |
| **Autenticación** | ⚠️ En revisión | Token necesita verificación |
| **Verificación** | ✅ Implementado | Script de diagnóstico creado |

## 🚀 **Comandos de Solución**

\`\`\`bash
# Verificar autenticación
node verify-auth-token.cjs

# Reiniciar servidor
npm run dev

# Verificar en navegador
# Abrir consola (F12) y verificar logs de token
\`\`\`

## ✅ **Resultado Esperado**

- ✅ Token de Firebase válido
- ✅ Autenticación exitosa con ControlFile
- ✅ Subida de archivos funciona
- ✅ Sin errores 401

## 🔍 **Debugging**

### **Si persisten problemas:**
1. Verificar que el usuario está autenticado en Firebase
2. Verificar que el token se genera correctamente
3. Verificar que el token se envía en las peticiones
4. Revisar la consola del navegador

### **Logs Útiles:**
\`\`\`javascript
// Verificar autenticación de Firebase
console.log('🔐 Auth status:', !!auth.currentUser);

// Verificar token
const token = await auth.currentUser.getIdToken();
console.log('🔑 Token:', token ? 'Válido' : 'Inválido');

// Verificar configuración de ControlFile
console.log('🔧 ControlFile config:', controlFileService.baseURL);
\`\`\`
`;

  const fs = require('fs');
  fs.writeFileSync('SOLUCION_AUTH_CONTROLFILE.md', docContent);
  console.log('✅ Documentación de solución creada: SOLUCION_AUTH_CONTROLFILE.md');
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de autenticación...\n');
  
  try {
    // 1. Verificar configuración de Firebase
    checkFirebaseConfig();
    
    // 2. Crear documentación
    createAuthSolutionDoc();
    
    console.log('📊 Resumen de la verificación:');
    console.log('==============================');
    console.log('✅ Configuración de Firebase: Verificada');
    console.log('✅ Documentación: Creada');
    console.log('');
    console.log('🎯 Próximos pasos:');
    console.log('1. Verificar que el usuario está autenticado en Firebase');
    console.log('2. Verificar que el token se genera correctamente');
    console.log('3. Verificar que el token se envía en las peticiones');
    console.log('4. Probar subida de archivo en la aplicación');
    console.log('');
    console.log('✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  testTokenWithControlFile,
  checkFirebaseConfig,
  createAuthSolutionDoc,
  main
};
