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
  }
};

export default logger;