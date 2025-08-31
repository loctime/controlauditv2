import { auth } from '../firebaseConfig';

class ControlFileService {
  constructor() {
    // Usar backend local en desarrollo, ControlFile en producción
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    this.baseURL = isDevelopment 
      ? 'http://localhost:4000' 
      : (import.meta.env.VITE_CONTROLFILE_API_URL || 'https://files.controldoc.app');
    
    console.log('🔧 ControlFile Service inicializado con URL:', this.baseURL);
    console.log('🌍 Entorno:', isDevelopment ? 'development' : 'production');
  }

  // Verificar si ControlFile está disponible
  async isControlFileAvailable() {
    // Si ya sabemos que no está disponible, retornar false inmediatamente
    if (this.serviceUnavailable) {
      return false;
    }

    // Si no hay baseURL (servicio deshabilitado), retornar false
    if (!this.baseURL) {
      return false;
    }

    try {
      // Intentar con el endpoint raíz primero (que sabemos que funciona)
      const response = await fetch(`${this.baseURL}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log('✅ ControlFile está disponible (endpoint raíz responde)');
        return true;
      } else {
        console.log('⚠️ ControlFile endpoint raíz falló con status:', response.status);
        this.serviceUnavailable = true;
        return false;
      }
    } catch (error) {
      console.log('❌ ControlFile no disponible:', error.message);
      this.serviceUnavailable = true;
      return false;
    }
  }

  // Obtener token de Firebase
  async getAuthToken() {
    if (!auth.currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return await auth.currentUser.getIdToken();
  }

  // Verificar conectividad con ControlFile
  async checkConnectivity() {
    // Si ya sabemos que no está disponible, retornar false inmediatamente
    if (this.serviceUnavailable) {
      return false;
    }

    try {
      console.log('🔍 Verificando conectividad con ControlFile...');
      
      // Verificar que el servicio base esté disponible usando /api/health
      let response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        console.log('✅ ControlFile API está disponible (/api/health responde)');
        return true;
      }

      // Si /api/health falla, intentar con el endpoint raíz
      console.log('⚠️ /api/health falló, intentando con endpoint raíz...');
      response = await fetch(`${this.baseURL}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        console.log('✅ ControlFile base está disponible (endpoint raíz responde)');
        return true;
      }

      console.log('❌ ControlFile no responde en ningún endpoint');
      this.serviceUnavailable = true;
      return false;

    } catch (error) {
      console.error('❌ Error de conectividad con ControlFile:', error);
      this.serviceUnavailable = true;
      return false;
    }
  }

