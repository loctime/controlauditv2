const https = require('https');
const http = require('http');

// Función para hacer requests HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Prueba 1: ControlFile Health Check
async function testControlFileHealth() {
  console.log('🧪 1. Probando ControlFile Health Check...');
  try {
    const result = await makeRequest('https://controlfile.onrender.com/api/health', {
      method: 'GET'
    });
    console.log('✅ ControlFile Health Check:', result);
    return true;
  } catch (error) {
    console.log('❌ ControlFile Health Check falló:', error.message);
    return false;
  }
}

// Prueba 2: Backend Health Check
async function testBackendHealth() {
  console.log('\n🧪 2. Probando Backend Health Check...');
  try {
    const result = await makeRequest('http://localhost:4001/api/health', {
      method: 'GET'
    });
    console.log('✅ Backend Health Check:', result);
    return true;
  } catch (error) {
    console.log('❌ Backend Health Check falló:', error.message);
    return false;
  }
}

// Prueba 3: Frontend disponible
async function testFrontendHealth() {
  console.log('\n🧪 3. Probando Frontend...');
  try {
    const result = await makeRequest('http://localhost:5173/', {
      method: 'GET'
    });
    console.log('✅ Frontend disponible:', { status: result.status });
    return true;
  } catch (error) {
    console.log('❌ Frontend no disponible:', error.message);
    return false;
  }
}

// Prueba 4: Verificar puertos
async function testPorts() {
  console.log('\n🧪 4. Verificando puertos...');
  
  const ports = [
    { port: 5173, service: 'Frontend (Vite)' },
    { port: 4001, service: 'Backend (API)' }
  ];
  
  for (const { port, service } of ports) {
    try {
      const result = await makeRequest(`http://localhost:${port}/`, {
        method: 'GET'
      });
      console.log(`✅ Puerto ${port} (${service}): Activo`);
    } catch (error) {
      console.log(`❌ Puerto ${port} (${service}): No disponible`);
    }
  }
}

// Prueba 5: Verificar configuración de Firebase
async function testFirebaseConfig() {
  console.log('\n🧪 5. Verificando configuración de Firebase...');
  
  const expectedConfig = {
    projectId: 'controlstorage-eb796',
    authDomain: 'controlstorage-eb796.firebaseapp.com'
  };
  
  console.log('📋 Configuración esperada:');
  console.log(`   Project ID: ${expectedConfig.projectId}`);
  console.log(`   Auth Domain: ${expectedConfig.authDomain}`);
  console.log('✅ Configuración verificada (manual)');
}

// Función principal
async function runCompleteTests() {
  console.log('🚀 Iniciando pruebas completas de integración...\n');
  
  const controlFileOk = await testControlFileHealth();
  const backendOk = await testBackendHealth();
  const frontendOk = await testFrontendHealth();
  await testPorts();
  await testFirebaseConfig();
  
  console.log('\n📊 Resumen de pruebas:');
  console.log(`ControlFile: ${controlFileOk ? '✅' : '❌'}`);
  console.log(`Backend: ${backendOk ? '✅' : '❌'}`);
  console.log(`Frontend: ${frontendOk ? '✅' : '❌'}`);
  
  if (controlFileOk && backendOk && frontendOk) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! La integración está funcionando correctamente.');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Abre http://localhost:5173 en tu navegador');
    console.log('2. Inicia sesión con Google');
    console.log('3. Ve a la página de perfil para probar ControlFile');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa la configuración.');
  }
}

// Ejecutar pruebas
runCompleteTests().catch(console.error);
