// Script para probar la conectividad con ControlFile
import https from 'https';

const testUrls = [
  'https://files.controldoc.app/health',
  'https://files.controldoc.app/',
  'https://api.controlfile.app/health',
  'https://api.controlfile.app/'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✅ ${url} - Status: ${res.statusCode}`);
      resolve({ url, status: res.statusCode, success: true });
    });

    req.on('error', (error) => {
      console.log(`❌ ${url} - Error: ${error.message}`);
      resolve({ url, error: error.message, success: false });
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ ${url} - Timeout`);
      req.destroy();
      resolve({ url, error: 'Timeout', success: false });
    });
  });
}

async function testAllUrls() {
  console.log('🔍 Probando conectividad con ControlFile...\n');
  
  for (const url of testUrls) {
    await testUrl(url);
  }
  
  console.log('\n📊 Resumen:');
  console.log('- files.controldoc.app: Tu dominio real');
  console.log('- api.controlfile.app: Dominio configurado por tu programador');
}

testAllUrls();
