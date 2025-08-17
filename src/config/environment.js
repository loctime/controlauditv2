// Configuración de entorno para el frontend
const getEnvironmentConfig = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Configuración base
  const baseConfig = {
    // URLs del backend por entorno
    backend: {
      development: 'http://localhost:4000',
      production: 'https://controlauditv2.onrender.com',
      staging: 'https://controlauditv2-staging.onrender.com'
    },
    
    // Configuración de la aplicación
    app: {
      name: 'ControlAudit',
      version: '2.0.0'
    }
  };
  
  // Detectar entorno
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      ...baseConfig,
      environment: 'development',
      backendUrl: baseConfig.backend.development
    };
  }
  
  // Subdominios de controldoc.app
  if (hostname.endsWith('controldoc.app')) {
    // Configuración específica por subdominio
    if (hostname === 'auditoria.controldoc.app') {
      return {
        ...baseConfig,
        environment: 'production',
        backendUrl: baseConfig.backend.production,
        app: {
          ...baseConfig.app,
          name: 'ControlAudit - Auditoría'
        }
      };
    }
    
    if (hostname === 'cliente.controldoc.app') {
      return {
        ...baseConfig,
        environment: 'production',
        backendUrl: baseConfig.backend.production,
        app: {
          ...baseConfig.app,
          name: 'ControlAudit - Cliente'
        }
      };
    }
    
    if (hostname === 'demo.controldoc.app') {
      return {
        ...baseConfig,
        environment: 'staging',
        backendUrl: baseConfig.backend.staging,
        app: {
          ...baseConfig.app,
          name: 'ControlAudit - Demo'
        }
      };
    }
    
    // Configuración por defecto para otros subdominios
    return {
      ...baseConfig,
      environment: 'production',
      backendUrl: baseConfig.backend.production
    };
  }
  
  // Otros dominios de producción
  if (hostname.includes('vercel.app') || hostname.includes('controlaudit.app')) {
    return {
      ...baseConfig,
      environment: 'production',
      backendUrl: baseConfig.backend.production
    };
  }
  
  if (hostname.includes('onrender.com')) {
    return {
      ...baseConfig,
      environment: 'production',
      backendUrl: `${protocol}//${hostname}`
    };
  }
  
  // Fallback
  return {
    ...baseConfig,
    environment: 'production',
    backendUrl: process.env.REACT_APP_BACKEND_URL || baseConfig.backend.production
  };
};

export const config = getEnvironmentConfig();
export const getBackendUrl = () => config.backendUrl;
export const getEnvironment = () => config.environment;

// Función para obtener información del entorno actual
export const getEnvironmentInfo = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  return {
    hostname,
    protocol,
    port,
    environment: config.environment,
    backendUrl: config.backendUrl,
    appName: config.app.name
  };
}; 