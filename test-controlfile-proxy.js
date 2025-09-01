/**
 * Script para probar el proxy de ControlFile
 * Este script verifica que el proxy del backend funcione correctamente
 */

import { auth } from './src/firebaseConfig.js';

async function testControlFileProxy() {
  console.log('🧪 Probando proxy de ControlFile...');
  
  try {
    // Verificar si hay usuario autenticado
    if (!auth.currentUser) {
      console.log('❌ No hay usuario autenticado en Firebase');
      console.log('💡 Por favor, inicia sesión en la aplicación primero');
      return;
    }
    
    const user = auth.currentUser;
    console.log('✅ Usuario autenticado:', user.email);
    
    // Obtener token de Firebase
    const token = await user.getIdToken(true);
    console.log('✅ Token obtenido:', token ? 'Válido' : 'Inválido');
    
    const proxyURL = 'https://controlauditv2.onrender.com/api/controlfile';
    
    // 1. Probar endpoint de health del proxy
    console.log('\n🔍 Probando endpoint /health del proxy...');
    try {
      const healthResponse = await fetch(`${proxyURL}/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Health check del proxy exitoso:', healthData);
    } catch (error) {
      console.log('❌ Error en health check del proxy:', error.message);
    }
    
    // 2. Probar endpoint de perfil del proxy
    console.log('\n🔍 Probando endpoint /profile del proxy...');
    try {
      const profileResponse = await fetch(`${proxyURL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Perfil obtenido del proxy:', profileData);
      } else {
        console.log('📋 Status:', profileResponse.status, profileResponse.statusText);
        const errorData = await profileResponse.text();
        console.log('📋 Error response:', errorData);
      }
    } catch (error) {
      console.log('❌ Error obteniendo perfil del proxy:', error.message);
    }
    
    // 3. Probar endpoint de registro del proxy
    console.log('\n🔍 Probando endpoint /register del proxy...');
    try {
      const registerResponse = await fetch(`${proxyURL}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName || user.email,
          uid: user.uid
        })
      });
      
      console.log('📋 Status:', registerResponse.status, registerResponse.statusText);
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        console.log('✅ Usuario registrado exitosamente a través del proxy:', registerData);
      } else {
        const errorData = await registerResponse.text();
        console.log('📋 Error response:', errorData);
      }
    } catch (error) {
      console.log('❌ Error en registro del proxy:', error.message);
    }
    
    // 4. Probar endpoint de presign del proxy
    console.log('\n🔍 Probando endpoint /presign del proxy...');
    try {
      const presignResponse = await fetch(`${proxyURL}/presign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test.jpg',
          size: 12345,
          mime: 'image/jpeg',
          parentId: null
        })
      });
      
      console.log('📋 Status:', presignResponse.status, presignResponse.statusText);
      
      if (presignResponse.ok) {
        const presignData = await presignResponse.json();
        console.log('✅ Presign exitoso a través del proxy:', presignData);
      } else {
        const errorData = await presignResponse.text();
        console.log('📋 Error response:', errorData);
      }
    } catch (error) {
      console.log('❌ Error en presign del proxy:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la prueba
testControlFileProxy();
