// Script para ejecutar directamente en la consola del navegador
// Copia y pega este código en la consola del navegador (F12)

// Función para verificar autenticación de Firebase
function verificarAutenticacion() {
  // Intentar obtener auth desde el contexto global
  let auth = null;
  
  // Buscar auth en diferentes lugares posibles
  if (window.auth) {
    auth = window.auth;
  } else if (window.firebase && window.firebase.auth) {
    auth = window.firebase.auth();
  } else {
    // Intentar obtener desde el contexto de React si está disponible
    try {
      // Buscar en el contexto de React DevTools
      const reactInstance = document.querySelector('[data-reactroot]') || document.querySelector('#root');
      if (reactInstance && reactInstance._reactInternalFiber) {
        // Intentar acceder al contexto de auth
        console.log('🔍 Buscando auth en el contexto de React...');
      }
    } catch (e) {
      console.log('❌ No se pudo acceder al contexto de React');
    }
  }
  
  if (!auth) {
    console.log('❌ No se pudo encontrar la instancia de auth');
    console.log('💡 Asegúrate de que:');
    console.log('   1. La aplicación esté cargada completamente');
    console.log('   2. Firebase esté inicializado');
    console.log('   3. Ejecutes este script en la consola del navegador');
    return;
  }
  
  // Verificar si hay usuario autenticado
  if (auth.currentUser) {
    console.log('✅ Usuario autenticado:', auth.currentUser.email);
    console.log('🆔 UID:', auth.currentUser.uid);
    console.log('📛 Nombre:', auth.currentUser.displayName);
    console.log('📧 Email verificado:', auth.currentUser.emailVerified);
    
    // Obtener token
    auth.currentUser.getIdToken(true).then(token => {
      console.log('🔑 Token de Firebase obtenido');
      console.log('📏 Longitud del token:', token.length, 'caracteres');
      console.log('🔍 Primeros 50 caracteres:', token.substring(0, 50) + '...');
      console.log('🔍 Últimos 50 caracteres:', '...' + token.substring(token.length - 50));
      
      if (token && token.length > 0) {
        console.log('✅ Token válido');
        
        // Probar el token con el backend
        console.log('🌐 Probando token con el backend...');
        const backendUrl = import.meta.env?.VITE_BACKEND_URL || 'https://controlauditv2.onrender.com';
        
        fetch(`${backendUrl}/api/user/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })
        .then(response => {
          console.log('📥 Respuesta del backend:', response.status, response.statusText);
          if (response.ok) {
            return response.json();
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        })
        .then(data => {
          console.log('✅ Token válido - Perfil obtenido exitosamente');
          console.log('📋 Datos del perfil:', data);
        })
        .catch(error => {
          console.error('❌ Error probando token con backend:', error.message);
        });
        
      } else {
        console.log('❌ Token vacío o inválido');
      }
    }).catch(error => {
      console.error('❌ Error obteniendo token:', error);
    });
  } else {
    console.log('❌ No hay usuario autenticado');
    console.log('💡 Inicia sesión primero en la aplicación');
  }
}

// Ejecutar la verificación
console.log('🧪 Iniciando verificación de autenticación...');
verificarAutenticacion();

