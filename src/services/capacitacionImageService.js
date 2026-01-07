// src/services/capacitacionImageService.js
import { uploadEvidence, ensureTaskbarFolder, ensureSubFolder, ensureCapacitacionFolder } from './controlFileB2Service';
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

/**
 * Servicio para manejar imágenes de capacitaciones
 * Soporta modo online y offline con sincronización automática
 * 
 * @deprecated La función uploadImage() ahora usa internamente el nuevo modelo de contexto de evento.
 * Se mantiene la API existente para compatibilidad total con código legacy.
 */
class CapacitacionImageService {

  /**
   * Subir imagen usando el nuevo modelo de contexto de evento
   * Función interna que usa uploadFileWithContext()
   * 
   * @private
   * @deprecated Esta función será removida en Iteración 2 cuando todos los componentes migren
   */
  async uploadImageNew(file, idToken, capacitacionEventoId, companyId, sucursalId = null, capacitacionTipoId = null, tipoArchivo = 'evidencia') {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      const userId = user.uid;

      // Obtener datos completos de la capacitación desde la colección multi-tenant
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
        console.warn('⚠️ No se pudo obtener datos de la capacitación:', error);
      }

      // Determinar valores finales
      const finalCompanyId = companyId || capacitacionData?.empresaId;
      const finalSucursalId = sucursalId || capacitacionData?.sucursalId;
      
      if (!finalCompanyId) {
        throw new Error('No se pudo obtener companyId para la capacitación');
      }
      
      if (!finalSucursalId) {
        throw new Error('No se pudo obtener sucursalId para la capacitación');
      }

      const finalTipoId = capacitacionTipoId || capacitacionData?.capacitacionTipoId;
      
      if (!finalTipoId || typeof finalTipoId !== 'string' || finalTipoId.trim() === '') {
        throw new Error('Capacitación sin capacitacionTipoId. Estado inválido. El capacitacionTipoId debe estar persistido en Firestore desde la creación.');
      }

