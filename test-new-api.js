// Script para probar la nueva API simplificada
// Usar fetch nativo de Node.js (disponible desde Node 18+)

const API_BASE_URL = 'http://localhost:4000';

// Función para hacer requests con token simulado
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`📡 Request: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(10000)
    });

    console.log(`📥 Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
}

// Pruebas
async function runTests() {
  console.log('🧪 Iniciando pruebas de la nueva API simplificada...\n');

  const tests = [
    {
      name: 'Health Check',
      test: () => makeRequest('/api/health')
    },
    {
      name: 'Root Endpoint',
      test: () => makeRequest('/')
    }
  ];

  for (const { name, test } of tests) {
    console.log(`\n🔍 Probando: ${name}`);
    try {
      const result = await test();
      console.log(`✅ ${name} exitoso:`, result);
    } catch (error) {
      console.log(`❌ ${name} falló:`, error.message);
    }
  }

  console.log('\n📊 Resumen de pruebas completado');
}

// Ejecutar pruebas
runTests().catch(console.error);
