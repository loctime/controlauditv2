#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de autenticación con ControlFile
 * Uso: node test-controlfile-auth-debug.js
 */

const CONTROLFILE_URL = 'https://controlauditv2.onrender.com';

async function testControlFileAuth() {
  console.log('🔍 Diagnóstico de autenticación ControlFile');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar que el servicio esté disponible
    console.log('\n1️⃣ Verificando disponibilidad del servicio...');
    const healthResponse = await fetch(`${CONTROLFILE_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   OK: ${healthResponse.ok}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Servicio disponible:', healthData);
    } else {
      console.log('   ❌ Servicio no disponible');
      return;
    }
    
    // 2. Probar endpoint sin autenticación
    console.log('\n2️⃣ Probando endpoint sin autenticación...');
    const noAuthResponse = await fetch(`${CONTROLFILE_URL}/api/user/profile`);
    console.log(`   Status: ${noAuthResponse.status}`);
    console.log(`   OK: ${noAuthResponse.ok}`);
    
    if (!noAuthResponse.ok) {
      const errorData = await noAuthResponse.json().catch(() => ({}));
      console.log('   📋 Error response:', errorData);
    }
    
    // 3. Probar endpoint con token inválido
    console.log('\n3️⃣ Probando endpoint con token inválido...');
    const invalidTokenResponse = await fetch(`${CONTROLFILE_URL}/api/user/profile`, {
      headers: {
        'Authorization': 'Bearer invalid_token_123',
        'Content-Type': 'application/json'
      }
    });
    console.log(`   Status: ${invalidTokenResponse.status}`);
    console.log(`   OK: ${invalidTokenResponse.ok}`);
    
    if (!invalidTokenResponse.ok) {
      const errorData = await invalidTokenResponse.json().catch(() => ({}));
      console.log('   📋 Error response:', errorData);
    }
    
    // 4. Probar endpoint de presign sin autenticación
    console.log('\n4️⃣ Probando endpoint presign sin autenticación...');
    const presignNoAuthResponse = await fetch(`${CONTROLFILE_URL}/api/uploads/presign`, {
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
    console.log(`   Status: ${presignNoAuthResponse.status}`);
    console.log(`   OK: ${presignNoAuthResponse.ok}`);
    
    if (!presignNoAuthResponse.ok) {
      const errorData = await presignNoAuthResponse.json().catch(() => ({}));
      console.log('   📋 Error response:', errorData);
    }
    
    // 5. Probar endpoint de presign con token inválido
    console.log('\n5️⃣ Probando endpoint presign con token inválido...');
    const presignInvalidTokenResponse = await fetch(`${CONTROLFILE_URL}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid_token_123',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg'
      })
    });
    console.log(`   Status: ${presignInvalidTokenResponse.status}`);
    console.log(`   OK: ${presignInvalidTokenResponse.ok}`);
    
    if (!presignInvalidTokenResponse.ok) {
      const errorData = await presignInvalidTokenResponse.json().catch(() => ({}));
      console.log('   📋 Error response:', errorData);
    }
    
    // 6. Verificar CORS
    console.log('\n6️⃣ Verificando configuración CORS...');
    const corsResponse = await fetch(`${CONTROLFILE_URL}/api/user/profile`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization,Content-Type'
      }
    });
    console.log(`   Status: ${corsResponse.status}`);
    console.log(`   OK: ${corsResponse.ok}`);
    console.log('   Headers CORS:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
    });
    
    console.log('\n✅ Diagnóstico completado');
    console.log('\n📋 Resumen:');
    console.log('   • Si el servicio responde 200 en health check: ✅ Servicio disponible');
    console.log('   • Si los endpoints devuelven 401 sin auth: ✅ Endpoints protegidos correctamente');
    console.log('   • Si los endpoints devuelven 401 con token inválido: ✅ Validación de token funcionando');
    console.log('   • Si CORS responde 200: ✅ CORS configurado correctamente');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    console.error('🔍 Stack trace:', error.stack);
  }
}

// Ejecutar el diagnóstico
testControlFileAuth();
