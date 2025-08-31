// Configuración simplificada de API para ControlFile
export const API_CONFIG = {
  // ControlFile como API principal
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTROLFILE_API_URL) || 'http://localhost:4000',
  
  // Endpoints simplificados
  endpoints: {
    upload: '/api/upload',
    files: '/api/files',
    user: '/api/user',
    health: '/api/health',
    profile: '/api/user/profile'
  },
  
  // Configuración de timeouts
  timeout: 30000,
  
  // Configuración de reintentos
  maxRetries: 3,
  retryDelay: 1000
};

// Función para obtener la URL completa del endpoint
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};

// Función para detectar el entorno
export const getEnvironment = () => {
  // Verificar si estamos en el navegador
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    
    if (hostname.endsWith('controldoc.app')) {
      return 'production';
    }
  }
  
  // Por defecto, asumir desarrollo en Node.js
  return 'development';
};

// Configuración específica por entorno
export const getEnvironmentConfig = () => {
  const env = getEnvironment();
  
  if (env === 'development') {
    return {
      baseURL: 'http://localhost:4000', // Backend local
      timeout: 10000
    };
  }
  
  return {
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout
  };
};
