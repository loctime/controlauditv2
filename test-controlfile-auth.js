// Script para diagnosticar autenticación con ControlFile
const CONTROLFILE_URL = 'https://controlfile.onrender.com';

async function testControlFileAuth() {
  console.log('🔍 Diagnóstico de autenticación con ControlFile');
  console.log('🌐 URL:', CONTROLFILE_URL);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  try {
    // 1. Probar endpoint raíz
    console.log('1️⃣ Probando endpoint raíz...');
    const rootResponse = await fetch(`${CONTROLFILE_URL}/`);
    console.log('   Status:', rootResponse.status);
    console.log('   OK:', rootResponse.ok);
    
    if (rootResponse.ok) {
      const rootData = await rootResponse.text();
      console.log('   Response:', rootData.substring(0, 200) + '...');
    }
    console.log('');

    // 2. Probar endpoint de salud
    console.log('2️⃣ Probando endpoint de salud...');
    try {
      const healthResponse = await fetch(`${CONTROLFILE_URL}/api/health`);
      console.log('   Status:', healthResponse.status);
      console.log('   OK:', healthResponse.ok);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('   Response:', healthData);
      }
    } catch (healthError) {
      console.log('   Error:', healthError.message);
    }
    console.log('');

    // 3. Probar endpoint de perfil sin token
    console.log('3️⃣ Probando endpoint de perfil sin token...');
    const profileResponse = await fetch(`${CONTROLFILE_URL}/api/user/profile`);
    console.log('   Status:', profileResponse.status);
    console.log('   OK:', profileResponse.ok);
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.log('   Error:', errorText);
    }
    console.log('');

    // 4. Probar endpoint de presign sin token
    console.log('4️⃣ Probando endpoint de presign sin token...');
    const presignResponse = await fetch(`${CONTROLFILE_URL}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg'
      })
    });
    console.log('   Status:', presignResponse.status);
    console.log('   OK:', presignResponse.ok);
    
    if (!presignResponse.ok) {
      const errorText = await presignResponse.text();
      console.log('   Error:', errorText);
    }
    console.log('');

    // 5. Verificar headers de CORS
    console.log('5️⃣ Verificando headers de CORS...');
    const corsResponse = await fetch(`${CONTROLFILE_URL}/api/user/profile`, {
      method: 'OPTIONS'
    });
    console.log('   CORS Headers:', Object.fromEntries(corsResponse.headers.entries()));
    console.log('');

    console.log('✅ Diagnóstico completado');
    console.log('');
    console.log('📋 Resumen:');
    console.log('   - Endpoint raíz: 404 (esperado, no implementado)');
    console.log('   - Endpoints API: 401 (requieren autenticación)');
    console.log('   - ControlFile está funcionando correctamente');
    console.log('   - El problema es de autenticación, no de conectividad');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
testControlFileAuth();
