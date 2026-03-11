import logger from '@/utils/logger';
// src/services/capacitacionImageService.js
import { getOfflineDatabase, generateOfflineId } from './offlineDatabase';
import syncQueueService from './syncQueue';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { 
  esArchivoLegacy, 
  normalizarArchivoCapacitacion,
  separarArchivosPorTipo,
  esArchivoValido
} from '../utils/capacitacionFileUtils';
import { uploadFileWithContext } from './unifiedFileUploadService';
import { uploadFiles, buildLegacyImageMetadataMirror } from './unifiedFileService';

/**
 * Servicio para manejar imÃ¡genes de capacitaciones
 * Soporta modo online y offline con sincronizaciÃ³n automÃ¡tica
 * 
 * @deprecated La funciÃ³n uploadImage() ahora usa internamente el nuevo modelo de contexto de evento.
 * Se mantiene la API existente para compatibilidad total con cÃ³digo legacy.
 */
class CapacitacionImageService {

  /**
   * Subir imagen usando el nuevo modelo de contexto de evento
   * FunciÃ³n interna que usa uploadFileWithContext()
   * 
   * @private
   * @deprecated Esta funciÃ³n serÃ¡ removida en IteraciÃ³n 2 cuando todos los componentes migren
   */
  async uploadImageNew(file, idToken, capacitacionEventoId, companyId, sucursalId = null, capacitacionTipoId = null, tipoArchivo = 'evidencia') {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      const userId = user.uid;

      // Obtener datos completos de la capacitaciÃ³n desde la colecciÃ³n multi-tenant
      let capacitacionData = null;
      try {
        if (!userId) throw new Error('ownerId es requerido');
        const ownerId = userId; // userId ahora es ownerId
        const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionEventoId));
        const capacitacionSnap = await getDoc(capacitacionRef);
        
