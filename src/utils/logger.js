/**
 * Logger centralizado para la aplicación
 * - Debug solo en development
 * - Reduce ruido de logs en producción
 * - Clasifica errores apropiadamente
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
// Flag para habilitar logs de debug en producción (temporal para depuración)
const DEBUG_LOGS_ENABLED = import.meta.env.VITE_DEBUG_LOGS === 'true' || 
                           localStorage.getItem('DEBUG_LOGS') === 'true' ||
                           window.location.search.includes('debug=true');

// Cache para evitar logs repetidos
const logCache = new Map();
const CACHE_DURATION = 5000; // 5 segundos

/**
 * Limpia logs antiguos del cache
 */
const cleanCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of logCache.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      logCache.delete(key);
    }
  }
};

/**
 * Verifica si un log debe mostrarse (evita repeticiones)
 */
const shouldLog = (key) => {
  cleanCache();
  const now = Date.now();
  const lastLog = logCache.get(key);
  
  if (!lastLog || (now - lastLog) > CACHE_DURATION) {
    logCache.set(key, now);
    return true;
  }
  return false;
};

export const logger = {
  /**
   * Log de debug (solo en development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log de debug para producción (usa console.error que NO se elimina por Terser)
   * Útil para depuración temporal en builds optimizados
   * Se puede habilitar con: VITE_DEBUG_LOGS=true, localStorage.setItem('DEBUG_LOGS', 'true'), o ?debug=true en URL
   * 
   * NOTA: Usa console.error porque es el único método que NO está en pure_funcs en vite.config.js
   */
  debugProd: (...args) => {
    if (DEBUG_LOGS_ENABLED || isDevelopment) {
      // console.error NO está en pure_funcs, así que no se elimina en producción
      // Usamos un prefijo claro para distinguirlo de errores reales
      console.error('%c[DEBUG_PROD]', 'color: #00a8ff; font-weight: bold;', ...args);
    }
  },

  /**
   * Log de información
   */
  info: (...args) => {
    if (shouldLog(`info:${args[0]}`)) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log de advertencia
   */
  warn: (...args) => {
    if (shouldLog(`warn:${args[0]}`)) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log de error
   */
  error: (...args) => {
    // Los errores siempre se muestran (no se cachean)
    console.error('[ERROR]', ...args);
  },

  /**
   * Log de éxito (info con emoji)
   */
  success: (...args) => {
    if (shouldLog(`success:${args[0]}`)) {
      console.log('✅', ...args);
    }
  },

  /**
   * Log de autosave (info con contexto)
   */
  autosave: (message, context = {}) => {
    if (shouldLog(`autosave:${message}`)) {
      if (isDevelopment) {
        console.log('[AUTOSAVE]', message, context);
      }
    }
  },

  /**
   * Log de Firestore (clasifica errores apropiadamente)
   */
  firestore: (level, message, error = null, context = {}) => {
    const isEarlyAutosave = context.isEarlyAutosave || false;
    const errorCode = error?.code || error?.message || '';

    // Durante autosave temprano, permission-denied y unauthenticated son info, no error
    if (isEarlyAutosave && (errorCode.includes('permission-denied') || errorCode.includes('unauthenticated'))) {
      if (shouldLog(`firestore:info:${message}`)) {
        logger.info(`[FIRESTORE] ${message}`, { reason: 'Contexto incompleto durante autosave temprano', errorCode });
      }
      return;
    }

    // Otros errores se manejan normalmente
    switch (level) {
      case 'error':
        logger.error(`[FIRESTORE] ${message}`, error, context);
        break;
      case 'warn':
        logger.warn(`[FIRESTORE] ${message}`, context);
        break;
      case 'info':
        if (shouldLog(`firestore:info:${message}`)) {
          logger.info(`[FIRESTORE] ${message}`, context);
        }
        break;
      default:
        if (isDevelopment) {
          logger.debug(`[FIRESTORE] ${message}`, context);
        }
    }
  },

  /**
   * Limpia el cache de logs (útil para testing)
   */
  clearCache: () => {
    logCache.clear();
  }
};

export default logger;

