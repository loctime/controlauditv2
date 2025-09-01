// Script para probar endpoints de ControlFile
// Ejecutar en la consola del navegador

(async function() {
  console.log('🧪 Probando endpoints de ControlFile...');
  
  const controlFileUrl = 'https://controlfile.onrender.com';
  
  // Función para hacer peticiones con token
  async function makeRequest(endpoint, options = {}) {
    try {
      // Obtener token de Firebase
      let token = null;
      if (window.auth && window.auth.currentUser) {
        token = await window.auth.currentUser.getIdToken(true);
        console.log('✅ Token obtenido para petición');
      }
      
      const url = `${controlFileUrl}${endpoint}`;
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      };
      
      console.log(`🌐 Haciendo petición a: ${url}`);
      console.log('📋 Configuración:', {
        method: config.method,
        hasToken: !!token,
        headers: Object.keys(config.headers)
      });
      
      const response = await fetch(url, config);
      
      console.log(`📥 Respuesta: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        return { success: true, data, status: response.status };
      } else {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        return { success: false, error: errorText, status: response.status };
      }
    } catch (error) {
      console.error('💥 Error en petición:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 1. Probar endpoint de health/status
  console.log('\n🔍 1. Probando endpoint de health...');
  const healthResult = await makeRequest('/health');
  
  // 2. Probar endpoint de perfil de usuario
  console.log('\n🔍 2. Probando endpoint de perfil de usuario...');
  const profileResult = await makeRequest('/api/user/profile');
  
  // 3. Probar endpoint de presign sin datos
  console.log('\n🔍 3. Probando endpoint de presign (GET)...');
  const presignGetResult = await makeRequest('/api/uploads/presign');
  
  // 4. Probar endpoint de presign con datos mínimos
  console.log('\n🔍 4. Probando endpoint de presign (POST) con datos mínimos...');
  const presignPostResult = await makeRequest('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({
      name: 'test.jpg',
      size: 12345,
      mime: 'image/jpeg',
      parentId: null
    })
  });
  
  // 5. Probar endpoint de presign con datos completos
  console.log('\n🔍 5. Probando endpoint de presign (POST) con datos completos...');
  const presignFullResult = await makeRequest('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({
      name: 'test-image.jpg',
      size: 1024000, // 1MB
      mime: 'image/jpeg',
      parentId: null,
      metadata: {
        app: 'controlaudit',
        tipo: 'logo',
        usuario: 'test'
      }
    })
  });
  
  // Resumen de resultados
  console.log('\n📊 RESUMEN DE PRUEBAS:');
  console.log('=====================================');
  console.log(`1. Health: ${healthResult.success ? '✅' : '❌'} (${healthResult.status})`);
  console.log(`2. Profile: ${profileResult.success ? '✅' : '❌'} (${profileResult.status})`);
  console.log(`3. Presign GET: ${presignGetResult.success ? '✅' : '❌'} (${presignGetResult.status})`);
  console.log(`4. Presign POST (mínimo): ${presignPostResult.success ? '✅' : '❌'} (${presignPostResult.status})`);
  console.log(`5. Presign POST (completo): ${presignFullResult.success ? '✅' : '❌'} (${presignFullResult.status})`);
  
  // Análisis del problema
  console.log('\n🔍 ANÁLISIS DEL PROBLEMA:');
  if (presignPostResult.status === 500 || presignFullResult.status === 500) {
    console.log('❌ PROBLEMA CONFIRMADO: Endpoint /api/uploads/presign devuelve error 500');
    console.log('💡 Posibles causas:');
    console.log('   - Servidor de ControlFile caído o reiniciándose');
    console.log('   - Error en la configuración del servidor');
    console.log('   - Problema con la autenticación');
    console.log('   - Error en el procesamiento de la petición');
    
    if (presignPostResult.error) {
      console.log('📋 Detalles del error:', presignPostResult.error);
    }
  } else if (presignPostResult.status === 401) {
    console.log('⚠️ PROBLEMA DE AUTENTICACIÓN: Token inválido o expirado');
  } else if (presignPostResult.status === 404) {
    console.log('❌ PROBLEMA DE RUTA: Endpoint no encontrado');
  } else {
    console.log('✅ Endpoints funcionando correctamente');
  }
  
})();
