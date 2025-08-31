// Script de diagnóstico para verificar el estado de autenticación del backend
import fetch from 'node-fetch';

const BACKEND_URL = 'https://controlauditv2.onrender.com';

async function testBackendAuth() {
  console.log('🔍 Diagnóstico de autenticación del backend');
  console.log('🌐 URL del backend:', BACKEND_URL);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  try {
    // 1. Probar endpoint de salud sin autenticación
    console.log('1️⃣ Probando endpoint de salud...');
    const healthResponse = await fetch(`${BACKEND_URL}/`);
    console.log('   Status:', healthResponse.status);
    console.log('   Headers:', Object.fromEntries(healthResponse.headers.entries()));
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   Response:', healthData);
    }
    console.log('');

    // 2. Probar endpoint de perfil sin token
    console.log('2️⃣ Probando endpoint de perfil sin token...');
    const profileResponse = await fetch(`${BACKEND_URL}/api/user/profile`);
    console.log('   Status:', profileResponse.status);
    console.log('   Headers:', Object.fromEntries(profileResponse.headers.entries()));
    
    if (!profileResponse.ok) {
      const errorData = await profileResponse.text();
      console.log('   Error Response:', errorData);
    }
    console.log('');

    // 3. Probar endpoint de presign sin token
    console.log('3️⃣ Probando endpoint de presign sin token...');
    const presignResponse = await fetch(`${BACKEND_URL}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg'
      })
    });
    console.log('   Status:', presignResponse.status);
    console.log('   Headers:', Object.fromEntries(presignResponse.headers.entries()));
    
    if (!presignResponse.ok) {
      const errorData = await presignResponse.text();
      console.log('   Error Response:', errorData);
    }
    console.log('');

    // 4. Probar con token inválido
    console.log('4️⃣ Probando endpoint de perfil con token inválido...');
    const invalidTokenResponse = await fetch(`${BACKEND_URL}/api/user/profile`, {
      headers: {
        'Authorization': 'Bearer invalid-token-123'
      }
    });
    console.log('   Status:', invalidTokenResponse.status);
    console.log('   Headers:', Object.fromEntries(invalidTokenResponse.headers.entries()));
    
    if (!invalidTokenResponse.ok) {
      const errorData = await invalidTokenResponse.text();
      console.log('   Error Response:', errorData);
    }
    console.log('');

    // 5. Verificar CORS
    console.log('5️⃣ Probando CORS...');
    const corsResponse = await fetch(`${BACKEND_URL}/api/user/profile`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://auditoria.controldoc.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      }
    });
    console.log('   Status:', corsResponse.status);
    console.log('   CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': corsResponse.headers.get('Access-Control-Allow-Credentials')
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }

  console.log('✅ Diagnóstico completado');
}

// Ejecutar el diagnóstico
testBackendAuth();
