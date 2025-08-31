// Script para probar todos los endpoints de ControlFile
import https from 'https';

const baseUrl = 'https://files.controldoc.app';

const endpoints = [
  '/',
  '/health',
  '/api/health',
  '/api/user/profile',
  '/api/uploads/presign',
  '/api/uploads/proxy-upload',
  '/api/uploads/complete',
  '/api/status',
  '/api/info',
  '/status',
  '/info'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${baseUrl}${endpoint}`;
    const req = https.get(url, (res) => {
      console.log(`✅ ${endpoint} - Status: ${res.statusCode}`);
      resolve({ endpoint, status: res.statusCode, success: true });
    });

    req.on('error', (error) => {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
      resolve({ endpoint, error: error.message, success: false });
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ ${endpoint} - Timeout`);
      req.destroy();
      resolve({ endpoint, error: 'Timeout', success: false });
    });
  });
}

async function testAllEndpoints() {
  console.log('🔍 Probando todos los endpoints de ControlFile...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('\n📊 Resumen de endpoints disponibles:');
  console.log('=====================================');
  
  const available = results.filter(r => r.success && r.status === 200);
  const responding = results.filter(r => r.success);
  const notFound = results.filter(r => r.success && r.status === 404);
  const errors = results.filter(r => !r.success);
  
  console.log(`✅ Disponibles (200): ${available.length}`);
  available.forEach(r => console.log(`   - ${r.endpoint}`));
  
  console.log(`⚠️  Responden pero con error: ${responding.length - available.length}`);
  responding.filter(r => r.status !== 200).forEach(r => console.log(`   - ${r.endpoint} (${r.status})`));
  
  console.log(`❌ No encontrados (404): ${notFound.length}`);
  notFound.forEach(r => console.log(`   - ${r.endpoint}`));
  
  console.log(`💥 Errores de conexión: ${errors.length}`);
  errors.forEach(r => console.log(`   - ${r.endpoint} (${r.error})`));
  
  console.log('\n💡 Recomendaciones:');
  if (available.length > 0) {
    console.log('✅ ControlFile está funcionando. Usa los endpoints disponibles.');
  } else if (responding.length > 0) {
    console.log('⚠️  ControlFile responde pero algunos endpoints no están implementados.');
  } else {
    console.log('❌ ControlFile no está disponible o tiene problemas de conectividad.');
  }
}

testAllEndpoints();
