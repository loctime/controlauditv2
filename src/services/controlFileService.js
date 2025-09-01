import { auth } from '../firebaseConfig';
import { ControlFileClient } from '../lib/controlfile-sdk';

/*
 * ✅ SERVICIO CONTROLFILE ACTUALIZADO
 * 
 * Siguiendo la guía de integración oficial:
 * - Usa el proyecto central de Auth: controlstorage-eb796
 * - Implementa el mini SDK de ControlFile
 * - Maneja tokens automáticamente
 * - Fallback al backend local en desarrollo
 */

class ControlFileService {
  constructor() {
    // Configuración de ControlFile real
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    this.baseURL = isDevelopment 
      ? 'http://localhost:4001'  // Backend local en desarrollo (puerto actualizado)
      : 'https://controlfile.onrender.com'; // ControlFile real en producción
    
    // Inicializar cliente ControlFile
    this.controlFileClient = new ControlFileClient(
      this.baseURL,
      async () => {
        if (!auth.currentUser) {
          throw new Error('Usuario no autenticado');
        }
        return await auth.currentUser.getIdToken();
      }
    );
    
    console.log('🔧 ControlFile Service inicializado con URL:', this.baseURL);
    console.log('🌍 Entorno:', isDevelopment ? 'development' : 'production');
    console.log('✅ Usando proyecto central de Auth: controlstorage-eb796');
  }

  // Verificar si ControlFile está disponible
  async isControlFileAvailable() {
    try {
      await this.controlFileClient.health();
      console.log('✅ ControlFile está disponible');
      return true;
    } catch (error) {
      console.log('❌ ControlFile no disponible:', error.message);
      return false;
    }
  }

  // Verificar cuenta de usuario en ControlFile
  async checkUserAccount() {
    try {
      const profile = await this.controlFileClient.getUserProfile();
      console.log('✅ Cuenta de usuario verificada en ControlFile:', profile);
      return { success: true, profile };
    } catch (error) {
      console.log('❌ Error verificando cuenta de usuario:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Subir archivo completo usando el SDK
  async uploadFileComplete(file, metadata = {}) {
    try {
      console.log('🚀 Iniciando subida a ControlFile:', file.name);
      
      // 1. Crear sesión de subida
      const presign = await this.controlFileClient.presignUpload({
        name: file.name,
        size: file.size,
        mime: file.type,
        parentId: null
      });
      
      console.log('✅ Sesión de subida creada:', presign);
      
      if (presign.url) {
        // 2. Subir archivo (PUT simple)
        const uploadResponse = await fetch(presign.url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          }
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Error en subida PUT: ${uploadResponse.status}`);
        }
        
        // 3. Confirmar subida
        const etag = uploadResponse.headers.get('etag');
        const confirmResult = await this.controlFileClient.confirm({
          uploadSessionId: presign.uploadSessionId,
          etag: etag
        });
        
        console.log('✅ Archivo subido exitosamente:', confirmResult);
        
        return {
          success: true,
          fileId: confirmResult.fileId,
          url: confirmResult.url,
          metadata: confirmResult.metadata
        };
        
      } else if (presign.multipart) {
        // TODO: Implementar subida multipart si es necesario
        throw new Error('Subida multipart no implementada aún');
      }
      
    } catch (error) {
      console.error('❌ Error en subida a ControlFile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar archivos del usuario
  async listUserFiles(parentId = null, pageSize = 50) {
    try {
      const result = await this.controlFileClient.list({ parentId, pageSize });
      console.log('✅ Archivos listados:', result);
      return { success: true, files: result.items };
    } catch (error) {
      console.error('❌ Error listando archivos:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener URL de descarga
  async getDownloadUrl(fileId) {
    try {
      const result = await this.controlFileClient.presignGet({ fileId });
      console.log('✅ URL de descarga obtenida:', result);
      return { success: true, url: result.url };
    } catch (error) {
      console.error('❌ Error obteniendo URL de descarga:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar conectividad completa
  async checkConnectivity() {
    try {
      const health = await this.controlFileClient.health();
      const profile = await this.controlFileClient.getUserProfile();
      
      return {
        success: true,
        health,
        profile,
        message: 'ControlFile completamente operativo'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'ControlFile no disponible'
      };
    }
  }

  // Obtener información de diagnóstico (método faltante)
  async getDiagnosticInfo() {
    try {
      const isAvailable = await this.isControlFileAvailable();
      const connectivity = await this.checkConnectivity();
      const hasAccount = await this.checkUserAccount();
      
      return {
        baseURL: this.baseURL,
        environment: import.meta.env.MODE,
        isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost',
        serviceAvailable: isAvailable,
        connectivity: connectivity.success,
        userHasAccount: hasAccount.success,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        hasAuth: !!auth.currentUser,
        authUid: auth.currentUser?.uid,
        authEmail: auth.currentUser?.email
      };
    } catch (error) {
      return {
        baseURL: this.baseURL,
        environment: import.meta.env.MODE,
        isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost',
        serviceAvailable: false,
        connectivity: false,
        userHasAccount: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        hasAuth: !!auth.currentUser,
        authUid: auth.currentUser?.uid,
        authEmail: auth.currentUser?.email
      };
    }
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
      const profile = await this.controlFileClient.getUserProfile();
      console.log('✅ Prueba de perfil de ControlFile exitosa:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Error en prueba de perfil de ControlFile:', error);
      throw error;
    }
  }

  async testPresign(uploadId = '') {
    try {
      console.log('🧪 Probando endpoint /api/uploads/presign en ControlFile...');
      const presign = await this.controlFileClient.presignUpload({
        name: 'test.jpg',
        size: 12345,
        mime: 'image/jpeg',
        parentId: null
      });
      console.log('✅ Prueba de presign de ControlFile exitosa:', presign);
      return presign;
    } catch (error) {
      console.error('❌ Error en prueba de presign de ControlFile:', error);
      throw error;
    }
  }

  async testCompleteUpload() {
    try {
      console.log('🧪 Probando endpoint /api/uploads/complete en ControlFile...');
      const presignResult = await this.testPresign();
      
      if (!presignResult.uploadSessionId) {
        throw new Error('No se pudo obtener uploadSessionId del presign de ControlFile');
      }

      // Simular subida PUT
      const uploadResponse = await fetch(presignResult.url, {
        method: 'PUT',
        body: new Blob(['test content']), // Simular archivo
        headers: {
          'Content-Type': 'image/jpeg' // Simular tipo de archivo
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Error en subida PUT simulada: ${uploadResponse.status}`);
      }

      const etag = uploadResponse.headers.get('etag');
      const confirmResult = await this.controlFileClient.confirm({
        uploadSessionId: presignResult.uploadSessionId,
        etag: etag
      });

      console.log('✅ Prueba de complete de ControlFile exitosa:', confirmResult);
      return confirmResult;
    } catch (error) {
      console.error('❌ Error en prueba de complete de ControlFile:', error);
      throw error;
    }
  }
}

export const controlFileService = new ControlFileService();
