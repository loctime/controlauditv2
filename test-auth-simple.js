// Script de prueba para verificar autenticación de Firebase
// Ejecutar en la consola del navegador después de importar auth

// Importar auth desde firebaseConfig
import { auth } from './src/firebaseConfig.js';

// Verificar si hay usuario autenticado
if (auth && auth.currentUser) {
  console.log('✅ Usuario autenticado:', auth.currentUser.email);
  console.log('🆔 UID:', auth.currentUser.uid);
  
  // Obtener token
  auth.currentUser.getIdToken(true).then(token => {
    console.log('🔑 Token de Firebase:', token);
    console.log('📏 Longitud del token:', token.length);
    console.log('🔍 Primeros 50 caracteres:', token.substring(0, 50) + '...');
    console.log('🔍 Últimos 50 caracteres:', '...' + token.substring(token.length - 50));
    
    if (token && token.length > 0) {
      console.log('✅ Token válido');
    } else {
      console.log('❌ Token vacío o inválido');
    }
  }).catch(error => {
    console.error('❌ Error obteniendo token:', error);
  });
} else {
  console.log('❌ No hay usuario autenticado');
  console.log('💡 Inicia sesión primero');
}
