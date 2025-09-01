/**
 * Script de prueba simple para ControlFile
 * Sin ES modules para compatibilidad
 */

const https = require('https');

// Función para hacer requests HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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

// Prueba 1: Health check
async function testHealth() {
  console.log('🧪 1. Probando health check...');
  try {
    const result = await makeRequest('https://controlfile.onrender.com/api/health', {
      method: 'GET'
    });
    console.log('✅ Health check exitoso:', result);
    return true;
  } catch (error) {
    console.log('❌ Health check falló:', error.message);
    return false;
  }
}

// Prueba 2: Endpoint raíz
async function testRoot() {
  console.log('\n🧪 2. Probando endpoint raíz...');
  try {
    const result = await makeRequest('https://controlfile.onrender.com/', {
      method: 'GET'
    });
    console.log('✅ Endpoint raíz exitoso:', result);
    return true;
  } catch (error) {
    console.log('❌ Endpoint raíz falló:', error.message);
    return false;
  }
}

// Prueba 3: Listar archivos (sin auth)
async function testListWithoutAuth() {
  console.log('\n🧪 3. Probando listar archivos sin auth...');
  try {
    const result = await makeRequest('https://controlfile.onrender.com/api/files/list?parentId=null&pageSize=20', {
      method: 'GET'
    });
    console.log('✅ Lista sin auth:', result);
    return true;
  } catch (error) {
    console.log('❌ Lista sin auth falló:', error.message);
    return false;
  }
}

// Función principal
async function runTests() {
  console.log('🚀 Iniciando pruebas de ControlFile...\n');
  
  const healthOk = await testHealth();
  const rootOk = await testRoot();
  const listOk = await testListWithoutAuth();
  
  console.log('\n📊 Resumen de pruebas:');
  console.log(`Health Check: ${healthOk ? '✅' : '❌'}`);
  console.log(`Endpoint Raíz: ${rootOk ? '✅' : '❌'}`);
  console.log(`Lista sin Auth: ${listOk ? '✅' : '❌'}`);
  
  if (healthOk && rootOk) {
    console.log('\n🎉 ¡ControlFile está respondiendo correctamente!');
    console.log('📝 Nota: La prueba de lista sin auth debería fallar (401/403) porque requiere autenticación.');
  } else {
    console.log('\n⚠️ ControlFile no está respondiendo correctamente.');
    console.log('🔧 Verifica la URL y la configuración del backend.');
  }
}

// Ejecutar pruebas
runTests().catch(console.error);
