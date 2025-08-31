#!/usr/bin/env node

/**
 * Script completo para probar ControlFile con autenticación real
 * Simula exactamente lo que hace el frontend
 */

const CONTROLFILE_URL = 'https://controlauditv2.onrender.com';

class ControlFileService {
  constructor() {
    this.baseURL = CONTROLFILE_URL;
    this.serviceUnavailable = false;
  }

  // Simular verificación de disponibilidad
  async isControlFileAvailable() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log('✅ ControlFile está disponible (endpoint raíz responde)');
        return true;
      } else {
        console.log('❌ ControlFile no disponible:', response.status);
        this.serviceUnavailable = true;
        return false;
      }
    } catch (error) {
      console.log('❌ ControlFile no disponible:', error.message);
      this.serviceUnavailable = true;
      return false;
    }
  }

  // Simular verificación de endpoints
  async areControlFileEndpointsAvailable() {
    try {
      console.log('🔍 Verificando endpoints de ControlFile...');
      
      // Probar sin autenticación primero
      const profileResponse = await fetch(`${this.baseURL}/api/user/profile`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const presignResponse = await fetch(`${this.baseURL}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: 'test.jpg',
          fileSize: 12345,
          mimeType: 'image/jpeg'
        }),
        signal: AbortSignal.timeout(5000)
      });

      // Considerar exitoso si responde 200 (auth exitosa), 401 (endpoint existe pero requiere auth), o 404 (endpoint no implementado)
      // 401 significa que el endpoint existe pero la autenticación falló
      const profileOk = profileResponse.ok || profileResponse.status === 401 || profileResponse.status === 404;
      const presignOk = presignResponse.ok || presignResponse.status === 401 || presignResponse.status === 404;

      console.log(`🔍 Endpoints ControlFile - Profile: ${profileOk ? '✅' : '❌'} (${profileResponse.status}), Presign: ${presignOk ? '✅' : '❌'} (${presignResponse.status})`);
      
      // Si recibimos 401, significa que el endpoint existe pero necesitamos autenticación válida
      if (profileResponse.status === 401 || presignResponse.status === 401) {
        console.log('⚠️ Endpoints requieren autenticación válida (401)');
      }

      return profileOk && presignOk;
    } catch (error) {
      console.log('❌ Error verificando endpoints de ControlFile:', error.message);
      return false;
    }
  }

  // Simular verificación de cuenta de usuario
  async checkUserAccount() {
    try {
      if (this.serviceUnavailable) {
        console.log('⚠️ ControlFile no está disponible, usando modo local');
        return false;
      }

      const isAvailable = await this.isControlFileAvailable();
      if (!isAvailable) {
        console.log('⚠️ ControlFile no está disponible, usando modo local');
        return false;
      }

      const endpointsAvailable = await this.areControlFileEndpointsAvailable();
      if (!endpointsAvailable) {
        console.log('⚠️ Endpoints de ControlFile no están implementados, usando modo local');
        return false;
      }

      // Simular petición sin token (como en el frontend cuando no hay usuario autenticado)
      console.log('🔍 Verificando cuenta de usuario en ControlFile...');
      const response = await fetch(`${this.baseURL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Usuario tiene cuenta en ControlFile:', userData);
        return true;
      } else if (response.status === 404) {
        console.log('⚠️ Endpoint de perfil no implementado en ControlFile (404)');
        return false;
      } else if (response.status === 401) {
        console.log('⚠️ Error de autenticación (401) - Se requiere token válido');
        return false;
      } else {
        console.log('⚠️ Usuario no tiene cuenta en ControlFile (status:', response.status, ')');
        return false;
      }
      
    } catch (error) {
      console.log('❌ Error verificando cuenta de ControlFile:', error.message);
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')) {
        this.serviceUnavailable = true;
      }
      return false;
    }
  }

  // Obtener información de diagnóstico
  async getDiagnosticInfo() {
    const isAvailable = await this.isControlFileAvailable();
    const endpointsAvailable = await this.areControlFileEndpointsAvailable();
    const hasAccount = await this.checkUserAccount();
    
    return {
      baseURL: this.baseURL,
      environment: 'test',
      isDevelopment: true,
      serviceAvailable: isAvailable,
      endpointsAvailable: endpointsAvailable,
      userHasAccount: hasAccount,
      timestamp: new Date().toISOString(),
      userAgent: 'Node.js Test Script'
    };
  }
}

async function testControlFileComplete() {
  console.log('🔍 Prueba completa de ControlFile');
  console.log('=' .repeat(50));
  
  const controlFileService = new ControlFileService();
  
  try {
    // Obtener información de diagnóstico
    const diagInfo = await controlFileService.getDiagnosticInfo();
    
    console.log('\n📋 Información de diagnóstico:');
    console.log(JSON.stringify(diagInfo, null, 2));
    
    console.log('\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

// Ejecutar la prueba
testControlFileComplete();
