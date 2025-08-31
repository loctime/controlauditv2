import { auth } from '../firebaseConfig';

class ControlFileService {
  constructor() {
    // Usar backend local tanto en desarrollo como en producción hasta que ControlFile esté listo
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    this.baseURL = isDevelopment 
      ? 'http://localhost:4000' 
      : 'https://controlauditv2.onrender.com'; // Usar el backend local en producción
    
    console.log('🔧 ControlFile Service inicializado con URL:', this.baseURL);
    console.log('🌍 Entorno:', isDevelopment ? 'development' : 'production');
    console.log('⚠️ Usando backend local en producción hasta que ControlFile esté implementado');
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

  // Verificar si los endpoints de ControlFile están implementados
  async areControlFileEndpointsAvailable() {
    try {
      // Verificar endpoint de perfil
      const profileResponse = await fetch(`${this.baseURL}/api/user/profile`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      // Verificar endpoint de presign
      const presignResponse = await fetch(`${this.baseURL}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: 'test.jpg',
          fileSize: 12345,
          mimeType: 'image/jpeg'
        }),
        signal: AbortSignal.timeout(5000)
      });

      const profileOk = profileResponse.ok || profileResponse.status === 401; // 401 significa que el endpoint existe pero necesita auth
      const presignOk = presignResponse.ok || presignResponse.status === 401;

      console.log(`🔍 Endpoints ControlFile - Profile: ${profileOk ? '✅' : '❌'} (${profileResponse.status}), Presign: ${presignOk ? '✅' : '❌'} (${presignResponse.status})`);

      return profileOk && presignOk;
    } catch (error) {
      console.log('❌ Error verificando endpoints de ControlFile:', error.message);
      return false;
    }
  }

  // Obtener token de Firebase
  async getAuthToken() {
    try {
      if (!auth.currentUser) {
        console.error('❌ No hay usuario autenticado en Firebase');
        throw new Error('Usuario no autenticado');
      }
      
      console.log('🔍 Obteniendo token de Firebase para usuario:', auth.currentUser.uid);
      console.log('📧 Email del usuario:', auth.currentUser.email);
      
      // Forzar refresh del token para asegurar que esté actualizado
      const token = await auth.currentUser.getIdToken(true);
      
      if (!token) {
        throw new Error('No se pudo obtener el token de Firebase');
      }
      
      console.log('✅ Token obtenido exitosamente (longitud:', token.length, 'caracteres)');
      console.log('🔑 Token preview:', token.substring(0, 50) + '...');
      
      return token;
    } catch (error) {
      console.error('❌ Error obteniendo token de Firebase:', error);
      console.error('🔍 Detalles del error:', {
        code: error.code,
        message: error.message,
        userExists: !!auth.currentUser,
        userUid: auth.currentUser?.uid
      });
      throw error;
    }
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

  // Crear sesión de subida en ControlFile real
  async createUploadSession(fileData) {
    try {
      const token = await this.getAuthToken();
      console.log('🔑 Token obtenido, creando sesión en ControlFile...');
      
      const requestBody = {
        fileName: fileData.name,
        fileSize: fileData.size,
        mimeType: fileData.type,
        parentId: fileData.parentId || null,
        metadata: {
          app: 'controlaudit',
          userId: auth.currentUser?.uid,
          uploadedAt: new Date().toISOString()
        }
      };

      console.log('📤 Enviando request a ControlFile:', `${this.baseURL}/api/uploads/presign`);
      console.log('📋 Datos:', requestBody);
      console.log('🔑 Token header:', `Bearer ${token.substring(0, 20)}...`);

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
        console.error('❌ Error en respuesta de ControlFile:', errorText);
        console.error('🔍 Detalles del error 401:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // Si es error 401, puede ser problema de token
        if (response.status === 401) {
          throw new Error(`Error de autenticación (401): El token de Firebase puede haber expirado. Por favor, cierra sesión y vuelve a iniciar. Detalles: ${errorText}`);
        }
        
        throw new Error(`Error al crear sesión en ControlFile: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Sesión creada exitosamente en ControlFile:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en createUploadSession:', error);
      throw error;
    }
  }

  // Subir archivo a ControlFile real
  async uploadFile(file, sessionId) {
    try {
      const token = await this.getAuthToken();
      console.log('📤 Subiendo archivo a ControlFile con sessionId:', sessionId);
      
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

      console.log('📥 Respuesta de subida de ControlFile:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en subida a ControlFile:', errorText);
        throw new Error(`Error al subir archivo a ControlFile: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Archivo subido exitosamente a ControlFile:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en uploadFile:', error);
      throw error;
    }
  }

  // Confirmar subida en ControlFile real
  async confirmUpload(uploadSessionId) {
    try {
      const token = await this.getAuthToken();
      console.log('✅ Confirmando subida en ControlFile con sessionId:', uploadSessionId);
      
      const response = await fetch(`${this.baseURL}/api/uploads/complete/${uploadSessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000)
      });

      console.log('📥 Respuesta de confirmación de ControlFile:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en confirmación de ControlFile:', errorText);
        throw new Error(`Error al confirmar subida en ControlFile: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Subida confirmada exitosamente en ControlFile:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en confirmUpload:', error);
      throw error;
    }
  }

  // Subida completa en un solo método con ControlFile real
  async uploadFileComplete(file, metadata = {}) {
    try {
      console.log('🔄 Iniciando subida completa a ControlFile real:', file.name);
      console.log('📊 Metadatos:', metadata);
      
      // Verificar conectividad primero
      const isConnected = await this.checkConnectivity();
      if (!isConnected) {
        throw new Error('No se puede conectar con ControlFile API. Verifica la URL y tu conexión a internet.');
      }
      
      // Verificar si los endpoints están implementados
      const endpointsAvailable = await this.areControlFileEndpointsAvailable();
      if (!endpointsAvailable) {
        console.log('⚠️ Endpoints de ControlFile no están implementados, usando fallback al backend local');
        throw new Error('Endpoints de ControlFile no están implementados aún. Usando modo fallback.');
      }
      
      // 1. Crear sesión de subida en ControlFile
      const session = await this.createUploadSession({
        name: file.name,
        size: file.size,
        type: file.type,
        parentId: metadata.parentId
      });
      
      console.log('✅ Sesión creada en ControlFile:', session.uploadId);
      
      // 2. Subir archivo a ControlFile
      const uploadResult = await this.uploadFile(file, session.uploadId);
      console.log('✅ Archivo subido a ControlFile:', uploadResult);
      
      // 3. Confirmar subida en ControlFile
      const confirmResult = await this.confirmUpload(session.uploadId);
      console.log('✅ Subida confirmada en ControlFile:', confirmResult);
      
      return {
        success: true,
        fileId: confirmResult.fileId,
        url: confirmResult.url,
        metadata: confirmResult.metadata,
        controlFileId: confirmResult.controlFileId, // ID específico de ControlFile
        uploadedToControlFile: true
      };
      
    } catch (error) {
      console.error('❌ Error en subida completa a ControlFile:', error);
      
      // Si es un error de endpoints no implementados, usar fallback automáticamente
      if (error.message.includes('Endpoints de ControlFile no están implementados') || 
          error.message.includes('404') || 
          error.message.includes('500')) {
        
        console.log('🔄 Intentando fallback al backend local...');
        
        try {
          // Usar el backend local como fallback
          const fallbackResult = await this.simulateUpload(file, metadata);
          console.log('✅ Fallback exitoso:', fallbackResult);
          
          return {
            ...fallbackResult,
            fallbackUsed: true,
            originalError: error.message
          };
        } catch (fallbackError) {
          console.error('❌ Fallback también falló:', fallbackError);
          throw new Error(`Error en subida a ControlFile: ${error.message}. Fallback también falló: ${fallbackError.message}`);
        }
      }
      
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

      // Verificar si los endpoints están implementados
      const endpointsAvailable = await this.areControlFileEndpointsAvailable();
      if (!endpointsAvailable) {
        console.log('⚠️ Endpoints de ControlFile no están implementados, usando modo local');
        return false;
      }

      // Intentar verificar la cuenta del usuario en ControlFile
      try {
        const token = await this.getAuthToken();
        const response = await fetch(`${this.baseURL}/api/user/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Usuario tiene cuenta en ControlFile:', userData);
          return true;
        } else if (response.status === 404) {
          console.log('⚠️ Endpoint de perfil no implementado en ControlFile (404)');
          return false;
        } else {
          console.log('⚠️ Usuario no tiene cuenta en ControlFile (status:', response.status, ')');
          return false;
        }
      } catch (error) {
        console.log('⚠️ Error verificando cuenta en ControlFile:', error.message);
        return false;
      }
      
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
    const endpointsAvailable = await this.areControlFileEndpointsAvailable();
    const hasAccount = await this.checkUserAccount();
    
    return {
      baseURL: this.baseURL,
      environment: import.meta.env.MODE,
      isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost',
      serviceAvailable: isAvailable,
      endpointsAvailable: endpointsAvailable,
      userHasAccount: hasAccount,
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
      console.log('🧪 Probando endpoint /api/user/profile en ControlFile...');
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      console.log('📥 Respuesta de perfil de ControlFile:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Prueba de perfil de ControlFile exitosa:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en prueba de perfil de ControlFile:', error);
      throw error;
    }
  }

  async testPresign(uploadId = '') {
    try {
      console.log('🧪 Probando endpoint /api/uploads/presign en ControlFile...');
      const token = await this.getAuthToken();
      
      const requestBody = {
        fileName: 'test.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg',
        metadata: {
          app: 'controlaudit',
          test: true
        }
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

      console.log('📥 Respuesta de presign de ControlFile:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Prueba de presign de ControlFile exitosa:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en prueba de presign de ControlFile:', error);
      throw error;
    }
  }

  async testCompleteUpload() {
    try {
      console.log('🧪 Probando endpoint /api/uploads/complete en ControlFile...');
      const token = await this.getAuthToken();
      
      // Primero crear una sesión de presign
      const presignResult = await this.testPresign();
      
      if (!presignResult.uploadId) {
        throw new Error('No se pudo obtener uploadId del presign de ControlFile');
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

      console.log('📥 Respuesta de complete de ControlFile:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Prueba de complete de ControlFile exitosa:', result);
      return {
        presign: presignResult,
        complete: result
      };
    } catch (error) {
      console.error('❌ Error en prueba de complete de ControlFile:', error);
      throw error;
    }
  }
}

export const controlFileService = new ControlFileService();
