const isDevelopment = import.meta.env.DEV;

const logger = {
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args) => {
    console.warn(...args);
  },

  error: (...args) => {
    console.error(...args);
  }
};

export default logger;