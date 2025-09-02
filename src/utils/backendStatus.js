// src/utils/backendStatus.js
import { getBackendUrl, getEnvironmentInfo } from '../config/environment.ts';

export class BackendStatus {
  constructor() {
    this.baseURL = getBackendUrl();
    this.envInfo = getEnvironmentInfo();
  }

  // Obtener información del estado actual
  getCurrentStatus() {
    return {
      frontend: {
        hostname: this.envInfo.hostname,
        environment: this.envInfo.environment,
        backendUrl: this.envInfo.backendUrl
      },
      backend: {
        expectedUrl: this.baseURL,
        expectedEnvironment: this.envInfo.environment === 'production' ? 'production' : 'development'
      },
      recommendations: this.getRecommendations()
    };
  }

  // Generar recomendaciones basadas en el entorno
  getRecommendations() {
    const recommendations = [];
    
    if (this.envInfo.environment === 'production') {
      recommendations.push('✅ Frontend en modo producción');
      recommendations.push('💡 El backend debe estar en: ' + this.baseURL);
      recommendations.push('💡 El backend debe tener NODE_ENV=production');
      recommendations.push('💡 Verifica que el backend esté desplegado en Render.com');
    } else if (this.envInfo.environment === 'development') {
      recommendations.push('🔧 Frontend en modo desarrollo');
      recommendations.push('💡 El backend debe estar en: http://localhost:4000');
      recommendations.push('💡 Ejecuta: cd backend && npm run dev');
    } else {
      recommendations.push('⚠️ Entorno desconocido: ' + this.envInfo.environment);
      recommendations.push('💡 Verifica la configuración del entorno');
    }

    return recommendations;
  }

  // Verificar si el backend debería estar disponible
  shouldBackendBeAvailable() {
    return this.envInfo.environment === 'production' || this.envInfo.environment === 'development';
  }

  // Obtener URL esperada del backend
  getExpectedBackendUrl() {
    return this.baseURL;
  }

  // Verificar si estamos en el entorno correcto
  isEnvironmentCorrect() {
    const currentEnv = this.envInfo.environment;
    const hostname = this.envInfo.hostname;
    
    // Verificar que el hostname coincida con el entorno
    if (currentEnv === 'production') {
      return hostname === 'auditoria.controldoc.app' || 
             hostname === 'controlauditv2.onrender.com' ||
             hostname === 'controlaudit.app';
    }
    
    if (currentEnv === 'development') {
      return hostname === 'localhost' || hostname === '127.0.0.1';
    }
    
    return true; // Para otros entornos
  }

  // Generar reporte de estado
  generateStatusReport() {
    const status = this.getCurrentStatus();
    const isCorrect = this.isEnvironmentCorrect();
    const shouldBeAvailable = this.shouldBackendBeAvailable();
    
    return {
      ...status,
      diagnostics: {
        environmentCorrect: isCorrect,
        backendShouldBeAvailable: shouldBeAvailable,
        expectedBackendUrl: this.getExpectedBackendUrl()
      },
      troubleshooting: this.getTroubleshootingSteps()
    };
  }

  // Pasos de solución de problemas
  getTroubleshootingSteps() {
    const steps = [];
    
    if (!this.isEnvironmentCorrect()) {
      steps.push('❌ El entorno no coincide con el hostname');
      steps.push('💡 Verifica la configuración en src/config/environment.js');
    }
    
    if (this.envInfo.environment === 'production') {
      steps.push('🔧 Para producción:');
      steps.push('   1. Verifica que el backend esté desplegado en Render.com');
      steps.push('   2. Verifica que tenga NODE_ENV=production');
      steps.push('   3. Verifica las variables de entorno de Firebase');
      steps.push('   4. Verifica la configuración CORS');
    } else if (this.envInfo.environment === 'development') {
      steps.push('🔧 Para desarrollo:');
      steps.push('   1. Ejecuta: cd backend && npm run dev');
      steps.push('   2. Verifica que esté en http://localhost:4000');
      steps.push('   3. Verifica las variables de entorno locales');
    }
    
    return steps;
  }
}

export default BackendStatus; 