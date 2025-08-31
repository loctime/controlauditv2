// Script para diagnosticar el problema de autenticación
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg",
  authDomain: "auditoria-f9fc4.firebaseapp.com",
  projectId: "auditoria-f9fc4",
  storageBucket: "auditoria-f9fc4.appspot.com",
  messagingSenderId: "156800340171",
  appId: "1:156800340171:web:fbe017105fd68b0f114b4e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuthToken() {
  console.log('🔍 Diagnóstico de autenticación con Firebase');
  console.log('🌐 URL del backend:', 'https://controlauditv2.onrender.com');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  try {
    // 1. Verificar si hay un usuario autenticado
    console.log('1️⃣ Verificando estado de autenticación...');
    const currentUser = auth.currentUser;
    console.log('   Usuario actual:', currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified
    } : 'No hay usuario autenticado');
    console.log('');

    // 2. Si no hay usuario, intentar autenticarse
    if (!currentUser) {
      console.log('2️⃣ No hay usuario autenticado, intentando autenticarse...');
      console.log('   ⚠️ Necesitas proporcionar credenciales válidas');
      console.log('   💡 Para probar, puedes usar las credenciales de desarrollo');
      console.log('');
      return;
    }

    // 3. Obtener token de Firebase
    console.log('3️⃣ Obteniendo token de Firebase...');
    const token = await currentUser.getIdToken(true); // Forzar refresh
    console.log('   Token obtenido:', token ? '✅ Sí' : '❌ No');
    console.log('   Longitud del token:', token ? token.length : 0);
    console.log('   Preview del token:', token ? token.substring(0, 50) + '...' : 'N/A');
    console.log('');

    if (!token) {
      console.log('❌ No se pudo obtener el token de Firebase');
      return;
    }

    // 4. Probar endpoint de perfil con el token
    console.log('4️⃣ Probando endpoint de perfil con token...');
    const profileResponse = await fetch('https://controlauditv2.onrender.com/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', profileResponse.status);
    console.log('   Headers:', Object.fromEntries(profileResponse.headers.entries()));
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('   ✅ Perfil obtenido exitosamente');
      console.log('   Datos del perfil:', {
        uid: profileData.user?.uid,
        email: profileData.user?.email,
        role: profileData.user?.role
      });
    } else {
      const errorText = await profileResponse.text();
      console.log('   ❌ Error obteniendo perfil:', errorText);
    }
    console.log('');

    // 5. Probar endpoint de presign con el token
    console.log('5️⃣ Probando endpoint de presign con token...');
    const presignResponse = await fetch('https://controlauditv2.onrender.com/api/uploads/presign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    
    if (presignResponse.ok) {
      const presignData = await presignResponse.json();
      console.log('   ✅ Presign creado exitosamente');
      console.log('   Upload ID:', presignData.uploadId);
    } else {
      const errorText = await presignResponse.text();
      console.log('   ❌ Error creando presign:', errorText);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }

  console.log('✅ Diagnóstico completado');
}

// Ejecutar el diagnóstico
testAuthToken();
