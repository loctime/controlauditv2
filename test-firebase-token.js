// Script para diagnosticar el token de Firebase
const CONTROLFILE_URL = 'https://controlfile.onrender.com';

async function testFirebaseToken() {
  console.log('🔍 Diagnóstico del token de Firebase');
  console.log('🌐 URL de ControlFile:', CONTROLFILE_URL);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  try {
    // 1. Verificar si hay usuario autenticado en el navegador
    console.log('1️⃣ Verificando autenticación en el navegador...');
    
    // Intentar obtener el token desde localStorage o sessionStorage
    const userInfo = localStorage.getItem('userInfo');
    const isLogged = localStorage.getItem('isLogged');
    
    console.log('   userInfo en localStorage:', userInfo ? '✅ Presente' : '❌ No encontrado');
    console.log('   isLogged en localStorage:', isLogged ? '✅ Presente' : '❌ No encontrado');
    
    if (userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        console.log('   Datos del usuario:', {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName
        });
      } catch (parseError) {
        console.log('   Error parseando userInfo:', parseError.message);
      }
    }
    console.log('');

    // 2. Verificar si Firebase está disponible en el navegador
    console.log('2️⃣ Verificando Firebase en el navegador...');
    
    if (typeof window !== 'undefined' && window.firebase) {
      console.log('   Firebase SDK disponible: ✅');
    } else if (typeof window !== 'undefined' && window.auth) {
      console.log('   Firebase Auth disponible: ✅');
    } else {
      console.log('   Firebase no disponible en el navegador: ❌');
    }
    console.log('');

    // 3. Probar endpoint de ControlFile sin token
    console.log('3️⃣ Probando ControlFile sin token...');
    const response = await fetch(`${CONTROLFILE_URL}/api/uploads/presign`, {
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
    
    console.log('   Status:', response.status);
    console.log('   OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('   Error:', errorText);
    }
    console.log('');

    // 4. Instrucciones para el usuario
    console.log('📋 Diagnóstico completado');
    console.log('');
    console.log('🔧 Soluciones posibles:');
    console.log('1. Cierra sesión y vuelve a iniciar sesión');
    console.log('2. Verifica que estés autenticado en Firebase');
    console.log('3. Limpia el caché del navegador');
    console.log('4. Verifica la consola del navegador para errores de Firebase');
    console.log('');
    console.log('💡 Para verificar el token en el navegador:');
    console.log('1. Abre las herramientas de desarrollador (F12)');
    console.log('2. Ve a la pestaña Console');
    console.log('3. Ejecuta: auth.currentUser?.getIdToken(true)');
    console.log('4. Si devuelve un token, el problema está en el envío');
    console.log('5. Si devuelve null, necesitas volver a autenticarte');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
testFirebaseToken();
