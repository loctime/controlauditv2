// Configuración de API para ControlAudit
export const API_CONFIG = {
  // Backend compartido como API principal
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || 'https://controlfile.onrender.com',
  
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
    
      // Forzamos producción para APK
  return 'production';
    
    // Detectar producción en controldoc.app
    if (hostname.endsWith('controldoc.app') || hostname.includes('vercel.app') || hostname.includes('render.com')) {
      return 'production';
    }
  }
  
  // Por defecto, asumir desarrollo en Node.js
  return 'development';
};

// Configuración específica por entorno
export const getEnvironmentConfig = () => {
  const env = getEnvironment();
  
  // Forzamos producción para APK
  return {
    baseURL: 'https://controlfile.onrender.com',
    timeout: API_CONFIG.timeout
  };
  
  // En producción, usar la configuración de ControlFile
  return {
    baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_BACKEND_URL) || 'https://controlfile.onrender.com',
    timeout: API_CONFIG.timeout
  };
};
