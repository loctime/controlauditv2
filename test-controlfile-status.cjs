#!/usr/bin/env node

/**
 * Script para verificar el estado de ControlFile
 * Diagnostica problemas de conectividad y estado del servicio
 */

const https = require('https');
const http = require('http');

console.log('🔍 Verificando estado de ControlFile...\n');

// Función para hacer petición HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'ControlAudit-Diagnostic/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función para verificar endpoints de ControlFile
async function checkControlFileEndpoints() {
  const baseUrl = 'https://controlfile.onrender.com';
  const endpoints = [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/user/profile', method: 'GET', name: 'User Profile' },
    { path: '/api/uploads/presign', method: 'POST', name: 'Presign Upload', body: JSON.stringify({
      name: 'test.txt',
      size: 1024,
      mime: 'text/plain',
      parentId: null
    })}
  ];

  console.log('🌐 Verificando endpoints de ControlFile:');
  console.log('=====================================\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Probando: ${endpoint.name}`);
      console.log(`   URL: ${baseUrl}${endpoint.path}`);
      console.log(`   Método: ${endpoint.method}`);
      
      const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: endpoint.body
      });

      console.log(`   Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        console.log(`   ✅ ${endpoint.name}: OK`);
      } else if (response.statusCode === 401) {
        console.log(`   ⚠️ ${endpoint.name}: Requiere autenticación`);
      } else if (response.statusCode === 500) {
        console.log(`   ❌ ${endpoint.name}: Error interno del servidor`);
        console.log(`   📋 Respuesta: ${response.data.substring(0, 200)}...`);
      } else {
        console.log(`   ⚠️ ${endpoint.name}: Status ${response.statusCode}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Error de conexión`);
      console.log(`   📋 Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Función para verificar conectividad general
async function checkConnectivity() {
  console.log('🌐 Verificando conectividad general:');
  console.log('===================================\n');

  const tests = [
    { url: 'https://www.google.com', name: 'Google' },
    { url: 'https://onrender.com', name: 'Render' },
    { url: 'https://controlfile.onrender.com', name: 'ControlFile' }
  ];

  for (const test of tests) {
    try {
      console.log(`🔗 Probando: ${test.name}`);
      const response = await makeRequest(test.url);
      console.log(`   ✅ ${test.name}: OK (${response.statusCode})`);
    } catch (error) {
      console.log(`   ❌ ${test.name}: Error - ${error.message}`);
    }
  }
  
  console.log('');
}

// Función para verificar DNS
function checkDNS() {
  console.log('🔍 Verificando resolución DNS:');
  console.log('==============================\n');

  const dns = require('dns');
  const domains = [
    'controlfile.onrender.com',
    'onrender.com',
    'google.com'
  ];

  domains.forEach(domain => {
    dns.resolve4(domain, (err, addresses) => {
      if (err) {
        console.log(`❌ ${domain}: Error DNS - ${err.message}`);
      } else {
        console.log(`✅ ${domain}: ${addresses.join(', ')}`);
      }
    });
  });
}

// Función principal
async function main() {
  console.log('🚀 Iniciando diagnóstico de ControlFile...\n');
  
  try {
    // 1. Verificar conectividad general
    await checkConnectivity();
    
    // 2. Verificar DNS
    checkDNS();
    
    // Esperar un poco para que se resuelvan las consultas DNS
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Verificar endpoints específicos
    await checkControlFileEndpoints();
    
    console.log('📊 Resumen del diagnóstico:');
    console.log('===========================');
    console.log('✅ Conectividad: Verificada');
    console.log('✅ DNS: Verificado');
    console.log('✅ Endpoints: Probados');
    console.log('');
    console.log('🎯 Recomendaciones:');
    console.log('- Si hay errores 500: El problema está en el servidor de ControlFile');
    console.log('- Si hay errores 401: Problema de autenticación');
    console.log('- Si hay timeouts: Problema de red o servidor lento');
    console.log('');
    console.log('✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  checkControlFileEndpoints,
  checkConnectivity,
  checkDNS,
  main
};