  // Crear sesión de subida
  async createUploadSession(fileData) {
    try {
      const token = await this.getAuthToken();
      console.log('🔑 Token obtenido, creando sesión...');
      
      const requestBody = {
        fileName: fileData.name,
        fileSize: fileData.size,
        mimeType: fileData.type,
        parentId: fileData.parentId || null
      };

      console.log('📤 Enviando request a:', `${this.baseURL}/api/uploads/presign`);
      console.log('📋 Datos:', requestBody);

      const response = await fetch(`${this.baseURL}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      });

      console.log('📥 Respuesta recibida:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
        throw new Error(`Error al crear sesión: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Sesión creada exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en createUploadSession:', error);
      throw error;
    }
  }

  // Subir archivo
  async uploadFile(file, sessionId) {
    try {
      const token = await this.getAuthToken();
      console.log('📤 Subiendo archivo con sessionId:', sessionId);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await fetch(`${this.baseURL}/api/uploads/proxy-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: AbortSignal.timeout(60000) // 60 segundos timeout para archivos grandes
      });

      console.log('📥 Respuesta de subida:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en subida:', errorText);
        throw new Error(`Error al subir archivo: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Archivo subido exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en uploadFile:', error);
      throw error;
    }
  }

  // Confirmar subida
  async confirmUpload(uploadSessionId) {
    try {
      const token = await this.getAuthToken();
      console.log('✅ Confirmando subida con sessionId:', uploadSessionId);
      
      const response = await fetch(`${this.baseURL}/api/uploads/complete/${uploadSessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000)
      });

      console.log('📥 Respuesta de confirmación:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en confirmación:', errorText);
        throw new Error(`Error al confirmar subida: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Subida confirmada exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en confirmUpload:', error);
      throw error;
    }
  }

  // Subida completa en un solo método
  async uploadFileComplete(file, metadata = {}) {
    try {
      console.log('🔄 Iniciando subida completa a ControlFile:', file.name);
      console.log('📊 Metadatos:', metadata);
      
      // Verificar conectividad primero
      const isConnected = await this.checkConnectivity();
      if (!isConnected) {
        throw new Error('No se puede conectar con ControlFile API. Verifica la URL y tu conexión a internet.');
      }
      
      // 1. Crear sesión de subida
      const session = await this.createUploadSession({
        name: file.name,
        size: file.size,
        type: file.type,
        parentId: metadata.parentId
      });
      
      console.log('✅ Sesión creada:', session.uploadId);
      
      // 2. Subir archivo
      const uploadResult = await this.uploadFile(file, session.uploadId);
      console.log('✅ Archivo subido:', uploadResult);
      
      // 3. Confirmar subida
      const confirmResult = await this.confirmUpload(session.uploadId);
      console.log('✅ Subida confirmada:', confirmResult);
      
      return {
        success: true,
        fileId: confirmResult.fileId,
        url: confirmResult.url,
        metadata: confirmResult.metadata
      };
      
    } catch (error) {
      console.error('❌ Error en subida completa a ControlFile:', error);
      
      // Proporcionar información de diagnóstico
      const diagnosticInfo = {
        error: error.message,
        baseURL: this.baseURL,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      console.log('🔍 Información de diagnóstico:', diagnosticInfo);
      
      throw new Error(`Error en subida a ControlFile: ${error.message}`);
    }
  }

  // Verificar si el usuario tiene cuenta en ControlFile
  async checkUserAccount() {
    try {
      // Si ya sabemos que el servicio no está disponible, retornar false inmediatamente
      if (this.serviceUnavailable) {
        console.log('⚠️ ControlFile no está disponible, usando modo local');
        return false;
      }

      // Primero verificar si el servicio está disponible
      const isAvailable = await this.isControlFileAvailable();
      if (!isAvailable) {
        console.log('⚠️ ControlFile no está disponible, usando modo local');
        return false;
      }

      // Como el endpoint /api/user/profile no existe, asumimos que el usuario no tiene cuenta
      // hasta que se implemente correctamente el endpoint
      console.log('⚠️ Endpoint /api/user/profile no implementado en ControlFile');
      console.log('⚠️ Asumiendo que el usuario no tiene cuenta en ControlFile');
      return false;
      
    } catch (error) {
      console.log('❌ Error verificando cuenta de ControlFile:', error.message);
      // Marcar el servicio como no disponible si hay errores de conectividad
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')) {
        this.serviceUnavailable = true;
      }
      return false;
    }
  }

  // Obtener información de diagnóstico
  async getDiagnosticInfo() {
    const isAvailable = await this.isControlFileAvailable();
    return {
      baseURL: this.baseURL,
      environment: import.meta.env.MODE,
      isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost',
      serviceAvailable: isAvailable,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      hasAuth: !!auth.currentUser,
      authUid: auth.currentUser?.uid
    };
  }

  // Simular subida para pruebas (fallback)
  async simulateUpload(file, metadata = {}) {
    console.log('🔄 Simulando subida a ControlFile (modo fallback):', file.name);
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generar URL simulada
    const fileId = `cf_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = `https://example.com/simulated/${fileId}`;
    
    console.log('✅ Subida simulada exitosa');
    
    return {
      success: true,
      fileId: fileId,
      url: url,
      metadata: {
        ...metadata,
        simulated: true,
        originalName: file.name,
        size: file.size
      }
    };
  }

  // Métodos de prueba para endpoints de API
  async testProfile() {
    try {
      console.log('🧪 Probando endpoint /api/user/profile...');
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      console.log('📥 Respuesta de perfil:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Prueba de perfil exitosa:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en prueba de perfil:', error);
      throw error;
    }
  }

  async testPresign(uploadId = '') {
    try {
      console.log('🧪 Probando endpoint /api/uploads/presign...');
      const token = await this.getAuthToken();
      
      const requestBody = {
        fileName: 'test.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg'
      };

      const response = await fetch(`${this.baseURL}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10000)
      });

      console.log('📥 Respuesta de presign:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Prueba de presign exitosa:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en prueba de presign:', error);
      throw error;
    }
  }

  async testCompleteUpload() {
    try {
      console.log('🧪 Probando endpoint /api/uploads/complete...');
      const token = await this.getAuthToken();
      
      // Primero crear una sesión de presign
      const presignResult = await this.testPresign();
      
      if (!presignResult.uploadId) {
        throw new Error('No se pudo obtener uploadId del presign');
      }

      // Luego completar la subida
      const response = await fetch(`${this.baseURL}/api/uploads/complete/${presignResult.uploadId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(10000)
      });

      console.log('📥 Respuesta de complete:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Prueba de complete exitosa:', result);
      return {
        presign: presignResult,
        complete: result
      };
    } catch (error) {
      console.error('❌ Error en prueba de complete:', error);
      throw error;
    }
  }
}

export const controlFileService = new ControlFileService();
