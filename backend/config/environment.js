// Configuración flexible para el backend
// Detecta automáticamente el entorno basado en variables de entorno

const getEnvironmentConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || 4000;
  
  // Configuración base
  const baseConfig = {
    // Configuración del servidor
    server: {
      port: port,
      host: process.env.HOST || '0.0.0.0'
    },
    
    // Configuración de Firebase Admin
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      // Ruta al archivo de credenciales (para desarrollo local)
      serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
    },
    
    // Configuración de CORS
    cors: {
      origin: [],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    
    // Configuración de seguridad
    security: {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      bcryptRounds: 12
    },
    
    // Configuración de logs
    logging: {
      level: 'info',
      enableConsole: true,
      enableFile: false
    }
  };

  // Configuración específica por entorno
  if (nodeEnv === 'development') {
    return {
      ...baseConfig,
      cors: {
        ...baseConfig.cors,
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
          'https://auditoria.controldoc.app',
          'https://controlauditv2.onrender.com',
          'https://*.controldoc.app',
          'https://*.vercel.app',
          'https://*.onrender.com'
        ]
      },
      logging: {
        ...baseConfig.logging,
        level: 'debug',
        enableConsole: true
      }
    };
  }
  
  if (nodeEnv === 'staging') {
    return {
      ...baseConfig,
      cors: {
        ...baseConfig.cors,
        origin: [
          'https://controlaudit.vercel.app',
          'https://demo.controlaudit.app'
        ]
      },
      logging: {
        ...baseConfig.logging,
        level: 'info',
        enableConsole: true
      }
    };
  }
  
  if (nodeEnv === 'production') {
    return {
      ...baseConfig,
      cors: {
        ...baseConfig.cors,
        origin: [
          'https://controlaudit.app',
          'https://www.controlaudit.app',
          'https://cliente.controlaudit.app',
          'https://demo.controlaudit.app',
          'https://auditoria.controldoc.app',
          'https://controlauditv2.onrender.com',
          'https://*.controldoc.app',
          'https://*.vercel.app',
          'https://*.onrender.com'
        ]
      },
      logging: {
        ...baseConfig.logging,
        level: 'warn',
        enableConsole: true,
        enableFile: true
      }
    };
  }
  
  // Configuración por defecto
  return baseConfig;
};

// Configuración global
const config = getEnvironmentConfig();

// Función para obtener configuración específica
const getConfig = (key) => {
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
const isEnvironment = (environment) => {
  return process.env.NODE_ENV === environment;
};

// Función para obtener información del entorno actual
const getEnvironmentInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: config.server.port,
    host: config.server.host,
    corsOrigins: config.cors.origin
  };
};

export {
  config,
  getConfig,
  isEnvironment,
  getEnvironmentInfo
};