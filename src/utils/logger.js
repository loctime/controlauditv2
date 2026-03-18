const LEVELS = {
  debug: 4,
  info: 3,
  warn: 2,
  error: 1,
  none: 0
};

const rawLevel = (import.meta.env.VITE_LOG_LEVEL || 'error').toLowerCase();
const activeLevel = Object.prototype.hasOwnProperty.call(LEVELS, rawLevel) ? rawLevel : 'error';

const shouldLog = (level) => LEVELS[activeLevel] >= LEVELS[level];

const logger = {
  debug: (...args) => {
    if (shouldLog('debug')) {
      console.debug(...args);
    }
  },

  // Debug solo en producción (alias).
  debugProd: (...args) => {
    if (!import.meta.env.PROD) return;
    if (shouldLog('debug')) {
      console.debug('[PROD]', ...args);
    }
  },

  info: (...args) => {
    if (shouldLog('info')) {
      console.info(...args);
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
      console.info('[AUTOSAVE]', ...args);
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

    if (normalizedLevel === 'debug') return console.debug('[FIRESTORE]', ...args);
    if (normalizedLevel === 'info') return console.info('[FIRESTORE]', ...args);
    if (normalizedLevel === 'warn') return console.warn('[FIRESTORE]', ...args);
    return console.error('[FIRESTORE]', ...args);
  }
};

export default logger;