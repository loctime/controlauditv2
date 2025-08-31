import { auth } from '../firebaseConfig';
import { API_CONFIG, getApiUrl, getEnvironmentConfig } from '../config/api.js';

class ApiService {
  constructor() {
    this.config = getEnvironmentConfig();
    console.log('🚀 API Service inicializado con:', this.config.baseURL);
  }

  // Obtener token de Firebase
  async getAuthToken() {
    if (!auth.currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return await auth.currentUser.getIdToken();
  }

  // Función base para hacer requests
  async request(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      
      const url = `${this.config.baseURL}${endpoint}`;
      console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      console.log(`📥 API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ API Request Error:', error);
      throw error;
    }
  }

  // Subir archivo
  async uploadFile(file, metadata = {}) {
    try {
      console.log(`📤 Subiendo archivo: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`);
      
      const token = await this.getAuthToken();
      const formData = new FormData();
      formData.append('file', file);
      
      // Agregar metadatos como campos adicionales
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const url = `${this.config.baseURL}/api/upload`;
      console.log(`📡 Upload Request: POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: AbortSignal.timeout(60000) // 60 segundos para archivos grandes
      });

      console.log(`📥 Upload Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Archivo subido exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Upload Error:', error);
      throw error;
    }
  }

  // Obtener perfil de usuario
  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  // Obtener archivos del usuario
  async getUserFiles() {
    return this.request('/api/files');
  }

  // Obtener un archivo específico
  async getFile(fileId) {
    return this.request(`/api/files/${fileId}`);
  }

  // Eliminar archivo
  async deleteFile(fileId) {
    return this.request(`/api/files/${fileId}`, {
      method: 'DELETE'
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Verificar conectividad
  async checkConnectivity() {
    try {
      await this.healthCheck();
      console.log('✅ API conectividad verificada');
      return true;
    } catch (error) {
      console.log('❌ API no disponible:', error.message);
      return false;
    }
  }

  // Obtener información de diagnóstico
  async getDiagnosticInfo() {
    const isConnected = await this.checkConnectivity();
    return {
      baseURL: this.config.baseURL,
      environment: getEnvironmentConfig(),
      isConnected,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      hasAuth: !!auth.currentUser,
      authUid: auth.currentUser?.uid
    };
  }
}

// Exportar instancia singleton
export const apiService = new ApiService();
