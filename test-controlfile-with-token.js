// Script para probar ControlFile con token de Firebase
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

const CONTROLFILE_URL = 'https://controlfile.onrender.com';

async function testControlFileWithToken() {
  console.log('🔍 Probando ControlFile con token de Firebase');
  console.log('🌐 URL:', CONTROLFILE_URL);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  try {
    // 1. Inicializar Firebase
    console.log('1️⃣ Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    console.log('✅ Firebase inicializado');

    // 2. Autenticar usuario (necesitarás proporcionar credenciales)
    console.log('2️⃣ Autenticando usuario...');
    console.log('⚠️ Necesitas proporcionar email y password en el código');
    
    // Descomenta y modifica estas líneas con tus credenciales:
    // const userCredential = await signInWithEmailAndPassword(auth, 'tu-email@ejemplo.com', 'tu-password');
    // const user = userCredential.user;
    // console.log('✅ Usuario autenticado:', user.email);

    // 3. Obtener token
    console.log('3️⃣ Obteniendo token...');
    // const token = await user.getIdToken(true);
    // console.log('✅ Token obtenido (longitud:', token.length, ')');
    // console.log('🔑 Token preview:', token.substring(0, 50) + '...');

    // 4. Probar endpoint de perfil con token
    console.log('4️⃣ Probando endpoint de perfil con token...');
    // const profileResponse = await fetch(`${CONTROLFILE_URL}/api/user/profile`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   }
    // });
    // console.log('   Status:', profileResponse.status);
    // console.log('   OK:', profileResponse.ok);
    
    // if (profileResponse.ok) {
    //   const profileData = await profileResponse.json();
    //   console.log('   Response:', profileData);
    // } else {
    //   const errorText = await profileResponse.text();
    //   console.log('   Error:', errorText);
    // }

    // 5. Probar endpoint de presign con token
    console.log('5️⃣ Probando endpoint de presign con token...');
    // const presignResponse = await fetch(`${CONTROLFILE_URL}/api/uploads/presign`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     fileName: 'test.jpg',
    //     fileSize: 12345,
    //     mimeType: 'image/jpeg',
    //     metadata: {
    //       app: 'controlaudit',
    //       test: true
    //     }
    //   })
    // });
    // console.log('   Status:', presignResponse.status);
    // console.log('   OK:', presignResponse.ok);
    
    // if (presignResponse.ok) {
    //   const presignData = await presignResponse.json();
    //   console.log('   Response:', presignData);
    // } else {
    //   const errorText = await presignResponse.text();
    //   console.log('   Error:', errorText);
    // }

    console.log('');
    console.log('📋 Instrucciones:');
    console.log('1. Descomenta las líneas marcadas con //');
    console.log('2. Reemplaza "tu-email@ejemplo.com" y "tu-password" con tus credenciales reales');
    console.log('3. Ejecuta el script nuevamente');
    console.log('');
    console.log('✅ Script preparado para pruebas con token real');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar prueba
testControlFileWithToken();
