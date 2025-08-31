#!/usr/bin/env node

/**
 * Script para solucionar problemas de autenticación
 * Uso: node fix-auth-issue.js
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

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

async function fixAuthIssue() {
  console.log('🔧 SOLUCIONANDO PROBLEMA DE AUTENTICACIÓN');
  console.log('==========================================');
  console.log('');

  try {
    // 1. Verificar estado actual
    console.log('1️⃣ VERIFICANDO ESTADO ACTUAL');
    console.log('-----------------------------');
    
    if (auth.currentUser) {
      console.log('✅ Usuario autenticado:', auth.currentUser.email);
      console.log('👤 UID:', auth.currentUser.uid);
      
      // Verificar token actual
      try {
        const currentToken = await auth.currentUser.getIdToken(false);
        console.log('🔑 Token actual válido:', currentToken ? 'Sí' : 'No');
        
        if (currentToken) {
          console.log('📏 Longitud del token:', currentToken.length);
          console.log('🔑 Token preview:', currentToken.substring(0, 50) + '...');
        }
      } catch (tokenError) {
        console.log('❌ Error obteniendo token actual:', tokenError.message);
      }
    } else {
      console.log('❌ No hay usuario autenticado');
    }
    console.log('');

    // 2. Forzar refresh del token
    console.log('2️⃣ FORZANDO REFRESH DEL TOKEN');
    console.log('-----------------------------');
    
    if (auth.currentUser) {
      try {
        console.log('🔄 Forzando refresh del token...');
        const newToken = await auth.currentUser.getIdToken(true);
        
        if (newToken) {
          console.log('✅ Token refrescado exitosamente');
          console.log('📏 Nueva longitud del token:', newToken.length);
          console.log('🔑 Nuevo token preview:', newToken.substring(0, 50) + '...');
        } else {
          console.log('❌ No se pudo obtener nuevo token');
        }
      } catch (refreshError) {
        console.log('❌ Error refrescando token:', refreshError.message);
        console.log('💡 El token puede haber expirado completamente');
      }
    }
    console.log('');

    // 3. Probar token con backend
    console.log('3️⃣ PROBANDO TOKEN CON BACKEND');
    console.log('-----------------------------');
    
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(true);
        const backendUrl = 'https://controlauditv2.onrender.com';
        
        console.log('🌐 Probando token con backend...');
        
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
            console.log('💡 El token sigue siendo inválido');
            console.log('🔄 Intentando cerrar sesión y volver a iniciar...');
            
            // Cerrar sesión
            await signOut(auth);
            console.log('✅ Sesión cerrada exitosamente');
            
            console.log('💡 Ahora necesitas:');
            console.log('   1. Ir a la aplicación web');
            console.log('   2. Iniciar sesión nuevamente');
            console.log('   3. Probar la funcionalidad');
          }
        }
      } catch (testError) {
        console.log('❌ Error probando token:', testError.message);
      }
    }
    console.log('');

    // 4. Recomendaciones
    console.log('4️⃣ RECOMENDACIONES');
    console.log('------------------');
    console.log('🛠️ Si el problema persiste:');
    console.log('   1. Cerrar sesión en la aplicación web');
    console.log('   2. Limpiar caché del navegador (Ctrl+Shift+Delete)');
    console.log('   3. Deshabilitar extensiones del navegador temporalmente');
    console.log('   4. Volver a iniciar sesión');
    console.log('   5. Si el problema continúa, contactar al administrador');
    console.log('');
    console.log('🔧 Para desarrolladores:');
    console.log('   • Verificar que el usuario existe en Firestore');
    console.log('   • Revisar logs del backend en Render');
    console.log('   • Verificar configuración de Firebase Admin SDK');
    console.log('');

  } catch (error) {
    console.error('💥 Error en la solución:', error);
    console.error('🔍 Detalles:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Ejecutar la solución
fixAuthIssue();
