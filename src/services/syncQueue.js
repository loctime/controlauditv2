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
      
      // Verificar que el object store existe antes de acceder
      if (!db.objectStoreNames.contains('syncQueue')) {
        console.warn('⚠️ Object store "syncQueue" no existe, retornando estadísticas vacías');
        return {
          total: 0,
          totalIncludingFailed: 0,
          failed: 0,
          byType: {},
          byRetries: {},
          oldestItem: null,
          newestItem: null
        };
      }
      
      const allItems = await db.getAll('syncQueue');
      
      // Filtrar items fallidos y obtener solo los pendientes
      // Un item es pendiente si:
      // 1. No tiene status 'failed' (o no tiene status definido)
      // 2. Y tiene menos de maxRetries reintentos
      const pendingItems = allItems.filter(item => {
        const isFailed = item.status === 'failed' || (item.retries >= this.maxRetries);
        return !isFailed;
      });
      
      const stats = {
        total: pendingItems.length, // Solo contar items pendientes
        totalIncludingFailed: allItems.length, // Total incluyendo fallidos
        failed: allItems.filter(item => item.status === 'failed' || item.retries >= this.maxRetries).length,
        byType: {},
        byRetries: {},
        oldestItem: null,
        newestItem: null
      };

      pendingItems.forEach(item => {
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

      // Log temporal para debugging - mostrar items pendientes
      if (pendingItems.length > 0) {
        console.log('[getQueueStats] Items pendientes encontrados:', pendingItems.map(item => ({
          id: item.id,
          type: item.type,
          retries: item.retries,
          status: item.status,
          auditoriaId: item.auditoriaId
        })));
      }

      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de cola:', error);
      // Retornar estadísticas vacías en lugar de null para evitar errores
      return {
        total: 0,
        totalIncludingFailed: 0,
        failed: 0,
        byType: {},
        byRetries: {},
        oldestItem: null,
        newestItem: null
      };
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
          // Verificar si el item tiene datos válidos antes de procesar
          if (item.type === 'CREATE_AUDITORIA') {
            const auditoriaId = item.auditoriaId || item.payload?.id;
            if (auditoriaId) {
              // Verificar si la auditoría existe en IndexedDB y tiene datos completos
              const auditoria = await db.get('auditorias', auditoriaId);
              if (!auditoria || !auditoria.empresa || !auditoria.formulario) {
                // Si no tiene datos completos y ya tiene varios reintentos, marcar como fallido
                if (item.retries >= 3) {
                  console.warn(`⚠️ Item ${item.id} tiene datos incompletos después de ${item.retries} intentos, marcando como fallido`);
                  await this.handleItemError(item, new Error('Datos incompletos persistentes después de múltiples intentos'));
                  continue;
                }
              }
            }
          }
          
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
    
    const db = await getOfflineDatabase();
    let auditoriaData = item.payload;
    
    // Usar el auditoriaId del item si está disponible, o el ID del payload
    const auditoriaIdToSearch = item.auditoriaId || auditoriaData.id;
    
    // Si faltan datos críticos (empresa/formulario), intentar obtenerlos de IndexedDB
    if (!auditoriaData.empresa || !auditoriaData.formulario) {
      try {
        if (auditoriaIdToSearch) {
          const fullAuditoria = await db.get('auditorias', auditoriaIdToSearch);
          if (fullAuditoria) {
            console.log('[SyncQueue] Datos incompletos en cola, obteniendo de IndexedDB:', auditoriaIdToSearch);
            // Combinar datos de la cola con datos completos de IndexedDB
            auditoriaData = {
              ...fullAuditoria,
              ...auditoriaData, // Los datos de la cola tienen prioridad
              empresa: fullAuditoria.empresa || auditoriaData.empresa,
              formulario: fullAuditoria.formulario || auditoriaData.formulario,
              // Asegurar que el ID esté presente
              id: fullAuditoria.id || auditoriaData.id || auditoriaIdToSearch
            };
          } else {
            console.warn('[SyncQueue] Auditoría no encontrada en IndexedDB:', auditoriaIdToSearch);
            // Si no se encuentra en IndexedDB y ya tiene varios reintentos, marcar como fallido inmediatamente
            if (item.retries >= 3) {
              throw new Error(`Auditoría no encontrada en IndexedDB después de ${item.retries} intentos. Datos perdidos o corruptos.`);
            }
          }
        }
      } catch (error) {
        console.warn('[SyncQueue] No se pudo obtener auditoría completa de IndexedDB:', error);
        // Si ya tiene varios reintentos y sigue sin datos, marcar como fallido
        if (item.retries >= 3) {
          throw new Error(`No se pudieron obtener datos de IndexedDB después de ${item.retries} intentos: ${error.message}`);
        }
      }
    }
    
    // Validar que tengamos los datos requeridos antes de intentar sincronizar
    if (!auditoriaData.empresa || !auditoriaData.formulario) {
      // Si ya tiene varios reintentos y sigue sin datos críticos, marcar como fallido inmediatamente
      if (item.retries >= 3) {
        throw new Error(`Faltan datos requeridos permanentemente (empresa: ${!!auditoriaData.empresa}, formulario: ${!!auditoriaData.formulario}) después de ${item.retries} intentos. Item corrupto.`);
      }
      throw new Error(`Faltan datos requeridos (empresa: ${!!auditoriaData.empresa}, formulario: ${!!auditoriaData.formulario}) para sincronizar auditoría ${auditoriaIdToSearch || 'desconocida'}`);
    }
    
    // Log para debugging - verificar qué datos tenemos
    console.log('[SyncQueue] Datos de auditoría recibidos:', {
      userId: auditoriaData.userId,
      userEmail: auditoriaData.userEmail,
      usuarioEmail: auditoriaData.usuarioEmail,
      userDisplayName: auditoriaData.userDisplayName,
      userRole: auditoriaData.userRole,
      clienteAdminId: auditoriaData.clienteAdminId,
      creadoPor: auditoriaData.creadoPor,
      creadoPorEmail: auditoriaData.creadoPorEmail
    });
    
    // OBTENER PERFIL ACTUAL DEL USUARIO AUTENTICADO DESDE FIRESTORE
    // Esto asegura que usamos el clienteAdminId correcto del usuario actual
    // Usar función helper para obtener usuario de forma robusta (maneja problemas de timing)
    let currentUserProfile = null;
    try {
      const { auth, db: firestoreDb } = await import('../firebaseControlFile');
      const { onAuthStateChanged } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');
      
      // Función helper para obtener usuario actual de forma robusta
      const getCurrentUser = () => {
        return new Promise((resolve, reject) => {
          if (auth.currentUser) {
            resolve(auth.currentUser);
            return;
          }
          
          // Si no está disponible inmediatamente, esperar un poco (problema de timing)
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
              resolve(user);
            } else {
              reject(new Error('Usuario no autenticado'));
            }
          });
          
          // Timeout después de 1 segundo
          setTimeout(() => {
            unsubscribe();
            reject(new Error('Timeout esperando autenticación'));
          }, 1000);
        });
      };
      
      try {
        const currentUser = await getCurrentUser();
        const userProfileRef = doc(firestoreDb, 'apps', 'audit', 'users', currentUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
          currentUserProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            ...userProfileSnap.data()
          };
          console.log('[SyncQueue] ✅ Perfil actual obtenido desde Firestore:', {
            uid: currentUserProfile.uid,
            clienteAdminId: currentUserProfile.clienteAdminId,
            email: currentUserProfile.email,
            role: currentUserProfile.role
          });
        } else {
          console.warn('[SyncQueue] ⚠️ Perfil de usuario no encontrado en Firestore para:', currentUser.uid);
        }
      } catch (userError) {
        console.warn('[SyncQueue] ⚠️ No se pudo obtener usuario autenticado, usando datos offline:', userError.message);
      }
    } catch (error) {
      console.warn('[SyncQueue] ⚠️ No se pudo obtener perfil actual desde Firestore, usando datos offline:', error.message);
    }
    
    // Usar perfil actual si está disponible, sino usar datos offline como fallback
    const userProfile = currentUserProfile || {
      uid: auditoriaData.userId || auditoriaData.creadoPor,
      email: auditoriaData.userEmail || auditoriaData.usuarioEmail || auditoriaData.creadoPorEmail || 'usuario@ejemplo.com',
      clienteAdminId: auditoriaData.clienteAdminId || auditoriaData.userId, // Fallback al uid si no hay clienteAdminId
      displayName: auditoriaData.userDisplayName || auditoriaData.userEmail || 'Usuario',
      role: auditoriaData.userRole || 'operario'
    };
    
    console.log('[SyncQueue] 📋 Usando userProfile para sincronización:', {
      uid: userProfile.uid,
      clienteAdminId: userProfile.clienteAdminId,
      email: userProfile.email,
      role: userProfile.role,
      source: currentUserProfile ? 'Firestore (actual)' : 'IndexedDB (offline)'
    });

    // Asegurar que los datos de auditoría también tengan los metadatos correctos
    auditoriaData.userId = auditoriaData.userId || auditoriaData.creadoPor || userProfile.uid;
    auditoriaData.userEmail = auditoriaData.userEmail || auditoriaData.usuarioEmail || auditoriaData.creadoPorEmail || userProfile.email;
    auditoriaData.usuarioEmail = auditoriaData.usuarioEmail || auditoriaData.userEmail || auditoriaData.creadoPorEmail || userProfile.email;
    auditoriaData.userDisplayName = auditoriaData.userDisplayName || userProfile.displayName;
    auditoriaData.userRole = auditoriaData.userRole || userProfile.role;
    auditoriaData.clienteAdminId = auditoriaData.clienteAdminId || userProfile.clienteAdminId;
    auditoriaData.creadoPor = auditoriaData.creadoPor || userProfile.uid;
    auditoriaData.creadoPorEmail = auditoriaData.creadoPorEmail || userProfile.email;

    // Procesar imágenes si existen
    if (auditoriaData.imagenes && auditoriaData.imagenes.length > 0) {
      auditoriaData.imagenes = await this.processOfflineImages(auditoriaData.imagenes, auditoriaData.id);
    }

    // Log para debugging
    console.log('[SyncQueue] Sincronizando auditoría con datos:', {
      auditoriaId: auditoriaData.id,
      empresa: auditoriaData.empresa,
      formulario: auditoriaData.formulario,
      userProfile: userProfile,
      auditoriaDataKeys: Object.keys(auditoriaData),
      auditoriaDataUserFields: {
        userId: auditoriaData.userId,
        userEmail: auditoriaData.userEmail,
        usuarioEmail: auditoriaData.usuarioEmail,
        userDisplayName: auditoriaData.userDisplayName,
        userRole: auditoriaData.userRole,
        clienteAdminId: auditoriaData.clienteAdminId,
        creadoPor: auditoriaData.creadoPor,
        creadoPorEmail: auditoriaData.creadoPorEmail
      }
    });

    // Guardar en Firebase
    const auditoriaId = await AuditoriaService.guardarAuditoria(auditoriaData, userProfile);
    
    // Actualizar estado en IndexedDB
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
        
        // ✅ REGLA DE ORO: Si imagen tiene fileId, preservar tal cual (ya fue subida)
        if (imagen && typeof imagen === 'object' && imagen.fileId) {
          console.log('[SyncQueue] Imagen ya sincronizada, preservando fileId:', imagen.fileId);
          seccionImagenes.push(imagen);
          continue;
        }
        
        // ✅ Si tiene url pero no fileId, preservar (compatibilidad)
        if (imagen && typeof imagen === 'object' && imagen.url && !imagen.fileId) {
          console.log('[SyncQueue] Imagen con URL preservada:', imagen.url);
          seccionImagenes.push(imagen);
          continue;
        }
        
        // Solo convertir a File si es referencia offline sin fileId
        if (imagen && typeof imagen === 'object' && imagen.id && !imagen.fileId) {
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
          // Preservar otros tipos (File, null, string, etc.)
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
    
    // Si el error indica que los datos están corruptos o perdidos permanentemente, marcar como fallido inmediatamente
    const isPermanentError = error.message.includes('permanentemente') || 
                            error.message.includes('Datos perdidos o corruptos') ||
                            error.message.includes('Item corrupto') ||
                            error.message.includes('no encontrada en IndexedDB después de');
    
    if (newRetries >= this.maxRetries || isPermanentError) {
      // Máximo de reintentos alcanzado o error permanente, marcar como error
      const reason = isPermanentError ? 'Error permanente (datos corruptos/perdidos)' : `Máximo de reintentos (${this.maxRetries}) alcanzado`;
      console.error(`❌ Item falló definitivamente: ${reason} -`, item.id);
      
      await db.put('syncQueue', {
        ...item,
        retries: Math.max(newRetries, this.maxRetries), // Asegurar que tenga al menos maxRetries
        lastError: error.message,
        status: 'failed'
      });

      this.notifyListeners('item_failed', { item, error: error.message, reason });
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
      // Filtrar items fallidos: status 'failed' o retries >= maxRetries
      const failedItems = allItems.filter(item => 
        item.status === 'failed' || item.retries >= this.maxRetries
      );
      
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
