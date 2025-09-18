import { getOfflineDatabase, generateOfflineId } from './offlineDatabase';

/**
 * Servicio de cola de sincronización con backoff exponencial
 * Maneja la sincronización de auditorías offline con Firebase
 */
class SyncQueueService {
  constructor() {
    this.isProcessing = false;
    this.retryIntervals = [10000, 30000, 60000, 120000, 300000]; // 10s, 30s, 1m, 2m, 5m
    this.maxRetries = 5;
    this.processingInterval = null;
    this.listeners = new Set();
  }

  /**
   * Agregar listener para eventos de sincronización
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notificar a todos los listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Error en listener de sincronización:', error);
      }
    });
  }

  /**
   * Encolar auditoría para sincronización
   */
  async enqueueAuditoria(auditoriaData, priority = 1) {
    try {
      const db = await getOfflineDatabase();
      const queueId = generateOfflineId();
      
      const queueItem = {
        id: queueId,
        type: 'CREATE_AUDITORIA',
        auditoriaId: auditoriaData.id,
        payload: auditoriaData,
        retries: 0,
        lastError: null,
        createdAt: Date.now(),
        nextRetry: Date.now(),
        priority: priority
      };

      await db.add('syncQueue', queueItem);
      console.log('📝 Auditoría encolada para sincronización:', queueId);
      
      this.notifyListeners('enqueued', { type: 'auditoria', id: queueId });
      
      // Iniciar procesamiento si no está activo
      if (!this.isProcessing) {
        this.startProcessing();
      }

      return queueId;
    } catch (error) {
      console.error('❌ Error al encolar auditoría:', error);
      throw error;
    }
  }

