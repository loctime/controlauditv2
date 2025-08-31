#!/usr/bin/env node

/**
 * Script simplificado para probar la autenticación y el token de Firebase
 * Uso: node test-auth-simple.js
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
  console.log('🧪 Probando autenticación y token de Firebase...');
  console.log('');

  try {
    // Verificar si hay usuario autenticado
    console.log('🔍 Verificando usuario autenticado...');
    
    if (!auth.currentUser) {
      console.log('❌ No hay usuario autenticado');
      console.log('💡 Solución: Inicia sesión en la aplicación primero');
      return;
    }

    console.log('✅ Usuario autenticado encontrado');
    console.log('👤 UID:', auth.currentUser.uid);
    console.log('📧 Email:', auth.currentUser.email);
    console.log('📛 Display Name:', auth.currentUser.displayName);
    console.log('');

    // Obtener token
    console.log('🔑 Obteniendo token de Firebase...');
    
    const token = await auth.currentUser.getIdToken(true);
    
    if (!token) {
      console.log('❌ No se pudo obtener el token');
      return;
    }

    console.log('✅ Token obtenido exitosamente');
    console.log('📏 Longitud del token:', token.length, 'caracteres');
    console.log('🔑 Token preview:', token.substring(0, 50) + '...');
    console.log('');

    // Probar el token con el backend
    console.log('🌐 Probando token con el backend...');
    
    const backendUrl = 'https://controlauditv2.onrender.com';
    
    const response = await fetch(`${backendUrl}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('📥 Respuesta del backend:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token válido - Perfil obtenido exitosamente');
      console.log('📋 Datos del perfil:', {
        uid: data.user?.uid,
        email: data.user?.email,
        role: data.user?.role
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Error con el token:', errorText);
      
      if (response.status === 401) {
        console.log('💡 El token puede haber expirado. Intenta:');
        console.log('   1. Cerrar sesión en la aplicación');
        console.log('   2. Volver a iniciar sesión');
        console.log('   3. Probar nuevamente');
      }
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
testAuthToken();
