#!/usr/bin/env node

/**
 * Script para probar directamente la autenticación del backend
 * Uso: node test-backend-auth.js
 */

// Usar fetch nativo de Node.js

async function testBackendAuth() {
  console.log('🧪 Probando autenticación del backend...');
  console.log('');

  const backendUrl = 'https://controlauditv2.onrender.com';
  
  try {
    // 1. Probar endpoint sin autenticación
    console.log('🔍 Probando endpoint sin token...');
    
    const responseNoAuth = await fetch(`${backendUrl}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📥 Respuesta sin token:', responseNoAuth.status, responseNoAuth.statusText);
    
    if (responseNoAuth.status === 401) {
      console.log('✅ Correcto: El endpoint requiere autenticación');
    } else {
      console.log('⚠️ Inesperado: El endpoint no requiere autenticación');
    }
    console.log('');

    // 2. Probar endpoint con token inválido
    console.log('🔍 Probando endpoint con token inválido...');
    
    const responseInvalidToken = await fetch(`${backendUrl}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token_here',
        'Content-Type': 'application/json',
      }
    });

    console.log('📥 Respuesta con token inválido:', responseInvalidToken.status, responseInvalidToken.statusText);
    
    if (responseInvalidToken.status === 401) {
      console.log('✅ Correcto: El backend rechaza tokens inválidos');
    } else {
      console.log('⚠️ Inesperado: El backend acepta tokens inválidos');
    }
    console.log('');

    // 3. Probar endpoint de health check
    console.log('🔍 Probando endpoint de health check...');
    
    const responseHealth = await fetch(`${backendUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📥 Respuesta health check:', responseHealth.status, responseHealth.statusText);
    
    if (responseHealth.ok) {
      const healthData = await responseHealth.json();
      console.log('✅ Backend funcionando:', healthData);
    } else {
      console.log('❌ Backend no responde correctamente');
    }
    console.log('');

    // 4. Probar endpoint de presign
    console.log('🔍 Probando endpoint de presign sin token...');
    
    const responsePresign = await fetch(`${backendUrl}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileType: 'image/jpeg'
      })
    });

    console.log('📥 Respuesta presign sin token:', responsePresign.status, responsePresign.statusText);
    
    if (responsePresign.status === 401) {
      console.log('✅ Correcto: El endpoint presign requiere autenticación');
    } else {
      console.log('⚠️ Inesperado: El endpoint presign no requiere autenticación');
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error);
    console.error('🔍 Detalles:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Ejecutar la prueba
testBackendAuth();
