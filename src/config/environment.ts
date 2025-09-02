// Configuración de entorno para ControlFile
export const ENV_CONFIG = {
  // Backend de ControlFile
  BACKEND_URL: (import.meta as any).env?.VITE_APP_BACKEND_URL || 'https://controlfile.onrender.com',
  
  // Entorno
  IS_DEV: (import.meta as any).env?.DEV || false,
  IS_PROD: (import.meta as any).env?.PROD || false,
  
  // URLs por defecto según entorno
  get BACKEND_BASE_URL() {
    // Debug: Log de configuración
    console.log('🔧 Configuración de entorno:', {
      VITE_APP_BACKEND_URL: (import.meta as any).env?.VITE_APP_BACKEND_URL,
      IS_DEV: this.IS_DEV,
      IS_PROD: this.IS_PROD,
      BACKEND_URL: this.BACKEND_URL,
      'import.meta.env keys': Object.keys((import.meta as any).env || {}),
      'import.meta.env values': Object.fromEntries(
        Object.entries((import.meta as any).env || {}).filter(([key]) => key.startsWith('VITE_'))
      )
    });
    
    // Siempre usar el backend remoto de ControlFile
    return this.BACKEND_URL;
  }
};

// Función helper para obtener la URL del backend
export function getBackendUrl(path: string = ''): string {
  const baseUrl = ENV_CONFIG.BACKEND_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
