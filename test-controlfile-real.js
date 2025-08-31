#!/usr/bin/env node

/**
 * Script para probar la integración real con ControlFile
 * Uso: node test-controlfile-real.js
 */

import https from 'https';
import fetch from 'node-fetch';

const CONTROLFILE_URL = 'https://files.controldoc.app';

// Simular token de Firebase (en producción usarías un token real)
const MOCK_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGVzdCIsImF1ZCI6InRlc3QiLCJhdXRoX3RpbWUiOjE2MzQ1Njc4OTAsInVzZXJfaWQiOiJ0ZXN0X3VzZXJfaWQiLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNDU3MTQ5MCwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidGVzdEBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.test_signature';

async function testControlFileEndpoint(endpoint, method = 'GET', body = null) {
  const url = `${CONTROLFILE_URL}${endpoint}`;
  
  console.log(`🔍 Probando ${method} ${endpoint}...`);
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${MOCK_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ControlAudit-Test/1.0'
      },
      timeout: 10000
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    console.log(`📥 Respuesta: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      try {
        const data = await response.json();
        console.log(`✅ Datos:`, JSON.stringify(data, null, 2));
        return { success: true, status: response.status, data };
      } catch (e) {
        const text = await response.text();
        console.log(`✅ Respuesta: ${text}`);
        return { success: true, status: response.status, data: text };
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.log(`💥 Error de conexión: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAllControlFileEndpoints() {
  console.log('🚀 Iniciando pruebas de ControlFile real...\n');
  console.log(`🌐 URL base: ${CONTROLFILE_URL}\n`);

  const tests = [
    // Endpoints básicos
    { endpoint: '/', method: 'GET', description: 'Endpoint raíz' },
    { endpoint: '/health', method: 'GET', description: 'Health check básico' },
    { endpoint: '/api/health', method: 'GET', description: 'Health check API' },
    
    // Endpoints de usuario
    { endpoint: '/api/user/profile', method: 'GET', description: 'Perfil de usuario' },
    
    // Endpoints de upload
    { 
      endpoint: '/api/uploads/presign', 
      method: 'POST', 
      description: 'Crear sesión de subida',
      body: {
        fileName: 'test-logo.png',
        fileSize: 1024000,
        mimeType: 'image/png',
        metadata: {
          app: 'controlaudit',
          tipo: 'logo_sistema',
          test: true
        }
      }
    },
    
    // Endpoints de completar subida (necesita uploadId)
    { 
      endpoint: '/api/uploads/complete/test-upload-id', 
      method: 'POST', 
      description: 'Completar subida',
      body: {}
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${test.description}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = await testControlFileEndpoint(test.endpoint, test.method, test.body);
    results.push({
      ...test,
      ...result
    });
    
    // Pausa entre requests para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumen final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMEN DE PRUEBAS CONTROLFILE REAL');
  console.log(`${'='.repeat(60)}`);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const available = results.filter(r => r.success && r.status === 200);
  const notFound = results.filter(r => r.success && r.status === 404);
  const methodNotAllowed = results.filter(r => r.success && r.status === 405);

  console.log(`✅ Exitosos: ${successful.length}/${results.length}`);
  console.log(`❌ Fallidos: ${failed.length}/${results.length}`);
  console.log(`🟢 Disponibles (200): ${available.length}`);
  console.log(`🔴 No encontrados (404): ${notFound.length}`);
  console.log(`🟡 Método no permitido (405): ${methodNotAllowed.length}`);

  console.log('\n📋 Detalles por endpoint:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status || 'N/A';
    console.log(`${status} ${result.endpoint} (${statusCode}) - ${result.description}`);
  });

  console.log('\n💡 Recomendaciones:');
  
  if (available.length > 0) {
    console.log('✅ ControlFile está funcionando. Algunos endpoints están disponibles.');
  }
  
  if (notFound.length > 0) {
    console.log('⚠️  Algunos endpoints no están implementados en ControlFile.');
  }
  
  if (methodNotAllowed.length > 0) {
    console.log('⚠️  Algunos endpoints existen pero no permiten el método solicitado.');
  }
  
  if (failed.length > 0) {
    console.log('❌ Hay problemas de conectividad con ControlFile.');
  }

  console.log('\n🔧 Próximos pasos:');
  console.log('1. Verificar que los endpoints necesarios estén implementados en ControlFile');
  console.log('2. Confirmar que los métodos HTTP sean correctos');
  console.log('3. Validar la autenticación con tokens reales de Firebase');
  console.log('4. Probar con archivos reales una vez que los endpoints estén listos');

  return results;
}

// Ejecutar las pruebas
testAllControlFileEndpoints()
  .then(results => {
    console.log('\n🎉 Pruebas completadas');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error en las pruebas:', error);
    process.exit(1);
  });
