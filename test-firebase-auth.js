// Script para probar la autenticación de Firebase
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg",
  authDomain: "auditoria-f9fc4.firebaseapp.com",
  projectId: "auditoria-f9fc4",
  storageBucket: "auditoria-f9fc4.appspot.com",
  messagingSenderId: "156800340171",
  appId: "1:156800340171:web:fbe017105fd68b0f114b4e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testFirebaseAuth() {
  try {
    console.log('🔍 Probando autenticación de Firebase...');
    
    // Intentar obtener el usuario actual
    const currentUser = auth.currentUser;
    console.log('👤 Usuario actual:', currentUser ? currentUser.email : 'No autenticado');
    
    if (currentUser) {
      console.log('✅ Usuario ya autenticado');
      const token = await currentUser.getIdToken();
      console.log('🔑 Token generado:', token.substring(0, 50) + '...');
      
      // Probar el endpoint con el token
      const response = await fetch('http://localhost:4000/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📥 Respuesta del backend:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Respuesta exitosa:', data);
      } else {
        const errorText = await response.text();
        console.log('❌ Error del backend:', errorText);
      }
    } else {
      console.log('⚠️ No hay usuario autenticado');
      console.log('💡 Para probar, inicia sesión en la aplicación web primero');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testFirebaseAuth();
