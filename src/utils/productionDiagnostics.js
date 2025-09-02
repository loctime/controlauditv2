// Utilidades para diagnosticar problemas en producción
export class ProductionDiagnostics {
  constructor() {
    this.hostname = window.location.hostname;
    this.protocol = window.location.protocol;
    this.port = window.location.port;
    this.userAgent = navigator.userAgent;
    this.platform = navigator.platform;
  }

  // Diagnóstico básico del entorno
  getEnvironmentDiagnosis() {
    const diagnosis = {
      hostname: this.hostname,
      protocol: this.protocol,
      port: this.port,
      userAgent: this.userAgent,
      platform: this.platform,
      isLocalhost: this.hostname === 'localhost' || this.hostname === '127.0.0.1',
      isProduction: this.hostname.includes('controldoc.app') || this.hostname.includes('vercel.app'),
      isVercel: this.hostname.includes('vercel.app'),
      isControlDoc: this.hostname.includes('controldoc.app'),
      timestamp: new Date().toISOString()
    };

    // Detectar problemas comunes
    diagnosis.issues = this.detectCommonIssues(diagnosis);
    diagnosis.recommendations = this.generateRecommendations(diagnosis);

    return diagnosis;
  }

  // Detectar problemas comunes
  detectCommonIssues(diagnosis) {
    const issues = [];

    // Problema de protocolo
    if (diagnosis.protocol === 'http:' && diagnosis.isProduction) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: 'El sitio está usando HTTP en lugar de HTTPS en producción',
        solution: 'Verificar configuración SSL/TLS en el dominio'
      });
    }

    // Problema de puerto
    if (diagnosis.port && diagnosis.isProduction) {
      issues.push({
        type: 'configuration',
        severity: 'medium',
        message: 'Puerto no estándar detectado en producción',
        solution: 'Verificar configuración del servidor web'
      });
    }

    // Problema de dominio
    if (diagnosis.hostname === 'auditoria.controldoc.app' && !diagnosis.isProduction) {
      issues.push({
        type: 'configuration',
        severity: 'high',
        message: 'Dominio de producción no está configurado correctamente',
        solution: 'Verificar configuración DNS y Vercel'
      });
    }

    return issues;
  }

  // Generar recomendaciones
  generateRecommendations(diagnosis) {
    const recommendations = [];

    if (diagnosis.isProduction) {
      recommendations.push('✅ El sitio está en modo producción');
      
      if (diagnosis.isControlDoc) {
        recommendations.push('✅ Dominio de ControlDoc detectado');
        recommendations.push('💡 Verificar que las variables de entorno estén configuradas');
        recommendations.push('💡 Verificar que el backend de ControlFile esté funcionando');
      }
      
      if (diagnosis.isVercel) {
        recommendations.push('✅ Desplegado en Vercel');
        recommendations.push('💡 Verificar configuración de dominio personalizado');
        recommendations.push('💡 Verificar configuración de CORS en vercel.json');
      }
    } else {
      recommendations.push('🔧 El sitio está en modo desarrollo');
      recommendations.push('💡 Usar localhost:5173 para desarrollo');
    }

    return recommendations;
  }

  // Verificar conectividad con el backend
  async checkBackendConnectivity() {
    try {
      const response = await fetch('https://controlfile.onrender.com/api/health', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: 'https://controlfile.onrender.com/api/health'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: 'https://controlfile.onrender.com/api/health'
      };
    }
  }

  // Diagnóstico completo
  async runFullDiagnosis() {
    const envDiagnosis = this.getEnvironmentDiagnosis();
    const backendConnectivity = await this.checkBackendConnectivity();

    return {
      environment: envDiagnosis,
      backend: backendConnectivity,
      summary: {
        hasIssues: envDiagnosis.issues.length > 0,
        issuesCount: envDiagnosis.issues.length,
        backendWorking: backendConnectivity.success,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Generar reporte para consola
  logDiagnosis() {
    const diagnosis = this.getEnvironmentDiagnosis();
    
    console.group('🔍 DIAGNÓSTICO DE PRODUCCIÓN');
    console.log('Entorno:', diagnosis);
    
    if (diagnosis.issues.length > 0) {
      console.group('❌ PROBLEMAS DETECTADOS:');
      diagnosis.issues.forEach(issue => {
        console.error(`${issue.severity.toUpperCase()}: ${issue.message}`);
        console.log('Solución:', issue.solution);
      });
      console.groupEnd();
    }
    
    console.group('💡 RECOMENDACIONES:');
    diagnosis.recommendations.forEach(rec => console.log(rec));
    console.groupEnd();
    
    console.groupEnd();
  }
}

// Función helper para diagnóstico rápido
export function quickDiagnosis() {
  const diagnostics = new ProductionDiagnostics();
  diagnostics.logDiagnosis();
  return diagnostics.getEnvironmentDiagnosis();
}
