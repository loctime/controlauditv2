/**
 * Script para probar el registro de usuarios en ControlFile
 * Este script verifica si ControlFile tiene endpoints de registro
 */

import { auth } from './src/firebaseConfig.js';

async function testControlFileRegistration() {
  console.log('🧪 Probando registro de usuarios en ControlFile...');
  
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
    
    const baseURL = 'https://controlfile.onrender.com';
    
    // 1. Probar endpoint de health
    console.log('\n🔍 Probando endpoint /api/health...');
    try {
      const healthResponse = await fetch(`${baseURL}/api/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Health check exitoso:', healthData);
    } catch (error) {
      console.log('❌ Error en health check:', error.message);
    }
    
    // 2. Probar endpoint de perfil (debería dar 401 si no está registrado)
    console.log('\n🔍 Probando endpoint /api/user/profile...');
    try {
      const profileResponse = await fetch(`${baseURL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Usuario ya registrado en ControlFile:', profileData);
        return;
      } else {
        console.log('📋 Status:', profileResponse.status, profileResponse.statusText);
        const errorData = await profileResponse.text();
        console.log('📋 Error response:', errorData);
      }
    } catch (error) {
      console.log('❌ Error obteniendo perfil:', error.message);
    }
    
    // 3. Probar endpoint de registro (si existe)
    console.log('\n🔍 Probando endpoint /api/user/register...');
    try {
      const registerResponse = await fetch(`${baseURL}/api/user/register`, {
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
        console.log('✅ Usuario registrado exitosamente:', registerData);
      } else {
        const errorData = await registerResponse.text();
        console.log('📋 Error response:', errorData);
      }
    } catch (error) {
      console.log('❌ Error en registro:', error.message);
    }
    
    // 4. Probar endpoint de presign (debería funcionar después del registro)
    console.log('\n🔍 Probando endpoint /api/uploads/presign...');
    try {
      const presignResponse = await fetch(`${baseURL}/api/uploads/presign`, {
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
        console.log('✅ Presign exitoso:', presignData);
      } else {
        const errorData = await presignResponse.text();
        console.log('📋 Error response:', errorData);
      }
    } catch (error) {
      console.log('❌ Error en presign:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la prueba
testControlFileRegistration();