        if (capacitacionSnap.exists()) {
          capacitacionData = capacitacionSnap.data();
        }
      } catch (error) {
        logger.warn('âš ï¸ No se pudo obtener datos de la capacitaciÃ³n:', error);
      }

      // Determinar valores finales
      const finalCompanyId = companyId || capacitacionData?.empresaId;
      const finalSucursalId = sucursalId || capacitacionData?.sucursalId;
      
      if (!finalCompanyId) {
        throw new Error('No se pudo obtener companyId para la capacitaciÃ³n');
      }
      
      if (!finalSucursalId) {
        throw new Error('No se pudo obtener sucursalId para la capacitaciÃ³n');
      }

      const finalTipoId = capacitacionTipoId || capacitacionData?.capacitacionTipoId;
      
      if (!finalTipoId || typeof finalTipoId !== 'string' || finalTipoId.trim() === '') {
        throw new Error('CapacitaciÃ³n sin capacitacionTipoId. Estado invÃ¡lido. El capacitacionTipoId debe estar persistido en Firestore desde la creaciÃ³n.');
      }

      logger.debug(`[capacitacionImageService] ðŸ“¤ [v1.0] Subiendo archivo con modelo de contexto: capacitacion/${capacitacionEventoId}/${tipoArchivo}`);

      // Usar el nuevo servicio unificado
      const result = await uploadFileWithContext({
        file,
        context: {
          contextType: 'capacitacion',
          contextEventId: capacitacionEventoId,
          companyId: finalCompanyId,
          sucursalId: finalSucursalId,
          tipoArchivo,
          capacitacionTipoId: finalTipoId
        },
        fecha: new Date(),
        uploadedBy: userId
      });

      return {
        fileId: result.fileId,
        shareToken: result.shareToken,
        uploadedAt: result.uploadedAt,
        size: file.size,
        name: file.name,
        type: file.type,
        capacitacionTipoId: finalTipoId,
        capacitacionEventoId: capacitacionEventoId,
        companyId: finalCompanyId,
        sucursalId: finalSucursalId
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[capacitacionImageService] âŒ [v1.0] Error al subir archivo (${capacitacionEventoId}):`, errorMsg);
      throw error;
    }
  }

  /**
   * Subir imagen a ControlFile (modo online)
   * 
   * @deprecated Esta funciÃ³n ahora usa internamente el nuevo modelo de contexto de evento (v1.0).
   * Se mantiene la API existente para compatibilidad total con cÃ³digo legacy.
   * 
   * MigraciÃ³n: Los componentes deberÃ­an migrar a usar uploadFileWithContext() directamente.
   * Esta funciÃ³n serÃ¡ removida en IteraciÃ³n 2 cuando todos los componentes migren.
   * 
   * @param {File} file - Archivo a subir
   * @param {string} idToken - Firebase ID Token del usuario autenticado (no usado en v1.0)
   * @param {string} capacitacionEventoId - ID del evento de capacitaciÃ³n (cada vez que se dicta)
   * @param {string} companyId - ID de la empresa
   * @param {string} sucursalId - ID de la sucursal (opcional, se obtendrÃ¡ de la capacitaciÃ³n)
   * @param {string} capacitacionTipoId - ID del tipo de capacitaciÃ³n (opcional, se obtendrÃ¡ de la capacitaciÃ³n)
   * @param {'evidencia' | 'material' | 'certificado'} tipoArchivo - Tipo de archivo
   * @returns {Promise<{fileId: string, shareToken: string}>}
   */
  async uploadImage(file, idToken, capacitacionEventoId, companyId, sucursalId = null, capacitacionTipoId = null, tipoArchivo = 'evidencia') {
    // Legacy retirado intencionalmente: solo flujo unificado con uploadFileWithContext.
    return await this.uploadImageNew(file, idToken, capacitacionEventoId, companyId, sucursalId, capacitacionTipoId, tipoArchivo);
  }

  /**
   * Guardar imagen offline en IndexedDB
   * @param {File} file - Archivo a guardar
   * @param {string} capacitacionId - ID de la capacitaciÃ³n
   * @param {string} companyId - ID de la empresa (opcional)
   * @returns {Promise<{id: string, offline: boolean}>}
   */
  async saveImageOffline(file, capacitacionId, companyId = null) {
    try {
      const db = await getOfflineDatabase();
      const imageId = generateOfflineId();

      // Convertir File a Blob para guardar en IndexedDB
      const blob = file instanceof File ? file : new Blob([file], { type: file.type });

      const imageData = {
        id: imageId,
        capacitacionId: capacitacionId,
        blob: blob,
        mime: file.type,
        size: file.size,
        createdAt: Date.now(),
        originalName: file.name,
        tipo: 'capacitacion',
        companyId: companyId // Guardar companyId para sincronizaciÃ³n
      };

      await db.put('fotos', imageData);

      // Encolar para sincronizaciÃ³n
      await syncQueueService.enqueueCapacitacionImage({
        imageId,
        capacitacionId,
        companyId: companyId, // Incluir companyId si estÃ¡ disponible
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }, capacitacionId, 2);

      logger.debug(`ðŸ“¸ Imagen de capacitaciÃ³n guardada offline: ${imageId}`);

      return {
        id: imageId,
        offline: true,
        originalName: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      logger.error('âŒ Error al guardar imagen offline:', error);
      throw error;
    }
  }

  /**
   * Subir imagen (online o offline segÃºn conectividad)
   * @param {File} file - Archivo a subir
   * @param {string} idToken - Firebase ID Token del usuario autenticado
   * @param {string} capacitacionEventoId - ID del evento de capacitaciÃ³n (cada vez que se dicta)
   * @param {string} companyId - ID de la empresa (opcional, se obtendrÃ¡ de la capacitaciÃ³n si no se proporciona)
   * @param {string} sucursalId - ID de la sucursal (opcional, se obtendrÃ¡ de la capacitaciÃ³n si no se proporciona)
   * @param {boolean} isOnline - Si hay conexiÃ³n a internet
   * @param {string} capacitacionTipoId - ID del tipo de capacitaciÃ³n (opcional, se generarÃ¡ del nombre)
   * @param {'evidencia' | 'material' | 'certificado'} tipoArchivo - Tipo de archivo
   * @returns {Promise<Object>} Metadata de la imagen
   */
  async uploadImageSmart(file, idToken, capacitacionEventoId, companyId = null, sucursalId = null, isOnline = navigator.onLine, capacitacionTipoId = null, tipoArchivo = 'evidencia') {
    // Obtener userId del usuario autenticado
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    const userId = user.uid;

    // Obtener datos de la capacitaciÃ³n desde la colecciÃ³n multi-tenant si faltan companyId, sucursalId o capacitacionTipoId
    let finalCompanyId = companyId;
    let finalSucursalId = sucursalId;
    let finalTipoId = capacitacionTipoId;
    
    if (!finalCompanyId || !finalSucursalId || !finalTipoId) {
      try {
        if (!userId) throw new Error('ownerId es requerido');
        const ownerId = userId; // userId ahora es ownerId
        const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionEventoId));
        const capacitacionSnap = await getDoc(capacitacionRef);
        if (capacitacionSnap.exists()) {
          const capacitacionData = capacitacionSnap.data();
          if (!finalCompanyId) {
            finalCompanyId = capacitacionData.empresaId;
          }
          if (!finalSucursalId) {
            finalSucursalId = capacitacionData.sucursalId;
          }
          if (!finalTipoId) {
            finalTipoId = capacitacionData.capacitacionTipoId;
          }
        }
      } catch (error) {
        logger.warn('âš ï¸ No se pudo obtener datos de la capacitaciÃ³n:', error);
      }
    }

    if (!finalCompanyId) {
      throw new Error('No se pudo obtener companyId para la capacitaciÃ³n');
    }
    
    if (!finalSucursalId) {
      throw new Error('No se pudo obtener sucursalId para la capacitaciÃ³n');
    }

    // âš ï¸ capacitacionTipoId es OBLIGATORIO - sin fallback, sin normalizaciÃ³n
    if (!finalTipoId || typeof finalTipoId !== 'string' || finalTipoId.trim() === '') {
      throw new Error('CapacitaciÃ³n sin capacitacionTipoId. Estado invÃ¡lido. El capacitacionTipoId debe estar persistido en Firestore desde la creaciÃ³n.');
    }

    if (isOnline) {
      try {
        return await this.uploadImage(file, idToken, capacitacionEventoId, finalCompanyId, finalSucursalId, finalTipoId, tipoArchivo);
      } catch (error) {
        logger.warn('âš ï¸ Fallo en subida online, guardando offline:', error);
        // Si falla online, guardar offline (con companyId para sincronizaciÃ³n posterior)
        const offlineResult = await this.saveImageOffline(file, capacitacionEventoId, finalCompanyId);
        // Guardar datos en el resultado offline para sincronizaciÃ³n
        return { 
          ...offlineResult, 
          companyId: finalCompanyId, 
          sucursalId: finalSucursalId,
          capacitacionTipoId: finalTipoId // âœ… Usar el tipoId persistido, no generar
        };
      }
    } else {
      const offlineResult = await this.saveImageOffline(file, capacitacionEventoId, finalCompanyId);
      // Guardar datos en el resultado offline para sincronizaciÃ³n
      return { 
        ...offlineResult, 
        companyId: finalCompanyId, 
        sucursalId: finalSucursalId,
        capacitacionTipoId: finalTipoId // âœ… Usar el tipoId persistido, no generar
      };
    }
  }

  /**
   * Agregar imagen a capacitaciÃ³n en Firestore
   * @param {string} capacitacionId - ID de la capacitaciÃ³n
   * @param {Object} imageMetadata - Metadata de la imagen
   * @returns {Promise<void>}
   */
  async addImageToCapacitacion(capacitacionId, imageMetadata, userId) {
    try {
      if (!userId) {
        throw new Error('ownerId es requerido');
      }
      
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionId));
      const capacitacionSnap = await getDoc(capacitacionRef);

      if (!capacitacionSnap.exists()) {
        throw new Error('CapacitaciÃ³n no encontrada');
      }

      const capacitacionData = capacitacionSnap.data();
      const imagenes = capacitacionData.imagenes || [];

      // Agregar nueva imagen
      imagenes.push(imageMetadata);

      await updateDocWithAppId(capacitacionRef, {
        imagenes,
        updatedAt: new Date()
      });

      logger.debug(`âœ… Imagen agregada a capacitaciÃ³n: ${capacitacionId}`);
    } catch (error) {
      logger.error('âŒ Error al agregar imagen a capacitaciÃ³n:', error);
      throw error;
    }
  }

  /**
   * Eliminar imagen de capacitaciÃ³n
   * @param {string} capacitacionId - ID de la capacitaciÃ³n
   * @param {string} imageId - ID de la imagen (fileId o id offline)
   * @returns {Promise<void>}
   */
  async removeImageFromCapacitacion(capacitacionId, imageId, userId) {
    try {
      if (!userId) {
        throw new Error('ownerId es requerido');
      }
      
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionId));
      const capacitacionSnap = await getDoc(capacitacionRef);

      if (!capacitacionSnap.exists()) {
        throw new Error('CapacitaciÃ³n no encontrada');
      }

      const capacitacionData = capacitacionSnap.data();
      const imagenes = (capacitacionData.imagenes || []).filter(
        img => img.fileId !== imageId && img.id !== imageId
      );

      await updateDocWithAppId(capacitacionRef, {
        imagenes,
        updatedAt: new Date()
      });

      // Si es imagen offline, eliminar de IndexedDB
      if (imageId.startsWith('offline_')) {
        const dbOffline = await getOfflineDatabase();
        await dbOffline.delete('fotos', imageId);
      }

      logger.debug(`âœ… Imagen eliminada de capacitaciÃ³n: ${capacitacionId}`);
    } catch (error) {
      logger.error('âŒ Error al eliminar imagen:', error);
      throw error;
    }
  }

  /**
   * Obtener imÃ¡genes offline de una capacitaciÃ³n
   * @param {string} capacitacionId - ID de la capacitaciÃ³n
   * @returns {Promise<Array>} Array de imÃ¡genes offline
   */
  async getOfflineImages(capacitacionId) {
    try {
      const dbOffline = await getOfflineDatabase();
      const allFotos = await dbOffline.getAll('fotos');
      
      return allFotos.filter(
        foto => foto.capacitacionId === capacitacionId && foto.tipo === 'capacitacion'
      );
    } catch (error) {
      logger.error('âŒ Error al obtener imÃ¡genes offline:', error);
      return [];
    }
  }

  /**
   * Obtiene archivos de una capacitaciÃ³n desde ControlFile
   * Maneja tanto archivos nuevos (con metadata completa) como legacy (sin metadata completa)
   * Los archivos legacy se tratan como "archivos adjuntos" simples
   * 
   * @param {string} capacitacionId - ID de la capacitaciÃ³n
   * @param {string} userId - ID del usuario (para filtrar por usuario)
   * @returns {Promise<Array>} Array de archivos normalizados (nuevos + legacy)
   */
  async getArchivosCapacitacion(capacitacionId, userId) {
    try {
      if (!capacitacionId || !userId) {
        logger.warn('âš ï¸ CapacitacionId o userId no proporcionado');
        return [];
      }

      const archivosNuevos = [];
      const archivosLegacy = [];

      // Query 1: Archivos nuevos (con metadata completa)
      // Buscar por capacitacionEventoId (nuevo modelo) o capacitacionId (compatibilidad)
      try {
        // Query por capacitacionEventoId (nuevo modelo)
        const queryNuevosEvento = query(
          collection(db, 'files'),
          where('metadata.customFields.capacitacionEventoId', '==', capacitacionId),
          where('metadata.customFields.contextType', '==', 'capacitacion'),
          where('userId', '==', userId)
        );
        
        const nuevosEventoSnapshot = await getDocs(queryNuevosEvento);
        archivosNuevos.push(...nuevosEventoSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
        
        // Query por capacitacionId (compatibilidad con modelo anterior)
        const queryNuevosId = query(
          collection(db, 'files'),
          where('metadata.customFields.capacitacionId', '==', capacitacionId),
          where('metadata.customFields.contextType', '==', 'capacitacion'),
          where('userId', '==', userId)
        );
        
        const nuevosIdSnapshot = await getDocs(queryNuevosId);
        const nuevosPorId = nuevosIdSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filtrar duplicados (por si un archivo tiene ambos campos)
        const idsExistentes = new Set(archivosNuevos.map(a => a.id));
        archivosNuevos.push(...nuevosPorId.filter(a => !idsExistentes.has(a.id)));
      } catch (error) {
        logger.warn('âš ï¸ Error al obtener archivos nuevos:', error);
        // No romper, continuar con legacy
      }

      // Query 2: Archivos legacy (solo con auditId, sin estructura nueva)
      try {
        const queryLegacy = query(
          collection(db, 'files'),
          where('metadata.customFields.auditId', '==', capacitacionId),
          where('metadata.customFields.appName', '==', 'ControlAudit'),
          where('userId', '==', userId)
        );
        
        const legacySnapshot = await getDocs(queryLegacy);
        const archivosRaw = legacySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filtrar solo los que son realmente legacy
        archivosLegacy.push(...archivosRaw.filter(archivo => esArchivoLegacy(archivo)));
      } catch (error) {
        logger.warn('âš ï¸ Error al obtener archivos legacy:', error);
        // No romper, continuar con lo que tenemos
      }

      // Normalizar todos los archivos
      const todosArchivos = [
        ...archivosNuevos.map(normalizarArchivoCapacitacion),
        ...archivosLegacy.map(normalizarArchivoCapacitacion)
      ].filter(archivo => archivo && esArchivoValido(archivo));

      logger.debug(`âœ… Archivos obtenidos para capacitaciÃ³n ${capacitacionId}:`, {
        total: todosArchivos.length,
        nuevos: archivosNuevos.length,
        legacy: archivosLegacy.length
      });

      return todosArchivos;
    } catch (error) {
      logger.error('âŒ Error al obtener archivos de capacitaciÃ³n:', error);
      return [];
    }
  }

  /**
   * Obtiene solo archivos nuevos (con metadata completa)
   * Ãštil para reportes y queries avanzadas
   * 
   * @param {string} capacitacionId - ID de la capacitaciÃ³n
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Array de archivos nuevos normalizados
   */
  async getArchivosNuevos(capacitacionId, userId) {
    try {
      const todosArchivos = await this.getArchivosCapacitacion(capacitacionId, userId);
      const { nuevos } = separarArchivosPorTipo(todosArchivos);
      return nuevos;
    } catch (error) {
      logger.error('âŒ Error al obtener archivos nuevos:', error);
      return [];
    }
  }

  /**
   * Obtiene solo archivos legacy (sin metadata completa)
   * Ãštil para auditorÃ­as y migraciones
   * 
   * @param {string} capacitacionId - ID de la capacitaciÃ³n
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Array de archivos legacy normalizados
   */
  async getArchivosLegacy(capacitacionId, userId) {
    try {
      const todosArchivos = await this.getArchivosCapacitacion(capacitacionId, userId);
      const { legacy } = separarArchivosPorTipo(todosArchivos);
      return legacy;
    } catch (error) {
      logger.error('âŒ Error al obtener archivos legacy:', error);
      return [];
    }
  }
}

// Instancia singleton
const capacitacionImageService = new CapacitacionImageService();

export default capacitacionImageService;

