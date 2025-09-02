// Configuración centralizada para ControlFile
// Este archivo centraliza todas las URLs y configuraciones relacionadas con ControlFile
import { getBackendUrl } from './environment.js';

export const CONTROLFILE_CONFIG = {
  // URLs base según el entorno
  urls: {
    development: 'https://controlfile.onrender.com',  // Backend de ControlFile en desarrollo
    production: 'https://controlfile.onrender.com'    // Backend oficial de ControlFile
  },
  
  // Endpoints de la API
  endpoints: {
    presign: '/api/uploads/presign',
    proxyUpload: '/api/uploads/proxy-upload',
    confirm: '/api/uploads/confirm',
    health: '/api/health'
  },
  
  // Configuración de subida
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    timeout: {
      presign: 30000,    // 30 segundos
      upload: 60000,     // 60 segundos
      confirm: 30000     // 30 segundos
    }
  },
  
  // Carpetas por defecto para diferentes tipos de archivos
  folders: {
    auditoria_imagenes: 'auditoria_imagenes',
    preguntas_imagenes: 'preguntas_imagenes',
    empresa_logos: 'empresa_logos',
    sistema_logos: 'sistema_logos',
    general: 'general'
  }
};

/**
 * Obtiene la URL base según el entorno
 * @returns {string} URL base del backend de ControlFile
 */
export function getControlFileBaseUrl() {
  // Usar la nueva configuración de entorno
  return getBackendUrl('');
}

/**
 * Construye la URL completa para un endpoint
 * @param {string} endpoint - Endpoint de la API
 * @returns {string} URL completa
 */
export function buildControlFileUrl(endpoint) {
  const baseUrl = getControlFileBaseUrl();
  return `${baseUrl}${endpoint}`;
}

/**
 * Construye la URL de descarga para un archivo
 * @param {string} fileId - ID del archivo en ControlFile
 * @returns {string} URL de descarga
 */
export function buildDownloadUrl(fileId) {
  return `https://files.controldoc.app/${fileId}`;
}

/**
 * Valida si un archivo cumple con los requisitos de ControlFile
 * @param {File} file - Archivo a validar
 * @returns {Object} Resultado de la validación
 */
export function validateFileForControlFile(file) {
  const errors = [];
  
  // Validar tamaño
  if (file.size > CONTROLFILE_CONFIG.upload.maxFileSize) {
    errors.push(`El archivo excede el tamaño máximo de ${(CONTROLFILE_CONFIG.upload.maxFileSize / 1024 / 1024).toFixed(0)}MB`);
  }
  
  // Validar tipo MIME
  if (!CONTROLFILE_CONFIG.upload.allowedMimeTypes.includes(file.type)) {
    errors.push(`Tipo de archivo no permitido: ${file.type}`);
  }
  
  // Validar nombre
  if (!file.name || file.name.trim() === '') {
    errors.push('El archivo debe tener un nombre válido');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileSize: file.size,
    fileType: file.type,
    fileName: file.name
  };
}

export default CONTROLFILE_CONFIG;
