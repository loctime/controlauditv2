// Código para ejecutar directamente en la consola del navegador (F12)
// Copia y pega este código completo:

(function() {
  console.log('🧪 Verificando autenticación de Firebase...');
  
  // Buscar la instancia de auth en el contexto global
  let auth = null;
  
  // Método 1: Buscar en window.auth
  if (window.auth) {
    auth = window.auth;
    console.log('✅ Auth encontrado en window.auth');
  }
  // Método 2: Buscar en window.firebase
  else if (window.firebase && window.firebase.auth) {
    auth = window.firebase.auth();
    console.log('✅ Auth encontrado en window.firebase.auth');
  }
  // Método 3: Buscar en el contexto de React
  else {
    console.log('🔍 Buscando auth en el contexto de React...');
    try {
      // Intentar acceder al contexto de React DevTools
      const rootElement = document.querySelector('#root') || document.querySelector('[data-reactroot]');
      if (rootElement && rootElement._reactInternalFiber) {
        console.log('✅ Elemento React encontrado');
      }
    } catch (e) {
      console.log('❌ No se pudo acceder al contexto de React');
    }
  }
  
  if (!auth) {
    console.log('❌ No se pudo encontrar la instancia de auth');
    console.log('💡 Soluciones:');
    console.log('   1. Asegúrate de que la aplicación esté completamente cargada');
    console.log('   2. Inicia sesión en la aplicación primero');
    console.log('   3. Verifica que Firebase esté inicializado');
    return;
  }
  
  // Verificar si hay usuario autenticado
  if (auth.currentUser) {
    console.log('✅ Usuario autenticado encontrado');
    console.log('👤 Email:', auth.currentUser.email);
    console.log('🆔 UID:', auth.currentUser.uid);
    console.log('📛 Nombre:', auth.currentUser.displayName || 'No especificado');
    console.log('📧 Email verificado:', auth.currentUser.emailVerified);
    
    // Obtener token
    console.log('🔑 Obteniendo token...');
    auth.currentUser.getIdToken(true)
      .then(token => {
        console.log('✅ Token obtenido exitosamente');
        console.log('📏 Longitud:', token.length, 'caracteres');
        console.log('🔍 Inicio:', token.substring(0, 50) + '...');
        console.log('🔍 Final:', '...' + token.substring(token.length - 50));
        
        if (token && token.length > 0) {
          console.log('✅ Token válido');
          
          // Probar con el backend
          console.log('🌐 Probando token con backend...');
          const backendUrl = 'https://controlauditv2.onrender.com';
          
          fetch(`${backendUrl}/api/user/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          })
          .then(response => {
            console.log('📥 Respuesta backend:', response.status, response.statusText);
            if (response.ok) {
              return response.json();
            } else {
              throw new Error(`HTTP ${response.status}`);
            }
          })
          .then(data => {
            console.log('✅ Token válido - Perfil obtenido');
            console.log('📋 Datos:', data);
          })
          .catch(error => {
            console.error('❌ Error con backend:', error.message);
          });
        } else {
          console.log('❌ Token vacío');
        }
      })
      .catch(error => {
        console.error('❌ Error obteniendo token:', error);
      });
  } else {
    console.log('❌ No hay usuario autenticado');
    console.log('💡 Inicia sesión en la aplicación primero');
  }
})();

