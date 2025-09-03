// Optimización de importaciones de Utilities
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar Axios de forma lazy
export const loadAxios = async () => {
  const axios = await import('axios');
  return axios.default;
};

// Función para cargar Date-fns de forma lazy
export const loadDateFns = async () => {
  const { format, parseISO, addDays, subDays, startOfDay, endOfDay, differenceInDays } = await import('date-fns');
  return { format, parseISO, addDays, subDays, startOfDay, endOfDay, differenceInDays };
};

// Función para cargar Day.js de forma lazy
export const loadDayJS = async () => {
  const dayjs = await import('dayjs');
  return dayjs.default;
};

// Función para cargar UUID de forma lazy
export const loadUUID = async () => {
  const { v4: uuidv4, v1: uuidv1 } = await import('uuid');
  return { uuidv4, uuidv1 };
};

// Configuración optimizada para Axios
export const getAxiosConfig = async (options = {}) => {
  const axios = await loadAxios();
  
  const defaultConfig = {
    baseURL: process.env.REACT_APP_API_URL || 'https://controlfile.onrender.com',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  };
  
  // Crear instancia de axios con configuración
  const axiosInstance = axios.create(defaultConfig);
  
  // Interceptor de solicitudes
  axiosInstance.interceptors.request.use(
    (config) => {
      // Agregar token de autenticación si existe
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Interceptor de respuestas
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Manejar errores de autenticación
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  
  return axiosInstance;
};

// Configuración optimizada para Date-fns
export const getDateFnsConfig = async (options = {}) => {
  const dateFns = await loadDateFns();
  
  const defaultConfig = {
    locale: 'es',
    ...options
  };
  
  return { dateFns, config: defaultConfig };
};

// Configuración optimizada para Day.js
export const getDayJSConfig = async (options = {}) => {
  const dayjs = await loadDayJS();
  
  // Importar plugins necesarios
  const utc = await import('dayjs/plugin/utc');
  const timezone = await import('dayjs/plugin/timezone');
  const localeData = await import('dayjs/plugin/localeData');
  const relativeTime = await import('dayjs/plugin/relativeTime');
  const calendar = await import('dayjs/plugin/calendar');
  
  // Registrar plugins
  dayjs.extend(utc.default);
  dayjs.extend(timezone.default);
  dayjs.extend(localeData.default);
  dayjs.extend(relativeTime.default);
  dayjs.extend(calendar.default);
  
  const defaultConfig = {
    locale: 'es',
    timezone: 'America/New_York',
    ...options
  };
  
  return { dayjs, config: defaultConfig };
};

// Utilidades para HTTP
export const httpUtils = {
  // GET request
  get: async (url, config = {}) => {
    const axios = await getAxiosConfig();
    return axios.get(url, config);
  },
  
  // POST request
  post: async (url, data = {}, config = {}) => {
    const axios = await getAxiosConfig();
    return axios.post(url, data, config);
  },
  
  // PUT request
  put: async (url, data = {}, config = {}) => {
    const axios = await getAxiosConfig();
    return axios.put(url, data, config);
  },
  
  // DELETE request
  delete: async (url, config = {}) => {
    const axios = await getAxiosConfig();
    return axios.delete(url, config);
  },
  
  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    const axios = await getAxiosConfig();
    return axios.patch(url, data, config);
  },
  
  // Upload file
  uploadFile: async (url, file, onProgress = null) => {
    const axios = await getAxiosConfig();
    const formData = new FormData();
    formData.append('file', file);
    
    return axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },
  
  // Download file
  downloadFile: async (url, filename) => {
    const axios = await getAxiosConfig();
    const response = await axios.get(url, {
      responseType: 'blob',
    });
    
    const url2 = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url2;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url2);
  }
};