  /**
   * Encolar foto para sincronización
   */
  async enqueuePhoto(photoData, auditoriaId, priority = 2) {
    try {
      const db = await getOfflineDatabase();
      const queueId = generateOfflineId();
      
      const queueItem = {
        id: queueId,
        type: 'UPLOAD_PHOTO',
        auditoriaId: auditoriaId,
        payload: photoData,
        retries: 0,
        lastError: null,
        createdAt: Date.now(),
        nextRetry: Date.now(),
        priority: priority
      };

      await db.add('syncQueue', queueItem);
      console.log('📸 Foto encolada para sincronización:', queueId);
      
      this.notifyListeners('enqueued', { type: 'photo', id: queueId });
      
      return queueId;
    } catch (error) {
      console.error('❌ Error al encolar foto:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de la cola
   */
  async getQueueStats() {
    try {
      const db = await getOfflineDatabase();
      const allItems = await db.getAll('syncQueue');
      
      const stats = {
        total: allItems.length,
        byType: {},
        byRetries: {},
        oldestItem: null,
        newestItem: null
      };

      allItems.forEach(item => {
        // Por tipo
        stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        
        // Por número de reintentos
        stats.byRetries[item.retries] = (stats.byRetries[item.retries] || 0) + 1;
        
        // Item más antiguo y más nuevo
        if (!stats.oldestItem || item.createdAt < stats.oldestItem.createdAt) {
          stats.oldestItem = item;
        }
        if (!stats.newestItem || item.createdAt > stats.newestItem.createdAt) {
          stats.newestItem = item;
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de cola:', error);
      return null;
    }
  }

  /**
   * Iniciar procesamiento de la cola
   */
  startProcessing() {
    if (this.isProcessing) {
      console.log('⏳ Procesamiento ya está activo');
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Iniciando procesamiento de cola de sincronización');
    
    this.notifyListeners('processing_started', {});
    
    // Procesar inmediatamente
    this.processQueue();
    
    // Configurar procesamiento periódico cada 30 segundos
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 30000);
  }

  /**
   * Detener procesamiento de la cola
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.isProcessing = false;
    console.log('⏹️ Procesamiento de cola detenido');
    
    this.notifyListeners('processing_stopped', {});
  }

  /**
   * Procesar items de la cola
   */
  async processQueue() {
    try {
      const db = await getOfflineDatabase();
      const now = Date.now();
      
      // Obtener items listos para procesar (ordenados por prioridad y fecha)
      const itemsToProcess = await db.getAllFromIndex(
        'syncQueue', 
        'by-nextRetry', 
        IDBKeyRange.upperBound(now)
      );

      if (itemsToProcess.length === 0) {
        console.log('📭 No hay items listos para procesar');
        return;
      }

      // Ordenar por prioridad (menor número = mayor prioridad) y fecha
      itemsToProcess.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.createdAt - b.createdAt;
      });

      console.log(`🔄 Procesando ${itemsToProcess.length} items de la cola`);

      for (const item of itemsToProcess) {
        try {
          await this.processItem(item);
        } catch (error) {
          console.error(`❌ Error procesando item ${item.id}:`, error);
          await this.handleItemError(item, error);
        }
      }

    } catch (error) {
      console.error('❌ Error en procesamiento de cola:', error);
    }
  }

  /**
   * Procesar un item individual
   */
  async processItem(item) {
    console.log(`🔄 Procesando item: ${item.type} (${item.id})`);
    
    this.notifyListeners('item_processing', { item });

    try {
      switch (item.type) {
        case 'CREATE_AUDITORIA':
          await this.syncAuditoria(item);
          break;
        case 'UPLOAD_PHOTO':
          await this.syncPhoto(item);
          break;
        case 'UPDATE_AUDITORIA':
          await this.updateAuditoria(item);
          break;
        default:
          throw new Error(`Tipo de item no soportado: ${item.type}`);
      }

      // Si llegamos aquí, el item se procesó exitosamente
      await this.removeItem(item.id);
      console.log(`✅ Item procesado exitosamente: ${item.id}`);
      
      this.notifyListeners('item_success', { item });

    } catch (error) {
      throw error; // Re-lanzar para manejo en processQueue
    }
  }

  /**
   * Sincronizar auditoría con Firebase
   */
  async syncAuditoria(item) {
    // Importar AuditoriaService dinámicamente para evitar dependencias circulares
    const { default: AuditoriaService } = await import('../components/pages/auditoria/auditoriaService');
    
    const auditoriaData = item.payload;
    const userProfile = {
      uid: auditoriaData.userId,
      email: auditoriaData.userEmail || 'usuario@ejemplo.com',
      clienteAdminId: auditoriaData.clienteAdminId
    };

    // Procesar imágenes si existen
    if (auditoriaData.imagenes && auditoriaData.imagenes.length > 0) {
      auditoriaData.imagenes = await this.processOfflineImages(auditoriaData.imagenes, auditoriaData.id);
    }

    // Guardar en Firebase
    const auditoriaId = await AuditoriaService.guardarAuditoria(auditoriaData, userProfile);
    
    // Actualizar estado en IndexedDB
    const db = await getOfflineDatabase();
    await db.put('auditorias', {
      ...auditoriaData,
      status: 'synced',
      syncedAt: Date.now(),
      firebaseId: auditoriaId
    });

    console.log(`✅ Auditoría sincronizada: ${auditoriaId}`);
  }

  /**
   * Procesar imágenes offline para sincronización
   */
  async processOfflineImages(imagenes, auditoriaId) {
    const db = await getOfflineDatabase();
    const imagenesProcesadas = [];

    for (let seccionIndex = 0; seccionIndex < imagenes.length; seccionIndex++) {
      const seccionImagenes = [];
      const seccionActual = imagenes[seccionIndex];

      if (!Array.isArray(seccionActual)) {
        imagenesProcesadas.push([]);
        continue;
      }

      for (let preguntaIndex = 0; preguntaIndex < seccionActual.length; preguntaIndex++) {
        const imagen = seccionActual[preguntaIndex];
        
        if (imagen && typeof imagen === 'object' && imagen.id) {
          // Es una imagen offline, obtener el blob
          const fotoData = await db.get('fotos', imagen.id);
          if (fotoData && fotoData.blob) {
            // Convertir blob a File para compatibilidad con AuditoriaService
            const file = new File([fotoData.blob], fotoData.originalName, {
              type: fotoData.mime
            });
            seccionImagenes.push(file);
          } else {
            seccionImagenes.push(null);
          }
        } else {
          seccionImagenes.push(imagen);
        }
      }

      imagenesProcesadas.push(seccionImagenes);
    }

    return imagenesProcesadas;
  }

  /**
   * Sincronizar foto individual
   */
  async syncPhoto(item) {
    // Implementar sincronización de foto individual si es necesario
    console.log('📸 Sincronizando foto individual:', item.id);
    // Por ahora, las fotos se sincronizan junto con la auditoría
  }

  /**
   * Actualizar auditoría existente
   */
  async updateAuditoria(item) {
    // Implementar actualización de auditoría si es necesario
    console.log('🔄 Actualizando auditoría:', item.id);
  }

  /**
   * Manejar error en procesamiento de item
   */
  async handleItemError(item, error) {
    const db = await getOfflineDatabase();
    const newRetries = item.retries + 1;
    
    if (newRetries >= this.maxRetries) {
      // Máximo de reintentos alcanzado, marcar como error
      console.error(`❌ Item falló definitivamente después de ${this.maxRetries} intentos:`, item.id);
      
      await db.put('syncQueue', {
        ...item,
        retries: newRetries,
        lastError: error.message,
        status: 'failed'
      });

      this.notifyListeners('item_failed', { item, error: error.message });
    } else {
      // Calcular próximo reintento con backoff exponencial
      const retryDelay = this.retryIntervals[Math.min(newRetries - 1, this.retryIntervals.length - 1)];
      const nextRetry = Date.now() + retryDelay;
      
      await db.put('syncQueue', {
        ...item,
        retries: newRetries,
        lastError: error.message,
        nextRetry: nextRetry
      });

      console.log(`⏰ Item reprogramado para reintento ${newRetries}/${this.maxRetries} en ${retryDelay/1000}s:`, item.id);
      
      this.notifyListeners('item_retry', { item, retries: newRetries, nextRetry });
    }
  }

  /**
   * Eliminar item de la cola
   */
  async removeItem(itemId) {
    try {
      const db = await getOfflineDatabase();
      await db.delete('syncQueue', itemId);
    } catch (error) {
      console.error('❌ Error al eliminar item de cola:', error);
    }
  }

  /**
   * Limpiar cola de items fallidos
   */
  async clearFailedItems() {
    try {
      const db = await getOfflineDatabase();
      const allItems = await db.getAll('syncQueue');
      const failedItems = allItems.filter(item => item.retries >= this.maxRetries);
      
      for (const item of failedItems) {
        await db.delete('syncQueue', item.id);
      }

      console.log(`🧹 ${failedItems.length} items fallidos eliminados de la cola`);
      this.notifyListeners('queue_cleared', { count: failedItems.length });
      
      return failedItems.length;
    } catch (error) {
      console.error('❌ Error al limpiar cola:', error);
      throw error;
    }
  }

  /**
   * Obtener estado del procesamiento
   */
  getProcessingState() {
    return {
      isProcessing: this.isProcessing,
      hasInterval: !!this.processingInterval,
      listenersCount: this.listeners.size
    };
  }
}

// Instancia singleton
const syncQueueService = new SyncQueueService();

export default syncQueueService;
