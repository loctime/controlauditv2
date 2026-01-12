// src/utils/backendHealthCheck.js
import axios from 'axios';
import { getBackendUrl, getEnvironmentInfo } from '../config/environment.js';

class BackendHealthCheck {
  constructor() {
    // ⚠️ ARQUITECTURA: En producción, baseURL es '' (rutas relativas)
    // Solo desarrollo local tiene URL absoluta
    this.baseURL = getBackendUrl();
    this.api = axios.create({
      baseURL: this.baseURL || '/api', // Producción: '/api', Desarrollo: URL absoluta
      timeout: 10000,
    });
  }

  // Verificar conectividad básica
  async checkConnectivity() {
    try {
      const displayUrl = this.baseURL || '(rutas relativas /api/*)';
      console.log('🔍 Verificando conectividad con:', displayUrl);
      
      // Si baseURL está vacío (producción), usar fetch directamente con ruta relativa
      // Si baseURL tiene valor (desarrollo), usar axios con baseURL configurado
      let response;
      if (!this.baseURL) {
        // Producción: usar fetch con ruta relativa /api/health → Vercel rewrite
        const fetchResponse = await fetch('/api/health');
        response = {
          status: fetchResponse.status,
          data: await fetchResponse.json()
        };
      } else {
        // Desarrollo: usar axios con baseURL configurado
        response = await this.api.get('/health');
      }
      console.log('✅ Backend respondió:', response.data);
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        url: this.baseURL
      };
    } catch (error) {
      console.error('❌ Error de conectividad:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        url: this.baseURL,
        details: {
          isNetworkError: error.code === 'ERR_NETWORK',
          isTimeout: error.code === 'ECONNABORTED',
          isCORS: error.response?.status === 0,
          responseData: error.response?.data
        }
      };
    }
  }

  // Verificar configuración del entorno
  checkEnvironment() {
    const envInfo = getEnvironmentInfo();
    console.log('📋 Información del entorno:', envInfo);
    
    return {
      hostname: envInfo.hostname,
      environment: envInfo.environment,
      backendUrl: envInfo.backendUrl,
      protocol: envInfo.protocol,
      port: envInfo.port
    };
  }

  // Verificar endpoint específico
  async checkEndpoint(endpoint) {
    try {
      const response = await this.api.get(endpoint);
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  // Verificar si el backend está en el entorno correcto
  async checkBackendEnvironment() {
    try {
      const response = await this.api.get('/');
      return {
        success: true,
        environment: response.data.environment,
        message: response.data.message,
        version: response.data.version
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Diagnóstico completo mejorado
  async runFullDiagnostic() {
    console.log('🚀 Iniciando diagnóstico completo del backend...');
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: this.checkEnvironment(),
      connectivity: null,
      backendEnvironment: null,
      recommendations: []
    };

    // Verificar conectividad
    results.connectivity = await this.checkConnectivity();
    
    // Si hay conectividad, verificar el entorno del backend
    if (results.connectivity.success) {
      results.backendEnvironment = await this.checkBackendEnvironment();
    }

    // Generar recomendaciones
    if (!results.connectivity.success) {
      if (results.connectivity.details.isNetworkError) {
        results.recommendations.push('❌ Error de red: El servidor no está disponible o hay problemas de conectividad');
        results.recommendations.push('💡 Verifica que el backend esté ejecutándose en: ' + this.baseURL);
        results.recommendations.push('💡 Verifica tu conexión a internet');
        results.recommendations.push('💡 El backend debe estar configurado con NODE_ENV=production');
      }
      
      if (results.connectivity.details.isTimeout) {
        results.recommendations.push('⏰ Timeout: El servidor tardó demasiado en responder');
        results.recommendations.push('💡 El servidor puede estar sobrecargado');
      }
      
      if (results.connectivity.details.isCORS) {
        results.recommendations.push('🌐 Error CORS: Problema de configuración de dominios permitidos');
        results.recommendations.push('💡 Verifica la configuración CORS del backend');
        results.recommendations.push('💡 El dominio actual debe estar en la lista de orígenes permitidos');
      }
      
      if (results.connectivity.status >= 500) {
        results.recommendations.push('🔧 Error del servidor: Problema interno en el backend');
        results.recommendations.push('💡 Revisa los logs del servidor');
      }
    } else {
      results.recommendations.push('✅ Backend funcionando correctamente');
      
      // Verificar si el entorno del backend es correcto
      if (results.backendEnvironment?.success) {
        const currentEnv = results.environment.environment;
        const backendEnv = results.backendEnvironment.environment;
        
        if (currentEnv === 'production' && backendEnv !== 'production') {
          results.recommendations.push('⚠️ El backend no está en modo producción');
          results.recommendations.push('💡 Configura NODE_ENV=production en el backend');
        }
      }
    }

    console.log('📊 Resultados del diagnóstico:', results);
    return results;
  }
}

export default BackendHealthCheck; 