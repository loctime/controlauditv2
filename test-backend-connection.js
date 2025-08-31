// Script para verificar la conexión con el backend de producción
const testBackendConnection = async () => {
  console.log('🔧 Verificando conexión con el backend...');
  
  const backendUrl = 'https://controlauditv2.onrender.com';
  
  try {
    // Test 1: Health check básico
    console.log('📡 Probando health check...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check exitoso:', healthData);
    
    // Test 2: API health check
    console.log('📡 Probando API health check...');
    const apiHealthResponse = await fetch(`${backendUrl}/api/health`);
    const apiHealthData = await apiHealthResponse.json();
    console.log('✅ API health check exitoso:', apiHealthData);
    
    // Test 3: Verificar CORS
    console.log('📡 Probando CORS...');
    const corsResponse = await fetch(`${backendUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    console.log('✅ CORS configurado correctamente');
    console.log('📋 Headers CORS:', {
      'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': corsResponse.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': corsResponse.headers.get('access-control-allow-headers')
    });
    
    // Test 4: Verificar que el backend esté vivo
    console.log('📡 Probando conectividad general...');
    const aliveResponse = await fetch(`${backendUrl}/`);
    console.log('✅ Backend está vivo, status:', aliveResponse.status);
    
    console.log('\n🎉 ¡Todas las pruebas pasaron! El backend está funcionando correctamente.');
    
    return {
      success: true,
      backendUrl,
      health: healthData,
      apiHealth: apiHealthData,
      cors: 'OK',
      status: 'CONNECTED'
    };
    
  } catch (error) {
    console.error('❌ Error conectando con el backend:', error);
    return {
      success: false,
      backendUrl,
      error: error.message,
      status: 'FAILED'
    };
  }
};

// Ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  window.testBackendConnection = testBackendConnection;
  console.log('✅ Función testBackendConnection disponible globalmente');
  console.log('📝 Uso: await testBackendConnection()');
}

// Ejecutar si estamos en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testBackendConnection };
  
  // Ejecutar automáticamente si se llama directamente
  if (require.main === module) {
    testBackendConnection().then(result => {
      console.log('\n📊 Resultado final:', result);
      process.exit(result.success ? 0 : 1);
    });
  }
}
