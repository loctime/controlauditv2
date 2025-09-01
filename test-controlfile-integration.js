#!/usr/bin/env node

/**
 * Script de prueba para verificar la integración con ControlFile
 * Uso: node test-controlfile-integration.js
 */

const https = require('https');
const fs = require('fs');

const CONTROLFILE_BASE_URL = 'https://controlfile.onrender.com';

// Función para hacer requests HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testControlFileIntegration() {
  console.log('🧪 Probando integración con ControlFile...\n');
  
  // 1. Verificar conectividad básica
  console.log('1️⃣ Verificando conectividad básica...');
  try {
    const response = await makeRequest(`${CONTROLFILE_BASE_URL}/`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Respuesta: ${JSON.stringify(response.data).substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return;
  }
  
  // 2. Verificar endpoint de health
  console.log('\n2️⃣ Verificando endpoint de health...');
  try {
    const response = await makeRequest(`${CONTROLFILE_BASE_URL}/api/health`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Respuesta: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // 3. Verificar endpoint de upload (sin autenticación)
  console.log('\n3️⃣ Verificando endpoint de upload (sin auth)...');
  try {
    const response = await makeRequest(`${CONTROLFILE_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileSize: 12345
      })
    });
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Respuesta: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // 4. Verificar endpoint de presign (sin autenticación)
  console.log('\n4️⃣ Verificando endpoint de presign (sin auth)...');
  try {
    const response = await makeRequest(`${CONTROLFILE_BASE_URL}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg'
      })
    });
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Respuesta: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n✅ Pruebas completadas!');
  console.log('\n📋 Resumen:');
  console.log('- Si todos los endpoints responden (aunque sea con 401), la API está funcionando');
  console.log('- Los errores 401 son normales sin autenticación');
  console.log('- Los errores 404 indican que el endpoint no está implementado');
  console.log('- Los errores de conexión indican problemas de red o servidor');
}

// Ejecutar pruebas
testControlFileIntegration().catch(console.error);
