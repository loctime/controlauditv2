import { CONTROLFILE_CONFIG, controlFileUtils, CONTROLFILE_ERRORS } from '../config/controlfile.js';

class ControlFileClient {
  constructor() {
    this.baseURL = CONTROLFILE_CONFIG.BASE_URL;
    this.appCode = CONTROLFILE_CONFIG.APP_CODE;
    this.timeout = CONTROLFILE_CONFIG.TIMEOUT;
  }

  // Obtener token de autenticación
  async getAuthToken() {
    const auth = window.auth;
    if (!auth?.currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return await auth.currentUser.getIdToken();
  }

  // Crear sesión de subida
  async presignUpload(fileData) {
    // Validar archivo antes de subir
    if (!controlFileUtils.isValidFileType(fileData.mimeType)) {
      throw new Error(`Tipo de archivo no permitido: ${fileData.mimeType}`);
    }
    
    if (!controlFileUtils.isValidFileSize(fileData.fileSize)) {
      throw new Error(`Archivo demasiado grande: ${controlFileUtils.formatFileSize(fileData.fileSize)}`);
    }

    const authToken = await this.getAuthToken();
    
    const response = await fetch(CONTROLFILE_CONFIG.ENDPOINTS.UPLOAD_PRESIGN, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...fileData,
        appCode: this.appCode // ✅ Importante: incluir appCode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const errorMessage = this.mapErrorResponse(response.status, errorData);
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Confirmar subida
  async confirmUpload(uploadData) {
    const authToken = await this.getAuthToken();
    
    const response = await fetch(CONTROLFILE_CONFIG.ENDPOINTS.UPLOAD_CONFIRM, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...uploadData,
        appCode: this.appCode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const errorMessage = this.mapErrorResponse(response.status, errorData);
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Listar archivos
  async listFiles(options = {}) {
    const authToken = await this.getAuthToken();
    
    const params = new URLSearchParams({
      ...options,
      appCode: this.appCode
    });
    
    const response = await fetch(`${CONTROLFILE_CONFIG.ENDPOINTS.FILES_LIST}?${params}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const errorMessage = this.mapErrorResponse(response.status, errorData);
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Obtener URL de descarga
  async getDownloadUrl(fileId) {
    const authToken = await this.getAuthToken();
    
    const endpoint = CONTROLFILE_CONFIG.ENDPOINTS.FILE_PRESIGN_GET.replace('{fileId}', fileId);
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const errorMessage = this.mapErrorResponse(response.status, errorData);
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Eliminar archivo
  async deleteFile(fileId) {
    const authToken = await this.getAuthToken();
    
    const endpoint = CONTROLFILE_CONFIG.ENDPOINTS.FILE_DELETE.replace('{fileId}', fileId);
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const errorMessage = this.mapErrorResponse(response.status, errorData);
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Renombrar archivo
  async renameFile(fileId, newName) {
    const authToken = await this.getAuthToken();
    
    const endpoint = CONTROLFILE_CONFIG.ENDPOINTS.FILE_RENAME.replace('{fileId}', fileId);
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const errorMessage = this.mapErrorResponse(response.status, errorData);
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Health check
  async health() {
    try {
      const response = await fetch(CONTROLFILE_CONFIG.ENDPOINTS.HEALTH);
      return {
        available: response.ok,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Verificar si ControlFile está disponible
  async isAvailable() {
    const health = await this.health();
    return health.available;
  }

  // Mapear códigos de error HTTP a mensajes legibles
  mapErrorResponse(status, errorData) {
    switch (status) {
      case 401:
        return CONTROLFILE_ERRORS.UNAUTHORIZED;
      case 403:
        return CONTROLFILE_ERRORS.FORBIDDEN;
      case 404:
        return CONTROLFILE_ERRORS.NOT_FOUND;
      case 413:
        return CONTROLFILE_ERRORS.QUOTA_EXCEEDED;
      case 500:
        return CONTROLFILE_ERRORS.UPLOAD_FAILED;
      default:
        try {
          const parsedError = JSON.parse(errorData);
          return parsedError.message || parsedError.error || `Error ${status}: ${errorData}`;
        } catch {
          return `Error ${status}: ${errorData}`;
        }
    }
  }

  // Obtener información del archivo
  getFileInfo(file) {
    return controlFileUtils.extractFileInfo(file);
  }

  // Validar archivo
  validateFile(file) {
    const errors = [];
    
    if (!controlFileUtils.isValidFileType(file.type)) {
      errors.push(`Tipo de archivo no permitido: ${file.type}`);
    }
    
    if (!controlFileUtils.isValidFileSize(file.size)) {
      errors.push(`Archivo demasiado grande: ${controlFileUtils.formatFileSize(file.size)}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ControlFileClient;
