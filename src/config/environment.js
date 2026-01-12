// Sistema de configuración flexible para múltiples entornos y subdominios
// Detecta automáticamente el entorno basado en el hostname

const getEnvironmentConfig = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Configuración base
  const baseConfig = {
    // Configuración de Firebase (común para todos los entornos)
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    },
    
    // Configuración de la aplicación
    app: {
      name: 'ControlAudit',
      version: '1.0.0',
      environment: 'production'
    }
  };

  // Configuración específica por entorno
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Desarrollo local
    return {
      ...baseConfig,
      app: {
        ...baseConfig.app,
        name: 'ControlAudit - Desarrollo',
        environment: 'development'
      },
      backend: {
        url: 'http://localhost:4000',
        timeout: 30000,
        maxRetries: 3
      },
      features: {
        debugMode: true,
        enableLogs: true,
        enableAnalytics: false
      }
    };
  }
  
  if (hostname === 'demo.controlaudit.app') {
    // Entorno de demostración
    // ⚠️ PRODUCCIÓN: Usar rutas relativas, Vercel hace rewrite a ControlAudit backend
    return {
      ...baseConfig,
      app: {
        ...baseConfig.app,
        name: 'ControlAudit - Demo',
        environment: 'demo'
      },
      backend: {
        url: '', // Rutas relativas /api/* → Vercel rewrite → ControlAudit backend
        timeout: 30000,
        maxRetries: 3
      },
      features: {
        debugMode: true,
        enableLogs: true,
        enableAnalytics: false,
        demoMode: true
      }
    };
  }
  
  if (hostname === 'cliente.controlaudit.app') {
    // Entorno de clientes
    // ⚠️ PRODUCCIÓN: Usar rutas relativas, Vercel hace rewrite a ControlAudit backend
    return {
      ...baseConfig,
      app: {
        ...baseConfig.app,
        name: 'ControlAudit - Cliente',
        environment: 'client'
      },
      backend: {
        url: '', // Rutas relativas /api/* → Vercel rewrite → ControlAudit backend
        timeout: 30000,
        maxRetries: 3
      },
      features: {
        debugMode: false,
        enableLogs: true,
        enableAnalytics: true,
        clientMode: true
      }
    };
  }
  
  if (hostname === 'controlaudit.app' || hostname === 'www.controlaudit.app') {
    // Entorno principal de producción
    // ⚠️ PRODUCCIÓN: Usar rutas relativas, Vercel hace rewrite a ControlAudit backend
    return {
      ...baseConfig,
      app: {
        ...baseConfig.app,
        name: 'ControlAudit',
        environment: 'production'
      },
      backend: {
        url: '', // Rutas relativas /api/* → Vercel rewrite → ControlAudit backend
        timeout: 30000,
        maxRetries: 3
      },
      features: {
        debugMode: false,
        enableLogs: true,
        enableAnalytics: true
      }
    };
  }
  
  if (hostname === 'controlaudit.vercel.app') {
    // Entorno de Vercel (staging)
    // ⚠️ PRODUCCIÓN: Usar rutas relativas, Vercel hace rewrite a ControlAudit backend
    return {
      ...baseConfig,
      app: {
        ...baseConfig.app,
        name: 'ControlAudit - Vercel',
        environment: 'staging'
      },
      backend: {
        url: '', // Rutas relativas /api/* → Vercel rewrite → ControlAudit backend
        timeout: 30000,
        maxRetries: 3
      },
      features: {
        debugMode: true,
        enableLogs: true,
        enableAnalytics: false
      }
    };
  }
  
  if (hostname === 'auditoria.controldoc.app' || hostname === 'controlauditv2.onrender.com') {
    // Entorno de Render
    // ⚠️ PRODUCCIÓN: Usar rutas relativas, Vercel hace rewrite a ControlAudit backend
    return {
      ...baseConfig,
      app: {
        ...baseConfig.app,
        name: 'ControlAudit - Render',
        environment: 'production'
      },
      backend: {
        url: '', // Rutas relativas /api/* → Vercel rewrite → ControlAudit backend
        timeout: 30000,
        maxRetries: 3
      },
      features: {
        debugMode: false,
        enableLogs: true,
        enableAnalytics: true
      }
    };
  }
  
  // Configuración por defecto (fallback)
  // ⚠️ Si no es desarrollo local, usar rutas relativas (asume producción)
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  return {
    ...baseConfig,
    app: {
      ...baseConfig.app,
      name: 'ControlAudit - Desconocido',
      environment: 'unknown'
    },
    backend: {
      url: isDevelopment 
        ? (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000')
        : '', // Producción: rutas relativas
      timeout: 30000,
      maxRetries: 3
    },
    features: {
      debugMode: false,
      enableLogs: true,
      enableAnalytics: false
    }
  };
};

// Configuración global
const config = getEnvironmentConfig();

// Función para obtener configuración específica
export const getConfig = (key) => {
  const keys = key.split('.');
  let value = config;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
};

// Función para verificar si estamos en un entorno específico
export const isEnvironment = (environment) => {
  return config.app.environment === environment;
};

// Función para verificar si una característica está habilitada
export const isFeatureEnabled = (feature) => {
  return config.features[feature] === true;
};

// Función para obtener la URL del backend
// ⚠️ ARQUITECTURA IAM/Core:
// - Desarrollo local: devuelve URL absoluta (http://localhost:4000)
// - Producción: devuelve '' (rutas relativas /api/* → Vercel rewrite → ControlAudit backend)
// - El frontend NO debe conocer URLs de backend en producción
// - ControlFile solo es llamado desde el backend de ControlAudit
export const getBackendUrl = () => {
  return config.backend.url;
};

// Función para obtener la configuración de Firebase
export const getFirebaseConfig = () => {
  return config.firebase;
};

// Función para obtener información del entorno actual
export const getEnvironmentInfo = () => {
  return {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    environment: config.app.environment,
    appName: config.app.name,
    backendUrl: config.backend.url
  };
};

// Exportar configuración completa
export default config; 