      console.log(`[capacitacionImageService] 📤 [v1.0] Subiendo archivo con modelo de contexto: capacitacion/${capacitacionEventoId}/${tipoArchivo}`);

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
      console.error(`[capacitacionImageService] ❌ [v1.0] Error al subir archivo (${capacitacionEventoId}):`, errorMsg);
      throw error;
    }
  }

  /**
   * Subir imagen a ControlFile (modo online)
   * 
   * @deprecated Esta función ahora usa internamente el nuevo modelo de contexto de evento (v1.0).
   * Se mantiene la API existente para compatibilidad total con código legacy.
   * 
   * Migración: Los componentes deberían migrar a usar uploadFileWithContext() directamente.
   * Esta función será removida en Iteración 2 cuando todos los componentes migren.
   * 
   * @param {File} file - Archivo a subir
   * @param {string} idToken - Firebase ID Token del usuario autenticado (no usado en v1.0)
   * @param {string} capacitacionEventoId - ID del evento de capacitación (cada vez que se dicta)
   * @param {string} companyId - ID de la empresa
   * @param {string} sucursalId - ID de la sucursal (opcional, se obtendrá de la capacitación)
   * @param {string} capacitacionTipoId - ID del tipo de capacitación (opcional, se obtendrá de la capacitación)
   * @param {'evidencia' | 'material' | 'certificado'} tipoArchivo - Tipo de archivo
   * @returns {Promise<{fileId: string, shareToken: string}>}
   */
  async uploadImage(file, idToken, capacitacionEventoId, companyId, sucursalId = null, capacitacionTipoId = null, tipoArchivo = 'evidencia') {
    // Wrapper: usar nuevo sistema internamente pero mantener API legacy
    try {
      return await this.uploadImageNew(file, idToken, capacitacionEventoId, companyId, sucursalId, capacitacionTipoId, tipoArchivo);
    } catch (error) {
      // Fallback a sistema legacy solo si el nuevo sistema falla
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[capacitacionImageService] ⚠️ [v1.0] Fallback a legacy por error: ${errorMsg}`);
      return await this.uploadImageLegacy(file, idToken, capacitacionEventoId, companyId, sucursalId, capacitacionTipoId, tipoArchivo);
    }
  }

  /**
   * Subir imagen usando sistema legacy (fallback)
   * @private
   */
  async uploadImageLegacy(file, idToken, capacitacionEventoId, companyId, sucursalId = null, capacitacionTipoId = null, tipoArchivo = 'evidencia') {
    try {
      // Obtener userId del usuario autenticado
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      const userId = user.uid;

      // Obtener datos completos de la capacitación desde la colección multi-tenant
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
        console.warn('⚠️ No se pudo obtener datos de la capacitación:', error);
      }

      // Determinar valores finales
      const finalCompanyId = companyId || capacitacionData?.empresaId;
      const finalSucursalId = sucursalId || capacitacionData?.sucursalId;
      
      if (!finalCompanyId) {
        throw new Error('No se pudo obtener companyId para la capacitación');
      }
      
      if (!finalSucursalId) {
        throw new Error('No se pudo obtener sucursalId para la capacitación');
      }

      // ⚠️ capacitacionTipoId es OBLIGATORIO y debe venir persistido en Firestore
      // NO se recalcula, NO se normaliza, NO hay fallback
      const finalTipoId = capacitacionTipoId || capacitacionData?.capacitacionTipoId;
      
      if (!finalTipoId || typeof finalTipoId !== 'string' || finalTipoId.trim() === '') {
        throw new Error('Capacitación sin capacitacionTipoId. Estado inválido. El capacitacionTipoId debe estar persistido en Firestore desde la creación.');
      }
      
      console.log('[capacitacionImageService] 📁 [LEGACY] Creando estructura de carpetas:', {
        capacitacionTipoId: finalTipoId,
        capacitacionEventoId,
        companyId: finalCompanyId,
        sucursalId: finalSucursalId,
        tipoArchivo
      });
      
      // Asegurar estructura completa de carpetas:
      // Capacitaciones/{capacitacionTipoId}/{capacitacionEventoId}/{companyId}/{sucursalId}/{tipoArchivo}/
      // ⚠️ ESTRICTO: ensureCapacitacionFolder lanza error si falla, nunca devuelve null
      let targetFolderId;
      try {
        targetFolderId = await ensureCapacitacionFolder(
          finalTipoId,
          capacitacionEventoId,
          finalCompanyId,
          finalSucursalId,
          tipoArchivo
        );
        console.log('[capacitacionImageService] ✅ [LEGACY] Estructura de carpetas creada, targetFolderId:', targetFolderId);
      } catch (error) {
        // Propagar el error con contexto adicional - NO hacer fallback
        console.error('[capacitacionImageService] ❌ [LEGACY] Error al crear estructura de carpetas:', error);
        throw new Error(`Error al crear estructura de carpetas de capacitación: ${error.message}`);
      }
      
      // Validación explícita: parentId NUNCA puede ser null para capacitaciones
      if (!targetFolderId || typeof targetFolderId !== 'string' || targetFolderId.trim() === '') {
        throw new Error(`parentId inválido para capacitación: ${targetFolderId}. La estructura de carpetas debe crearse completamente antes de subir archivos.`);
      }
      
      console.log('[capacitacionImageService] 📤 [LEGACY] Subiendo archivo con parentId:', targetFolderId);
      
      const result = await uploadEvidence({
        file,
        auditId: capacitacionEventoId, // ⚠️ Solo compatibilidad legacy - capacitacionEventoId es el ID real
        companyId: finalCompanyId,
        parentId: targetFolderId, // ✅ NUNCA null - validado arriba
        fecha: new Date(),
        capacitacionTipoId: finalTipoId, // ✅ CLAVE
        sucursalId: finalSucursalId, // ✅ CLAVE
        tipoArchivo: tipoArchivo // ✅ CLAVE
      });

      return {
        fileId: result.fileId,
        shareToken: result.shareToken, // ✅ Retornar shareToken en lugar de fileURL
        uploadedAt: new Date().toISOString(),
        size: file.size,
        name: file.name,
        type: file.type,
        capacitacionTipoId: finalTipoId,
        capacitacionEventoId: capacitacionEventoId,
        companyId: finalCompanyId,
        sucursalId: finalSucursalId
      };
    } catch (error) {
      console.error('❌ [LEGACY] Error al subir imagen de capacitación:', error);
      throw error;
    }
  }

  /**
   * Guardar imagen offline en IndexedDB
   * @param {File} file - Archivo a guardar
   * @param {string} capacitacionId - ID de la capacitación
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
        companyId: companyId // Guardar companyId para sincronización
      };

      await db.put('fotos', imageData);

      // Encolar para sincronización
      await syncQueueService.enqueueCapacitacionImage({
        imageId,
        capacitacionId,
        companyId: companyId, // Incluir companyId si está disponible
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }, capacitacionId, 2);

      console.log(`📸 Imagen de capacitación guardada offline: ${imageId}`);

      return {
        id: imageId,
        offline: true,
        originalName: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('❌ Error al guardar imagen offline:', error);
      throw error;
    }
  }

  /**
   * Subir imagen (online o offline según conectividad)
   * @param {File} file - Archivo a subir
   * @param {string} idToken - Firebase ID Token del usuario autenticado
   * @param {string} capacitacionEventoId - ID del evento de capacitación (cada vez que se dicta)
   * @param {string} companyId - ID de la empresa (opcional, se obtendrá de la capacitación si no se proporciona)
   * @param {string} sucursalId - ID de la sucursal (opcional, se obtendrá de la capacitación si no se proporciona)
   * @param {boolean} isOnline - Si hay conexión a internet
   * @param {string} capacitacionTipoId - ID del tipo de capacitación (opcional, se generará del nombre)
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

    // Obtener datos de la capacitación desde la colección multi-tenant si faltan companyId, sucursalId o capacitacionTipoId
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
        console.warn('⚠️ No se pudo obtener datos de la capacitación:', error);
      }
    }

    if (!finalCompanyId) {
      throw new Error('No se pudo obtener companyId para la capacitación');
    }
    
    if (!finalSucursalId) {
      throw new Error('No se pudo obtener sucursalId para la capacitación');
    }

    // ⚠️ capacitacionTipoId es OBLIGATORIO - sin fallback, sin normalización
    if (!finalTipoId || typeof finalTipoId !== 'string' || finalTipoId.trim() === '') {
      throw new Error('Capacitación sin capacitacionTipoId. Estado inválido. El capacitacionTipoId debe estar persistido en Firestore desde la creación.');
    }

    if (isOnline) {
      try {
        return await this.uploadImage(file, idToken, capacitacionEventoId, finalCompanyId, finalSucursalId, finalTipoId, tipoArchivo);
      } catch (error) {
        console.warn('⚠️ Fallo en subida online, guardando offline:', error);
        // Si falla online, guardar offline (con companyId para sincronización posterior)
        const offlineResult = await this.saveImageOffline(file, capacitacionEventoId, finalCompanyId);
        // Guardar datos en el resultado offline para sincronización
        return { 
          ...offlineResult, 
          companyId: finalCompanyId, 
          sucursalId: finalSucursalId,
          capacitacionTipoId: finalTipoId // ✅ Usar el tipoId persistido, no generar
        };
      }
    } else {
      const offlineResult = await this.saveImageOffline(file, capacitacionEventoId, finalCompanyId);
      // Guardar datos en el resultado offline para sincronización
      return { 
        ...offlineResult, 
        companyId: finalCompanyId, 
        sucursalId: finalSucursalId,
        capacitacionTipoId: finalTipoId // ✅ Usar el tipoId persistido, no generar
      };
    }
  }

  /**
   * Agregar imagen a capacitación en Firestore
   * @param {string} capacitacionId - ID de la capacitación
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
        throw new Error('Capacitación no encontrada');
      }

      const capacitacionData = capacitacionSnap.data();
      const imagenes = capacitacionData.imagenes || [];

      // Agregar nueva imagen
      imagenes.push(imageMetadata);

      await updateDocWithAppId(capacitacionRef, {
        imagenes,
        updatedAt: new Date()
      });

      console.log(`✅ Imagen agregada a capacitación: ${capacitacionId}`);
    } catch (error) {
      console.error('❌ Error al agregar imagen a capacitación:', error);
      throw error;
    }
  }

  /**
   * Eliminar imagen de capacitación
   * @param {string} capacitacionId - ID de la capacitación
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
        throw new Error('Capacitación no encontrada');
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

      console.log(`✅ Imagen eliminada de capacitación: ${capacitacionId}`);
    } catch (error) {
      console.error('❌ Error al eliminar imagen:', error);
      throw error;
    }
  }

  /**
   * Obtener imágenes offline de una capacitación
   * @param {string} capacitacionId - ID de la capacitación
   * @returns {Promise<Array>} Array de imágenes offline
   */
  async getOfflineImages(capacitacionId) {
    try {
      const dbOffline = await getOfflineDatabase();
      const allFotos = await dbOffline.getAll('fotos');
      
      return allFotos.filter(
        foto => foto.capacitacionId === capacitacionId && foto.tipo === 'capacitacion'
      );
    } catch (error) {
      console.error('❌ Error al obtener imágenes offline:', error);
      return [];
    }
  }

  /**
   * Obtiene archivos de una capacitación desde ControlFile
   * Maneja tanto archivos nuevos (con metadata completa) como legacy (sin metadata completa)
   * Los archivos legacy se tratan como "archivos adjuntos" simples
   * 
   * @param {string} capacitacionId - ID de la capacitación
   * @param {string} userId - ID del usuario (para filtrar por usuario)
   * @returns {Promise<Array>} Array de archivos normalizados (nuevos + legacy)
   */
  async getArchivosCapacitacion(capacitacionId, userId) {
    try {
      if (!capacitacionId || !userId) {
        console.warn('⚠️ CapacitacionId o userId no proporcionado');
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
        console.warn('⚠️ Error al obtener archivos nuevos:', error);
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
        console.warn('⚠️ Error al obtener archivos legacy:', error);
        // No romper, continuar con lo que tenemos
      }

      // Normalizar todos los archivos
      const todosArchivos = [
        ...archivosNuevos.map(normalizarArchivoCapacitacion),
        ...archivosLegacy.map(normalizarArchivoCapacitacion)
      ].filter(archivo => archivo && esArchivoValido(archivo));

      console.log(`✅ Archivos obtenidos para capacitación ${capacitacionId}:`, {
        total: todosArchivos.length,
        nuevos: archivosNuevos.length,
        legacy: archivosLegacy.length
      });

      return todosArchivos;
    } catch (error) {
      console.error('❌ Error al obtener archivos de capacitación:', error);
      return [];
    }
  }

  /**
   * Obtiene solo archivos nuevos (con metadata completa)
   * Útil para reportes y queries avanzadas
   * 
   * @param {string} capacitacionId - ID de la capacitación
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Array de archivos nuevos normalizados
   */
  async getArchivosNuevos(capacitacionId, userId) {
    try {
      const todosArchivos = await this.getArchivosCapacitacion(capacitacionId, userId);
      const { nuevos } = separarArchivosPorTipo(todosArchivos);
      return nuevos;
    } catch (error) {
      console.error('❌ Error al obtener archivos nuevos:', error);
      return [];
    }
  }

  /**
   * Obtiene solo archivos legacy (sin metadata completa)
   * Útil para auditorías y migraciones
   * 
   * @param {string} capacitacionId - ID de la capacitación
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Array de archivos legacy normalizados
   */
  async getArchivosLegacy(capacitacionId, userId) {
    try {
      const todosArchivos = await this.getArchivosCapacitacion(capacitacionId, userId);
      const { legacy } = separarArchivosPorTipo(todosArchivos);
      return legacy;
    } catch (error) {
      console.error('❌ Error al obtener archivos legacy:', error);
      return [];
    }
  }
}

// Instancia singleton
const capacitacionImageService = new CapacitacionImageService();

export default capacitacionImageService;

