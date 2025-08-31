#!/usr/bin/env node

/**
 * Script para probar el estado de ControlFile en producción
 * Uso: node test-production-controlfile.js
 */

import https from 'https';

const CONTROLFILE_URL = 'https://files.controldoc.app';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = `${CONTROLFILE_URL}${endpoint}`;
    
    console.log(`🔍 Probando ${method} ${endpoint}...`);
    
    const options = {
      method,
      headers: {
        'User-Agent': 'ControlAudit-Production-Test/1.0',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 Respuesta: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`✅ Datos:`, JSON.stringify(jsonData, null, 2));
          } catch (e) {
            console.log(`✅ Respuesta: ${data}`);
          }
        } else {
          console.log(`❌ Error: ${data}`);
        }
        
        resolve({
          endpoint,
          method,
          status: res.statusCode,
          success: res.statusCode < 400,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      console.log(`💥 Error de conexión: ${error.message}`);
      resolve({
        endpoint,
        method,
        error: error.message,
        success: false
      });
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ Timeout`);
      req.destroy();
      resolve({
        endpoint,
        method,
        error: 'Timeout',
        success: false
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testProductionControlFile() {
  console.log('🚀 Probando ControlFile en producción...\n');
  console.log(`🌐 URL: ${CONTROLFILE_URL}\n`);

  const tests = [
    // Endpoints básicos
    { endpoint: '/', method: 'GET', description: 'Endpoint raíz' },
    { endpoint: '/api/health', method: 'GET', description: 'Health check API' },
    
    // Endpoints de usuario (sin auth para ver si existen)
    { endpoint: '/api/user/profile', method: 'GET', description: 'Perfil de usuario (sin auth)' },
    
    // Endpoints de upload (sin auth para ver si existen)
    { 
      endpoint: '/api/uploads/presign', 
      method: 'POST', 
      description: 'Crear sesión de subida (sin auth)',
      body: {
        fileName: 'test-logo.png',
        fileSize: 1024000,
        mimeType: 'image/png'
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${test.description}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = await testEndpoint(test.endpoint, test.method, test.body);
    results.push({
      ...test,
      ...result
    });
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Resumen final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMEN DE PRUEBAS CONTROLFILE PRODUCCIÓN');
  console.log(`${'='.repeat(60)}`);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const available = results.filter(r => r.success && r.status === 200);
  const notFound = results.filter(r => r.success && r.status === 404);
  const unauthorized = results.filter(r => r.success && r.status === 401);
  const serverError = results.filter(r => r.success && r.status >= 500);

  console.log(`✅ Exitosos: ${successful.length}/${results.length}`);
  console.log(`❌ Fallidos: ${failed.length}/${results.length}`);
  console.log(`🟢 Disponibles (200): ${available.length}`);
  console.log(`🔴 No encontrados (404): ${notFound.length}`);
  console.log(`🟡 No autorizado (401): ${unauthorized.length}`);
  console.log(`🔴 Error del servidor (5xx): ${serverError.length}`);

  console.log('\n📋 Detalles por endpoint:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status || 'N/A';
    console.log(`${status} ${result.method} ${result.endpoint} (${statusCode}) - ${result.description}`);
  });

  console.log('\n💡 Análisis:');
  
  if (available.length > 0) {
    console.log('✅ ControlFile está funcionando. Algunos endpoints están disponibles.');
  }
  
  if (notFound.length > 0) {
    console.log('⚠️  Algunos endpoints no están implementados en ControlFile.');
  }
  
  if (unauthorized.length > 0) {
    console.log('🔐 Algunos endpoints existen pero requieren autenticación.');
  }
  
  if (serverError.length > 0) {
    console.log('💥 Hay errores del servidor en ControlFile.');
  }
  
  if (failed.length > 0) {
    console.log('❌ Hay problemas de conectividad con ControlFile.');
  }

  console.log('\n🔧 Recomendaciones:');
  
  if (notFound.length > 0) {
    console.log('1. Los endpoints 404 necesitan ser implementados en ControlFile');
  }
  
  if (serverError.length > 0) {
    console.log('2. Los errores 500 indican problemas en el servidor de ControlFile');
  }
  
  if (unauthorized.length > 0) {
    console.log('3. Los endpoints 401 están implementados pero necesitan autenticación');
  }

  console.log('\n🎯 Estado para tu aplicación:');
  
  const hasBasicEndpoints = available.length > 0;
  const hasUserEndpoints = !notFound.some(r => r.endpoint.includes('/user/'));
  const hasUploadEndpoints = !notFound.some(r => r.endpoint.includes('/uploads/'));
  
  if (hasBasicEndpoints && hasUserEndpoints && hasUploadEndpoints) {
    console.log('✅ ControlFile está listo para usar en producción');
  } else if (hasBasicEndpoints) {
    console.log('⚠️  ControlFile está funcionando pero faltan algunos endpoints');
  } else {
    console.log('❌ ControlFile no está listo para producción');
  }

  return results;
}

// Ejecutar las pruebas
testProductionControlFile()
  .then(results => {
    console.log('\n🎉 Pruebas completadas');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error en las pruebas:', error);
    process.exit(1);
  });
