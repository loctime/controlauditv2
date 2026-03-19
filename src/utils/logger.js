const LEVELS = {
  debug: 4,
  info: 3,
  warn: 2,
  error: 1,
  none: 0
};

// En desarrollo, si no configuras VITE_LOG_LEVEL, asumimos debug para ver trazas.
const envLogLevel = import.meta.env.VITE_LOG_LEVEL;
const rawLevel = (envLogLevel || (import.meta.env.DEV ? 'debug' : 'error')).toLowerCase();
const activeLevel = Object.prototype.hasOwnProperty.call(LEVELS, rawLevel) ? rawLevel : 'error';

const shouldLog = (level) => LEVELS[activeLevel] >= LEVELS[level];

const logger = {
  debug: (...args) => {
    if (shouldLog('debug')) {
      // Usar console.log en vez de console.debug para que no dependa del filtro del navegador.
      console.log(...args);
    }
  },

  // Debug solo en producción (alias).
  debugProd: (...args) => {
    if (!import.meta.env.PROD) return;
    if (shouldLog('debug')) {
      console.log('[PROD]', ...args);
    }
  },

  info: (...args) => {
    if (shouldLog('info')) {
      // Usar console.log para que sea visible incluso si console.info está filtrado.
      console.log(...args);
    }
  },

  warn: (...args) => {
    if (shouldLog('warn')) {
      console.warn(...args);
    }
  },

  error: (...args) => {
    if (shouldLog('error')) {
      console.error(...args);
    }
  },

  // Alias para mensajes de autoguardado/autosave.
  // Se registra como `info` para respetar VITE_LOG_LEVEL.
  autosave: (...args) => {
    if (shouldLog('info')) {
      console.log('[AUTOSAVE]', ...args);
    }
  },

  // Helper específico para logging de Firestore.
  // Usado con la firma: logger.firestore(level, message, error?, meta?)
  firestore: (level, message, error, meta) => {
    const normalizedLevel =
      level === 'debug' || level === 'info' || level === 'warn' || level === 'error'
        ? level
        : 'error';

    if (!shouldLog(normalizedLevel)) return;

    const payload = meta !== undefined ? meta : undefined;
    // Mantener una salida consistente para que sea fácil de leer en consola.
    const args = payload !== undefined ? [message, error, payload] : [message, error];

    if (normalizedLevel === 'debug') return console.log('[FIRESTORE]', ...args);
    if (normalizedLevel === 'info') return console.log('[FIRESTORE]', ...args);
    if (normalizedLevel === 'warn') return console.warn('[FIRESTORE]', ...args);
    return console.error('[FIRESTORE]', ...args);
  }
};

export default logger;