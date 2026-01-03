// src/services/capacitacionImageService.js
import { uploadEvidence, ensureTaskbarFolder, ensureSubFolder, ensureCapacitacionFolder } from './controlFileB2Service';
import { getOfflineDatabase, generateOfflineId } from './offlineDatabase';
import syncQueueService from './syncQueue';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { 
  esArchivoLegacy, 
  normalizarArchivoCapacitacion,
  separarArchivosPorTipo,
  esArchivoValido
} from '../utils/capacitacionFileUtils';

/**
 * Servicio para manejar imágenes de capacitaciones
 * Soporta modo online y offline con sincronización automática
 */
class CapacitacionImageService {
  /**
   * Normaliza un nombre de capacitación a un ID de tipo válido para carpetas
   * Ej: "Uso de Matafuegos" -> "uso-de-matafuegos"
   * 
   * ⚠️ Valida que el resultado nunca sea vacío
   */
  _normalizarCapacitacionTipoId(nombre) {
    if (!nombre || typeof nombre !== 'string') {
      return 'capacitacion-generica';
    }
    
    const normalizado = nombre
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Eliminar guiones múltiples
      .replace(/^-|-$/g, ''); // Eliminar guiones al inicio/final
    
    // Si después de normalizar queda vacío, usar valor por defecto
    if (!normalizado || normalizado.length === 0) {
      return 'capacitacion-generica';
    }
    
    return normalizado;
  }

  /**
   * Subir imagen a ControlFile (modo online)
   * @param {File} file - Archivo a subir
   * @param {string} idToken - Firebase ID Token del usuario autenticado
   * @param {string} capacitacionEventoId - ID del evento de capacitación (cada vez que se dicta)
   * @param {string} companyId - ID de la empresa
   * @param {string} sucursalId - ID de la sucursal (opcional, se obtendrá de la capacitación)
   * @param {string} capacitacionTipoId - ID del tipo de capacitación (opcional, se generará del nombre)
   * @param {'evidencia' | 'material' | 'certificado'} tipoArchivo - Tipo de archivo
   * @returns {Promise<{fileId: string, shareToken: string}>}
   */
  async uploadImage(file, idToken, capacitacionEventoId, companyId, sucursalId = null, capacitacionTipoId = null, tipoArchivo = 'evidencia') {
    try {
      // Obtener datos completos de la capacitación
      let capacitacionData = null;
      try {
        const capacitacionRef = doc(db, 'capacitaciones', capacitacionEventoId);
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

      // Generar capacitacionTipoId desde el nombre si no se proporciona
      let finalTipoId = capacitacionTipoId;
      if (!finalTipoId) {
        const nombreCapacitacion = capacitacionData?.nombre || 'Capacitación Genérica';
        finalTipoId = this._normalizarCapacitacionTipoId(nombreCapacitacion);
      }
      
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
      } catch (error) {
        // Propagar el error con contexto adicional
        throw new Error(`Error al crear estructura de carpetas de capacitación: ${error.message}`);
      }
      
      // Validación explícita: parentId NUNCA puede ser null para capacitaciones
      if (!targetFolderId || typeof targetFolderId !== 'string' || targetFolderId.trim() === '') {
        throw new Error(`parentId inválido para capacitación: ${targetFolderId}. La estructura de carpetas debe crearse completamente antes de subir archivos.`);
      }
      
      const result = await uploadEvidence({
        file,
        auditId: capacitacionEventoId, // Reutilizar auditId para compatibilidad legacy
        companyId: finalCompanyId,
        parentId: targetFolderId, // ✅ NUNCA null - validado arriba
        fecha: new Date()
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
      console.error('❌ Error al subir imagen de capacitación:', error);
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
    // Obtener datos de la capacitación si faltan companyId o sucursalId
    let finalCompanyId = companyId;
    let finalSucursalId = sucursalId;
    
    if (!finalCompanyId || !finalSucursalId) {
      try {
        const capacitacionRef = doc(db, 'capacitaciones', capacitacionEventoId);
        const capacitacionSnap = await getDoc(capacitacionRef);
        if (capacitacionSnap.exists()) {
          const capacitacionData = capacitacionSnap.data();
          if (!finalCompanyId) {
            finalCompanyId = capacitacionData.empresaId;
          }
          if (!finalSucursalId) {
            finalSucursalId = capacitacionData.sucursalId;
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

    if (isOnline) {
      try {
        return await this.uploadImage(file, idToken, capacitacionEventoId, finalCompanyId, finalSucursalId, capacitacionTipoId, tipoArchivo);
      } catch (error) {
        console.warn('⚠️ Fallo en subida online, guardando offline:', error);
        // Si falla online, guardar offline (con companyId para sincronización posterior)
        const offlineResult = await this.saveImageOffline(file, capacitacionEventoId, finalCompanyId);
        // Guardar datos en el resultado offline para sincronización
        return { 
          ...offlineResult, 
          companyId: finalCompanyId, 
          sucursalId: finalSucursalId,
          capacitacionTipoId: capacitacionTipoId || this._normalizarCapacitacionTipoId('Capacitación Genérica')
        };
      }
    } else {
      const offlineResult = await this.saveImageOffline(file, capacitacionEventoId, finalCompanyId);
      // Guardar datos en el resultado offline para sincronización
      return { 
        ...offlineResult, 
        companyId: finalCompanyId, 
        sucursalId: finalSucursalId,
        capacitacionTipoId: capacitacionTipoId || this._normalizarCapacitacionTipoId('Capacitación Genérica')
      };
    }
  }

  /**
   * Agregar imagen a capacitación en Firestore
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} imageMetadata - Metadata de la imagen
   * @returns {Promise<void>}
   */
  async addImageToCapacitacion(capacitacionId, imageMetadata) {
    try {
      const capacitacionRef = doc(db, 'capacitaciones', capacitacionId);
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
  async removeImageFromCapacitacion(capacitacionId, imageId) {
    try {
      const capacitacionRef = doc(db, 'capacitaciones', capacitacionId);
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

