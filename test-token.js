/**
 * Script simple para probar el token de Firebase
 */

import { auth } from './src/firebaseConfig.js';

async function testToken() {
  console.log('🧪 Probando token de Firebase...');
  
  try {
    // Verificar si hay usuario autenticado
    if (!auth.currentUser) {
      console.log('❌ No hay usuario autenticado en Firebase');
      console.log('💡 Por favor, inicia sesión en la aplicación primero');
      return;
    }
    
    const user = auth.currentUser;
    console.log('✅ Usuario autenticado:', user.email);
    console.log('🆔 UID:', user.uid);
    
    // Obtener token
    console.log('🔐 Obteniendo token...');
    const token = await auth.currentUser.getIdToken(true);
    
    console.log('✅ Token obtenido exitosamente');
    console.log('📏 Longitud del token:', token.length);
    console.log('🔍 Primeros 50 caracteres:', token.substring(0, 50) + '...');
    console.log('🔍 Últimos 50 caracteres:', '...' + token.substring(token.length - 50));
    
    // Verificar que el token no esté vacío
    if (token && token.length > 0) {
      console.log('✅ Token válido');
    } else {
      console.log('❌ Token vacío o inválido');
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo token:', error);
  }
}

// Ejecutar la prueba
testToken();
