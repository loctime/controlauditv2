// Configuración de entorno para el frontend
export const ENV_CONFIG = {
  // Backend de ControlFile (solo para subida de archivos)
  CONTROLFILE_BACKEND_URL: import.meta.env?.VITE_APP_BACKEND_URL || 'https://controlfile.onrender.com',
  
  // Backend local (para gestión de carpetas y taskbar)
  LOCAL_BACKEND_URL: import.meta.env?.VITE_APP_LOCAL_BACKEND_URL || 'http://localhost:4000',
  
  // Entorno
  IS_DEV: import.meta.env?.DEV || false,
  IS_PROD: import.meta.env?.PROD || false,
  
  // URLs por defecto según entorno
  get CONTROLFILE_BASE_URL() {
    // Para subida de archivos, usar ControlFile
    return this.CONTROLFILE_BACKEND_URL;
  },
  
  get LOCAL_BASE_URL() {
    // Para gestión de carpetas y taskbar, usar backend local
    if (this.IS_DEV) {
      return this.LOCAL_BACKEND_URL;
    }
    // En producción, usar el mismo backend de ControlFile
    return this.CONTROLFILE_BACKEND_URL;
  }
};

// Función helper para obtener la URL del backend de ControlFile (subida de archivos)
export function getControlFileUrl(path = '') {
  const baseUrl = ENV_CONFIG.CONTROLFILE_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Función helper para obtener la URL del backend local (gestión de carpetas)
export function getLocalBackendUrl(path = '') {
  const baseUrl = ENV_CONFIG.LOCAL_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Función helper para obtener la URL del backend según el tipo de operación
export function getBackendUrl(path = '', operation = 'local') {
  if (operation === 'controlfile') {
    return getControlFileUrl(path);
  }
  return getLocalBackendUrl(path);
}

// Función para obtener información del entorno (compatibilidad con backend)
export function getEnvironmentInfo() {
  return {
    nodeEnv: import.meta.env?.MODE || 'production',
    isDev: import.meta.env?.DEV || false,
    isProd: import.meta.env?.PROD || false,
    controlfileBackendUrl: ENV_CONFIG.CONTROLFILE_BACKEND_URL,
    localBackendUrl: ENV_CONFIG.LOCAL_BACKEND_URL
  };
}
