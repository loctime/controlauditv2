// Configuración del backend
const BACKEND_CONFIG = {
  // URL del backend (ajusta según tu entorno)
  URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  
  // Endpoints de firmas digitales
  ENDPOINTS: {
    FIRMAR_DOCUMENTO: '/api/firmar-documento',
    VERIFICAR_FIRMA: '/api/verificar-firma',
    FIRMAS_DOCUMENTO: '/api/firmas-documento',
    VALIDAR_CERTIFICADO: '/api/validar-certificado',
    ESTADISTICAS_FIRMAS: '/api/estadisticas-firmas'
  },
  
  // Configuración de timeouts
  TIMEOUT: 30000, // 30 segundos
  
  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

export default BACKEND_CONFIG; 