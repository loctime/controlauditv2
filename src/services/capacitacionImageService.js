// src/services/capacitacionImageService.js
import { uploadEvidence } from './controlFileB2Service';
import { getOfflineDatabase, generateOfflineId } from './offlineDatabase';
import syncQueueService from './syncQueue';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseControlFile';

/**
 * Servicio para manejar imágenes de capacitaciones
 * Soporta modo online y offline con sincronización automática
 */
class CapacitacionImageService {
  /**
   * Subir imagen a ControlFile (modo online)
   * @param {File} file - Archivo a subir
   * @param {string} idToken - Firebase ID Token del usuario autenticado
   * @param {string} capacitacionId - ID de la capacitación
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<{fileId: string, fileURL: string}>}
   */
  async uploadImage(file, idToken, capacitacionId, companyId) {
    try {
      const result = await uploadEvidence({
        file,
        auditId: capacitacionId, // Reutilizar auditId para capacitaciones
        companyId,
        fecha: new Date()
      });

      return {
        fileId: result.fileId,
        fileURL: result.fileURL,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        name: file.name,
        type: file.type
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
   * @param {string} capacitacionId - ID de la capacitación
   * @param {string} companyId - ID de la empresa (opcional, se obtendrá de la capacitación si no se proporciona)
   * @param {boolean} isOnline - Si hay conexión a internet
   * @returns {Promise<Object>} Metadata de la imagen
   */
  async uploadImageSmart(file, idToken, capacitacionId, companyId = null, isOnline = navigator.onLine) {
    // Si no se proporciona companyId, intentar obtenerlo de la capacitación
    let finalCompanyId = companyId;
    if (!finalCompanyId) {
      try {
        const capacitacionRef = doc(db, 'capacitaciones', capacitacionId);
        const capacitacionSnap = await getDoc(capacitacionRef);
        if (capacitacionSnap.exists()) {
          finalCompanyId = capacitacionSnap.data().empresaId;
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener companyId de la capacitación:', error);
      }
    }

    if (!finalCompanyId) {
      throw new Error('No se pudo obtener companyId para la capacitación');
    }

    if (isOnline) {
      try {
        return await this.uploadImage(file, idToken, capacitacionId, finalCompanyId);
      } catch (error) {
        console.warn('⚠️ Fallo en subida online, guardando offline:', error);
        // Si falla online, guardar offline (con companyId para sincronización posterior)
        const offlineResult = await this.saveImageOffline(file, capacitacionId, finalCompanyId);
        // Guardar companyId en el resultado offline para sincronización
        return { ...offlineResult, companyId: finalCompanyId };
      }
    } else {
      const offlineResult = await this.saveImageOffline(file, capacitacionId, finalCompanyId);
      // Guardar companyId en el resultado offline para sincronización
      return { ...offlineResult, companyId: finalCompanyId };
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

      await updateDoc(capacitacionRef, {
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

      await updateDoc(capacitacionRef, {
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
}

// Instancia singleton
const capacitacionImageService = new CapacitacionImageService();

export default capacitacionImageService;

