// Sistema de logging mejorado para el backend
import { getEnvironmentInfo } from '../config/environment.js';

// Función de logging mejorada
export const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const envInfo = getEnvironmentInfo();
  
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    environment: envInfo.nodeEnv,
    message,
    ...(data && { data })
  };
  
  // En producción, usar formato JSON para mejor parsing en Render
  if (envInfo.nodeEnv === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    // En desarrollo, formato más legible
    const emoji = {
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'debug': '🔍',
      'success': '✅'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (data) {
      console.log('   📋 Data:', JSON.stringify(data, null, 2));
    }
  }
};

// Funciones de conveniencia
export const logInfo = (message, data) => log('info', message, data);
export const logSuccess = (message, data) => log('success', message, data);
export const logWarn = (message, data) => log('warn', message, data);
export const logError = (message, data) => log('error', message, data);
export const logDebug = (message, data) => log('debug', message, data);

// Middleware de logging para Express
export const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log de entrada
  logInfo(`${req.method} ${req.path} iniciado`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined
  });
  
  // Interceptar la respuesta para logging
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log de salida
    logInfo(`${req.method} ${req.path} completado`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: data ? data.length : 0
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

// Función para loggear errores de manera consistente
export const logErrorWithContext = (error, context = {}) => {
  logError('Error en la aplicación', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...context
  });
};
