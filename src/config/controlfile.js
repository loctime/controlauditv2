// Configuración centralizada para ControlFile
export const CONTROLFILE_CONFIG = {
  // URLs base
  BASE_URL: 'https://controlfile.onrender.com',
  API_BASE: 'https://controlfile.onrender.com/api',
  
  // Código de la aplicación
  APP_CODE: 'controlaudit',
  
  // Timeouts
  TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 60000,
  
  // Límites
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_UPLOAD: 10,
  
  // Endpoints
  ENDPOINTS: {
    HEALTH: '/api/health',
    USER_REGISTER: '/api/user/register',
    USER_PROFILE: '/api/user/profile',
    UPLOAD_PRESIGN: '/api/uploads/presign',
    UPLOAD_CONFIRM: '/api/uploads/confirm',
    FILES_LIST: '/api/files/list',
    FILE_PRESIGN_GET: '/api/files/{fileId}/presign-get',
    FILE_DELETE: '/api/files/{fileId}',
    FILE_RENAME: '/api/files/{fileId}/rename',
  },
  
  // Tipos de archivo permitidos
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  
  // Configuración de carpetas
  FOLDERS: {
    ROOT: null, // Se autocreará carpeta raíz "controlaudit"
    AUDITORIAS: 'auditorias',
    REPORTES: 'reportes',
    TEMPORAL: 'temporal'
  },
  
  // Configuración de metadatos
  METADATA: {
    SOURCE_APP: 'controlaudit',
    VERSION: '2.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development'
  }
};

// Funciones de utilidad para ControlFile
export const controlFileUtils = {
  // Construir URL completa
  buildUrl: (endpoint, params = {}) => {
    let url = `${CONTROLFILE_CONFIG.BASE_URL}${endpoint}`;
    
    // Reemplazar parámetros en la URL
    Object.keys(params).forEach(key => {
      url = url.replace(`{${key}}`, params[key]);
    });
    
    return url;
  },
  
  // Validar tipo de archivo
  isValidFileType: (mimeType) => {
    return CONTROLFILE_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType);
  },
  
  // Validar tamaño de archivo
  isValidFileSize: (fileSize) => {
    return fileSize <= CONTROLFILE_CONFIG.MAX_FILE_SIZE;
  },
  
  // Formatear tamaño de archivo
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Generar nombre único para archivo
  generateUniqueFileName: (originalName, timestamp = Date.now()) => {
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(`.${extension}`, '');
    return `${baseName}_${timestamp}.${extension}`;
  },
  
  // Extraer información del archivo
  extractFileInfo: (file) => {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      formattedSize: controlFileUtils.formatFileSize(file.size)
    };
  }
};

// Configuración de errores comunes
export const CONTROLFILE_ERRORS = {
  UNAUTHORIZED: 'No autorizado para acceder a ControlFile',
  FORBIDDEN: 'Acceso denegado a ControlFile',
  NOT_FOUND: 'Recurso no encontrado en ControlFile',
  TIMEOUT: 'Timeout al conectar con ControlFile',
  NETWORK_ERROR: 'Error de red al conectar con ControlFile',
  INVALID_FILE: 'Archivo no válido para ControlFile',
  UPLOAD_FAILED: 'Error al subir archivo a ControlFile',
  QUOTA_EXCEEDED: 'Cuota de almacenamiento excedida en ControlFile'
};

export default CONTROLFILE_CONFIG;
