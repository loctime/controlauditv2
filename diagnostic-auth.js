#!/usr/bin/env node

/**
 * Script de diagnóstico completo para problemas de autenticación
 * Uso: node diagnostic-auth.js
 */

async function diagnosticAuth() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE AUTENTICACIÓN');
  console.log('==========================================');
  console.log('');

  const backendUrl = 'https://controlauditv2.onrender.com';
  
  try {
    // 1. Verificar conectividad básica
    console.log('1️⃣ VERIFICANDO CONECTIVIDAD BÁSICA');
    console.log('-----------------------------------');
    
    const healthResponse = await fetch(`${backendUrl}/`);
    console.log('📡 Health check:', healthResponse.status, healthResponse.statusText);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend funcionando:', healthData);
    } else {
      console.log('❌ Backend no responde correctamente');
      return;
    }
    console.log('');

    // 2. Verificar endpoints protegidos sin token
    console.log('2️⃣ VERIFICANDO ENDPOINTS PROTEGIDOS SIN TOKEN');
    console.log('-----------------------------------------------');
    
    const endpoints = [
      { name: 'Perfil de usuario', url: '/api/user/profile', method: 'GET' },
      { name: 'Presign de uploads', url: '/api/uploads/presign', method: 'POST', body: { fileName: 'test.jpg', fileType: 'image/jpeg' } }
    ];

    for (const endpoint of endpoints) {
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`${backendUrl}${endpoint.url}`, options);
      console.log(`📡 ${endpoint.name}: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        console.log('✅ Correcto: Endpoint requiere autenticación');
      } else {
        console.log('⚠️ Inesperado: Endpoint no requiere autenticación');
      }
    }
    console.log('');

    // 3. Verificar endpoints con token inválido
    console.log('3️⃣ VERIFICANDO ENDPOINTS CON TOKEN INVÁLIDO');
    console.log('---------------------------------------------');
    
    for (const endpoint of endpoints) {
      const options = {
        method: endpoint.method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_token_here'
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`${backendUrl}${endpoint.url}`, options);
      console.log(`📡 ${endpoint.name}: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        console.log('✅ Correcto: Backend rechaza tokens inválidos');
      } else {
        console.log('⚠️ Inesperado: Backend acepta tokens inválidos');
      }
    }
    console.log('');

    // 4. Verificar configuración de CORS
    console.log('4️⃣ VERIFICANDO CONFIGURACIÓN DE CORS');
    console.log('-------------------------------------');
    
    const corsResponse = await fetch(`${backendUrl}/api/user/profile`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://auditoria.controldoc.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });
    
    console.log('📡 CORS preflight:', corsResponse.status, corsResponse.statusText);
    console.log('🔧 CORS headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
    });
    console.log('');

    // 5. Análisis del problema
    console.log('5️⃣ ANÁLISIS DEL PROBLEMA');
    console.log('-------------------------');
    console.log('🔍 Basándome en los errores que mencionaste:');
    console.log('   • Error 401 en /api/user/profile');
    console.log('   • Error 401 en /api/uploads/presign');
    console.log('   • Error de Firestore Listen');
    console.log('');
    console.log('💡 POSIBLES CAUSAS:');
    console.log('   1. Token de Firebase expirado o inválido');
    console.log('   2. Problema de sincronización entre frontend y backend');
    console.log('   3. Configuración incorrecta de Firebase Admin SDK');
    console.log('   4. Problema de CORS en el navegador');
    console.log('   5. Bloqueo por adblocker o extensiones del navegador');
    console.log('');
    console.log('🛠️ SOLUCIONES RECOMENDADAS:');
    console.log('   1. Cerrar sesión y volver a iniciar sesión');
    console.log('   2. Limpiar caché del navegador');
    console.log('   3. Deshabilitar extensiones del navegador temporalmente');
    console.log('   4. Verificar que el usuario existe en Firestore');
    console.log('   5. Revisar logs del backend para más detalles');
    console.log('');

    // 6. Verificar configuración de Firebase
    console.log('6️⃣ VERIFICANDO CONFIGURACIÓN DE FIREBASE');
    console.log('----------------------------------------');
    console.log('🔧 Configuración actual:');
    console.log('   • Project ID: auditoria-f9fc4');
    console.log('   • Backend URL: https://controlauditv2.onrender.com');
    console.log('   • Environment: production');
    console.log('');
    console.log('⚠️ NOTA: El backend está configurado para desarrollo pero corriendo en producción');
    console.log('   Esto puede causar problemas de configuración.');
    console.log('');

  } catch (error) {
    console.error('💥 Error en el diagnóstico:', error);
    console.error('🔍 Detalles:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Ejecutar el diagnóstico
diagnosticAuth();
