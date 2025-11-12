// Interceptor de console para debug offline
// Se inicializa temprano para que siempre esté disponible, incluso si el componente OfflineDebugLogs no se monta

// Array global para almacenar logs
window.offlineDebugLogs = window.offlineDebugLogs || [];

// Cargar logs desde localStorage al iniciar (para funcionar offline)
const loadLogsFromStorage = () => {
  try {
    const savedLogs = localStorage.getItem('offline_debug_logs');
    if (savedLogs) {
      const parsed = JSON.parse(savedLogs);
      window.offlineDebugLogs = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn('Error cargando logs desde localStorage:', e);
  }
  return [];
};

// Guardar logs en localStorage (para persistir offline)
const saveLogsToStorage = (logs) => {
  try {
    // Mantener solo los últimos 50 logs para no llenar localStorage
    const logsToSave = logs.slice(-50);
    localStorage.setItem('offline_debug_logs', JSON.stringify(logsToSave));
  } catch (e) {
    console.warn('Error guardando logs en localStorage:', e);
  }
};

// Inicializar interceptores de console
export const initConsoleInterceptor = () => {
  // Cargar logs guardados al iniciar
  const savedLogs = loadLogsFromStorage();
  if (savedLogs.length > 0) {
    window.offlineDebugLogs = savedLogs;
  }

  // Guardar referencias originales si aún no están guardadas
  if (!window._originalConsoleLog) {
    window._originalConsoleLog = console.log;
    window._originalConsoleWarn = console.warn;
    window._originalConsoleError = console.error;
  }

  const addLog = (level, ...args) => {
    try {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      // Solo capturar logs relacionados con offline/empresas/cache
      if (
        message.includes('[DEBUG Auditoria]') ||
        message.includes('cache') ||
        message.includes('offline') ||
        message.includes('empresas') ||
        message.includes('IndexedDB') ||
        message.includes('localStorage') ||
        message.includes('getCompleteUserCache') ||
        message.includes('saveCompleteUserCache') ||
        message.includes('getOfflineDatabase') ||
        message.includes('Settings store') ||
        message.includes('complete_user_cache') ||
        message.includes('Chrome') ||
        message.includes('PWA') ||
        message.includes('userProfile') ||
        message.includes('CARGANDO DESDE CACHE')
      ) {
        const logEntry = {
          id: Date.now() + Math.random(),
          level,
          message,
          timestamp: new Date().toLocaleTimeString()
        };
        
        window.offlineDebugLogs.push(logEntry);
        
        // Mantener solo los últimos 50 logs
        if (window.offlineDebugLogs.length > 50) {
          window.offlineDebugLogs.shift();
        }
        
        // Guardar en localStorage para persistir offline
        saveLogsToStorage(window.offlineDebugLogs);
      }
    } catch (error) {
      // Si hay error, restaurar console original y continuar
      console.log = window._originalConsoleLog;
      console.warn = window._originalConsoleWarn;
      console.error = window._originalConsoleError;
    }
  };

  // Interceptar console.log
  console.log = (...args) => {
    window._originalConsoleLog(...args);
    addLog('log', ...args);
  };

  // Interceptar console.warn
  console.warn = (...args) => {
    window._originalConsoleWarn(...args);
    addLog('warn', ...args);
  };

  // Interceptar console.error
  console.error = (...args) => {
    window._originalConsoleError(...args);
    addLog('error', ...args);
  };
};

