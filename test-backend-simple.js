// Script simple para diagnosticar el backend
const BACKEND_URL = 'https://controlauditv2.onrender.com';

async function testBackend() {
  console.log('🔍 Diagnóstico del backend');
  console.log('🌐 URL:', BACKEND_URL);
  console.log('');

  try {
    // Probar endpoint de salud
    console.log('1️⃣ Probando endpoint de salud...');
    const healthResponse = await fetch(`${BACKEND_URL}/`);
    console.log('   Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('   Response:', data);
    } else {
      const errorText = await healthResponse.text();
      console.log('   Error:', errorText);
    }
    console.log('');

    // Probar endpoint de perfil sin token
    console.log('2️⃣ Probando endpoint de perfil sin token...');
    const profileResponse = await fetch(`${BACKEND_URL}/api/user/profile`);
    console.log('   Status:', profileResponse.status);
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.log('   Error:', errorText);
    }
    console.log('');

    // Probar endpoint de presign sin token
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
    
    if (!presignResponse.ok) {
      const errorText = await presignResponse.text();
      console.log('   Error:', errorText);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('✅ Diagnóstico completado');
}

testBackend();
