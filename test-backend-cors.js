#!/usr/bin/env node

/**
 * Script para probar la conectividad con el backend y verificar CORS
 * Uso: node test-backend-cors.js
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'https://controlauditv2.onrender.com';

async function testBackendCORS() {
  console.log('🧪 Probando conectividad con el backend...');
  console.log('🌐 URL:', BACKEND_URL);
  console.log('');

  const tests = [
    {
      name: 'Health Check',
      url: `${BACKEND_URL}/health`,
      method: 'GET'
    },
    {
      name: 'API Health Check',
      url: `${BACKEND_URL}/api/health`,
      method: 'GET'
    },
    {
      name: 'Root Endpoint',
      url: `${BACKEND_URL}/`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    console.log(`🔍 Probando: ${test.name}`);
    console.log(`📤 ${test.method} ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Origin': 'https://auditoria.controldoc.app',
          'User-Agent': 'ControlAudit-Test/1.0'
        }
      });

      console.log(`📥 Status: ${response.status} ${response.statusText}`);
      
      // Verificar headers CORS
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      
      console.log('🔧 Headers CORS:', corsHeaders);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('✅ Respuesta:', JSON.stringify(data, null, 2));
        } catch (e) {
          const text = await response.text();
          console.log('✅ Respuesta:', text);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText);
      }
      
    } catch (error) {
      console.log('💥 Error de conexión:', error.message);
    }
    
    console.log('─'.repeat(50));
    console.log('');
  }
}

// Ejecutar las pruebas
testBackendCORS();
