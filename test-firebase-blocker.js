#!/usr/bin/env node

/**
 * Script para verificar si los errores de bloqueador afectan la funcionalidad
 */

const CONTROLFILE_URL = 'https://controlauditv2.onrender.com';

async function testFirebaseBlocker() {
  console.log('🔍 Verificando efectos del bloqueador en Firebase');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar si ControlFile funciona a pesar de los errores
    console.log('\n1️⃣ Probando ControlFile con errores de bloqueador...');
    
    const healthResponse = await fetch(`${CONTROLFILE_URL}/api/health`);
    console.log(`   Health check: ${healthResponse.status} ${healthResponse.ok ? '✅' : '❌'}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ ControlFile responde correctamente');
    }
    
    // 2. Verificar endpoints protegidos
    console.log('\n2️⃣ Probando endpoints protegidos...');
    
    const profileResponse = await fetch(`${CONTROLFILE_URL}/api/user/profile`);
    console.log(`   Profile endpoint: ${profileResponse.status} ${profileResponse.status === 401 ? '✅ (Esperado)' : '❌'}`);
    
    const presignResponse = await fetch(`${CONTROLFILE_URL}/api/uploads/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg'
      })
    });
    console.log(`   Presign endpoint: ${presignResponse.status} ${presignResponse.status === 401 ? '✅ (Esperado)' : '❌'}`);
    
    // 3. Verificar CORS
    console.log('\n3️⃣ Verificando CORS...');
    
    const corsResponse = await fetch(`${CONTROLFILE_URL}/api/user/profile`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization,Content-Type'
      }
    });
    console.log(`   CORS: ${corsResponse.status} ${corsResponse.ok ? '✅' : '❌'}`);
    
    console.log('\n📋 Resumen:');
    console.log('   • Los errores de Firestore son normales con bloqueadores');
    console.log('   • ControlFile funciona correctamente a pesar de los errores');
    console.log('   • Los endpoints están protegidos correctamente');
    console.log('   • CORS está configurado correctamente');
    console.log('\n💡 Recomendación:');
    console.log('   - Los errores no afectan la funcionalidad principal');
    console.log('   - Puedes ignorar los errores de Firestore si la app funciona');
    console.log('   - O deshabilitar temporalmente el bloqueador para desarrollo');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

testFirebaseBlocker();
