#!/usr/bin/env node

/**
 * Script para forzar el redeploy del backend en Render
 * Uso: node redeploy-backend.js
 */

import fetch from 'node-fetch';

const RENDER_API_TOKEN = process.env.RENDER_API_TOKEN;
const SERVICE_ID = process.env.RENDER_SERVICE_ID || 'controlaudit-backend';

async function redeployBackend() {
  if (!RENDER_API_TOKEN) {
    console.error('❌ Error: RENDER_API_TOKEN no está configurado');
    console.log('💡 Para configurar:');
    console.log('1. Ve a https://render.com/dashboard');
    console.log('2. Ve a Account > API Keys');
    console.log('3. Crea un nuevo API key');
    console.log('4. Configura la variable de entorno: export RENDER_API_TOKEN=tu_token');
    return;
  }

  try {
    console.log('🚀 Iniciando redeploy del backend...');
    
    const response = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clearCache: 'do_not_clear'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Redeploy iniciado exitosamente');
      console.log('📋 Deploy ID:', result.id);
      console.log('🔗 URL del servicio:', `https://${result.service.name}.onrender.com`);
      console.log('⏱️  Estado:', result.status);
    } else {
      const error = await response.text();
      console.error('❌ Error iniciando redeploy:', error);
    }
  } catch (error) {
    console.error('💥 Error de conexión:', error.message);
  }
}

// Ejecutar el redeploy
redeployBackend();
