import { getBackendUrl, getConfig } from './environment.js';

// Configuración del backend usando el sistema flexible
const BACKEND_CONFIG = {
  // URL del backend (detectada automáticamente según el entorno)
  URL: getBackendUrl(),
  
  // Endpoints de firmas digitales
  ENDPOINTS: {
    FIRMAR_DOCUMENTO: '/api/firmar-documento',
    VERIFICAR_FIRMA: '/api/verificar-firma',
    FIRMAS_DOCUMENTO: '/api/firmas-documento',
    VALIDAR_CERTIFICADO: '/api/validar-certificado',
    ESTADISTICAS_FIRMAS: '/api/estadisticas-firmas',
    
    // Endpoints de gestión de usuarios
    CREAR_USUARIO: '/api/usuarios',
    LISTAR_USUARIOS: '/api/usuarios',
    ACTUALIZAR_USUARIO: '/api/usuarios',
    ELIMINAR_USUARIO: '/api/usuarios',
    CAMBIAR_ROL: '/api/set-role'
  },
  
  // Configuración de timeouts
  TIMEOUT: getConfig('backend.timeout') || 30000,
  
  // Configuración de reintentos
  MAX_RETRIES: getConfig('backend.maxRetries') || 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // Configuración de headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export default BACKEND_CONFIG; 