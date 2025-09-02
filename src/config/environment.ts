// Configuración de entorno para ControlFile
export const ENV_CONFIG = {
  // Backend de ControlFile
  BACKEND_URL: import.meta.env.VITE_APP_BACKEND_URL || 'https://api.controldoc.app',
  
  // Entorno
  IS_DEV: import.meta.env.DEV || false,
  IS_PROD: import.meta.env.PROD || false,
  
  // URLs por defecto según entorno
  get BACKEND_BASE_URL() {
    if (this.IS_DEV) {
      return 'http://localhost:3001';
    }
    return this.BACKEND_URL;
  }
};

// Función helper para obtener la URL del backend
export function getBackendUrl(path: string = ''): string {
  const baseUrl = ENV_CONFIG.BACKEND_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