// Utilidades para fechas
export const dateUtils = {
  // Formatear fecha
  format: async (date, formatStr = 'dd/MM/yyyy') => {
    const { format } = await loadDateFns();
    return format(new Date(date), formatStr);
  },
  
  // Parsear fecha ISO
  parseISO: async (dateString) => {
    const { parseISO } = await loadDateFns();
    return parseISO(dateString);
  },
  
  // Agregar días
  addDays: async (date, days) => {
    const { addDays } = await loadDateFns();
    return addDays(new Date(date), days);
  },
  
  // Restar días
  subtractDays: async (date, days) => {
    const { subDays } = await loadDateFns();
    return subDays(new Date(date), days);
  },
  
  // Inicio del día
  startOfDay: async (date) => {
    const { startOfDay } = await loadDateFns();
    return startOfDay(new Date(date));
  },
  
  // Fin del día
  endOfDay: async (date) => {
    const { endOfDay } = await loadDateFns();
    return endOfDay(new Date(date));
  },
  
  // Diferencia en días
  differenceInDays: async (date1, date2) => {
    const { differenceInDays } = await loadDateFns();
    return differenceInDays(new Date(date1), new Date(date2));
  },
  
  // Formatear fecha con Day.js
  formatWithDayJS: async (date, formatStr = 'DD/MM/YYYY') => {
    const dayjs = await loadDayJS();
    return dayjs(date).format(formatStr);
  },
  
  // Fecha relativa con Day.js
  fromNow: async (date) => {
    const dayjs = await loadDayJS();
    return dayjs(date).fromNow();
  },
  
  // Calendario con Day.js
  calendar: async (date) => {
    const dayjs = await loadDayJS();
    return dayjs(date).calendar();
  }
};

// Utilidades para UUID
export const uuidUtils = {
  // Generar UUID v4
  generateV4: async () => {
    const { uuidv4 } = await loadUUID();
    return uuidv4();
  },
  
  // Generar UUID v1
  generateV1: async () => {
    const { uuidv1 } = await loadUUID();
    return uuidv1();
  },
  
  // Generar ID corto
  generateShortId: () => {
    return Math.random().toString(36).substr(2, 9);
  },
  
  // Generar ID numérico
  generateNumericId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

// Utilidades para localStorage
export const storageUtils = {
  // Guardar en localStorage
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },
  
  // Obtener de localStorage
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  // Remover de localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  // Limpiar localStorage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
  
  // Verificar si existe en localStorage
  has: (key) => {
    return localStorage.getItem(key) !== null;
  }
};

// Utilidades para sessionStorage
export const sessionStorageUtils = {
  // Guardar en sessionStorage
  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
      return false;
    }
  },
  
  // Obtener de sessionStorage
  get: (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  },
  
  // Remover de sessionStorage
  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
      return false;
    }
  },
  
  // Limpiar sessionStorage
  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  },
  
  // Verificar si existe en sessionStorage
  has: (key) => {
    return sessionStorage.getItem(key) !== null;
  }
};

// Utilidades para cookies
export const cookieUtils = {
  // Establecer cookie
  set: (name, value, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  },
  
  // Obtener cookie
  get: (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
  
  // Remover cookie
  remove: (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

// Utilidades para validación
export const validationUtils = {
  // Validar email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validar URL
  isValidURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // Validar número
  isValidNumber: (value) => {
    return !isNaN(value) && isFinite(value);
  },
  
  // Validar teléfono
  isValidPhone: (phone) => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone);
  },
  
  // Validar contraseña
  isValidPassword: (password) => {
    return password.length >= 8;
  }
};

// Utilidades para formateo
export const formatUtils = {
  // Formatear número
  formatNumber: (number, locale = 'es-ES', options = {}) => {
    return new Intl.NumberFormat(locale, options).format(number);
  },
  
  // Formatear moneda
  formatCurrency: (amount, currency = 'USD', locale = 'es-ES') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  
  // Formatear porcentaje
  formatPercent: (value, locale = 'es-ES') => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value / 100);
  },
  
  // Formatear fecha
  formatDate: (date, locale = 'es-ES', options = {}) => {
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
  },
  
  // Formatear tamaño de archivo
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};
