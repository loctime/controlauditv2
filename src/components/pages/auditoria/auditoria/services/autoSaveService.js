import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../firebaseConfig';
import { getOfflineDatabase, generateOfflineId, checkStorageLimit } from '../../../../../services/offlineDatabase';
import syncQueueService from '../../../../../services/syncQueue';

class AutoSaveService {
  constructor() {
    this.storageKey = 'auditoria_autosave';
    this.lastSaveTime = null;
    this.isSaving = false;
    this.isOnline = navigator.onLine;
    this.offlineDb = null;
    
    // Configurar listeners de conectividad
    this.setupConnectivityListeners();
  }

  // Configurar listeners de conectividad
  setupConnectivityListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 AutoSaveService: Conexión restaurada');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 AutoSaveService: Conexión perdida');
    });
  }

  // Inicializar base de datos offline
  async initOfflineDatabase() {
    if (!this.offlineDb) {
      try {
        this.offlineDb = await getOfflineDatabase();
        console.log('✅ AutoSaveService: Base de datos offline inicializada');
      } catch (error) {
        console.error('❌ AutoSaveService: Error al inicializar base de datos offline:', error);
      }
    }
    return this.offlineDb;
  }

  // Generar ID único para la sesión de auditoría
  generateSessionId() {
    return `auditoria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Guardar en localStorage como respaldo
  saveToLocalStorage(data) {
    try {
      const saveData = {
        ...data,
        timestamp: Date.now(),
        sessionId: this.generateSessionId()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      console.log('💾 Datos guardados en localStorage');
      return true;
    } catch (error) {
      console.error('❌ Error al guardar en localStorage:', error);
      return false;
    }
  }

  // Cargar desde localStorage
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('📂 Datos cargados desde localStorage');
        return parsedData;
      }
    } catch (error) {
      console.error('❌ Error al cargar desde localStorage:', error);
    }
    return null;
  }

  // Limpiar datos guardados
  clearLocalStorage() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('🗑️ Datos de autoguardado limpiados');
    } catch (error) {
      console.error('❌ Error al limpiar localStorage:', error);
    }
  }

  // Guardar auditoría (online/offline automático)
  async saveAuditoria(userId, auditoriaData) {
    if (this.isSaving) {
      console.log('⏳ Ya hay un guardado en progreso...');
      return false;
    }

    this.isSaving = true;
    
    try {
      // Verificar conectividad
      if (this.isOnline) {
        return await this.saveToFirestore(userId, auditoriaData);
      } else {
        return await this.saveOffline(userId, auditoriaData);
      }
    } finally {
      this.isSaving = false;
    }
  }

  // Guardar en Firestore (online)
  async saveToFirestore(userId, auditoriaData) {
    try {
      const sessionId = this.generateSessionId();
      
      // Preparar datos para Firestore (sin imágenes reales, solo referencias)
      const imagenesParaFirestore = auditoriaData.imagenes.map(seccion => 
        seccion.map(img => img instanceof File ? 'image' : img)
      );
      
      const saveData = {
        ...auditoriaData,
        imagenes: imagenesParaFirestore, // Solo referencias para Firestore
        userId,
        sessionId,
        lastModified: new Date(),
        autoSaved: true
      };

      // Guardar en Firestore (solo metadatos)
      const docRef = doc(db, 'auditorias_autosave', sessionId);
      await setDoc(docRef, saveData);

      // IMPORTANTE: También guardar en IndexedDB con imágenes REALES
      await this.saveOffline(userId, auditoriaData);

      // También guardar en localStorage como respaldo (sin imágenes grandes)
      this.saveToLocalStorage(saveData);

      this.lastSaveTime = Date.now();
      console.log('✅ Autoguardado completado en Firestore + IndexedDB');
      
      return true;
    } catch (error) {
      console.error('❌ Error en autoguardado Firestore:', error);
      
      // Fallback a offline
      console.log('🔄 Fallback a guardado offline...');
      return await this.saveOffline(userId, auditoriaData);
    }
  }

  // Guardar offline en IndexedDB
  async saveOffline(userId, auditoriaData) {
    try {
      // Verificar límites de almacenamiento
      const storageCheck = await checkStorageLimit();
      if (!storageCheck.canStore) {
        throw new Error(`Límite de almacenamiento alcanzado: ${storageCheck.reason}`);
      }

      // Inicializar base de datos offline
      const db = await this.initOfflineDatabase();
      if (!db) {
        throw new Error('No se pudo inicializar la base de datos offline');
      }

      // Obtener datos completos del usuario del cache
      let userProfile = null;
      try {
        const request = indexedDB.open('controlaudit_offline_v1', 2);
        const cachedUser = await new Promise((resolve, reject) => {
          request.onsuccess = function(event) {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('settings')) {
              console.warn('[AutoSaveService] Object store "settings" no existe');
              resolve(null);
              return;
            }
            
            const transaction = db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            
            store.get('complete_user_cache').onsuccess = function(e) {
              const cached = e.target.result;
              if (cached && cached.value && cached.value.userProfile) {
                resolve(cached.value.userProfile);
              } else {
                console.warn('[AutoSaveService] No hay userProfile en cache');
                resolve(null);
              }
            };
            
            store.get('complete_user_cache').onerror = function(e) {
              console.warn('[AutoSaveService] Error al obtener cache:', e.target.error);
              resolve(null);
            };
          };
          
          request.onerror = function(event) {
            console.warn('[AutoSaveService] Error al abrir IndexedDB:', event.target.error);
            resolve(null);
          };
          
          request.onupgradeneeded = function(event) {
            const db = event.target.result;
            console.log('[AutoSaveService] Inicializando base de datos...');
            
            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings', { keyPath: 'key' });
              console.log('[AutoSaveService] Object store "settings" creado');
            }
          };
        });
        
        if (cachedUser) {
          userProfile = cachedUser;
          console.log('[AutoSaveService] Usuario encontrado en cache:', {
            uid: userProfile.uid,
            email: userProfile.email,
            displayName: userProfile.displayName,
            role: userProfile.role,
            clienteAdminId: userProfile.clienteAdminId
          });
        } else {
          console.warn('[AutoSaveService] No se encontró usuario en cache');
        }
      } catch (error) {
        console.warn('[AutoSaveService] Error al obtener usuario del cache:', error);
      }

      // Generar ID único para la auditoría offline
      const auditoriaId = generateOfflineId();
      
      // Preparar datos para IndexedDB con información completa del usuario
      const saveData = {
        id: auditoriaId,
        ...auditoriaData,
        userId,
        // Incluir datos completos del usuario para sincronización
        userEmail: userProfile?.email || 'usuario@ejemplo.com',
        usuarioEmail: userProfile?.email || 'usuario@ejemplo.com',
        userDisplayName: userProfile?.displayName || userProfile?.email || 'Usuario',
        userRole: userProfile?.role || 'operario',
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid || userId,
        creadoPor: userProfile?.uid || userId,
        creadoPorEmail: userProfile?.email || 'usuario@ejemplo.com',
        sessionId: this.generateSessionId(),
        lastModified: new Date(),
        autoSaved: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'pending_sync'
      };

      // Log para debugging
      console.log('[AutoSaveService] Datos que se van a guardar:', {
        auditoriaId: saveData.id,
        userId: saveData.userId,
        userEmail: saveData.userEmail,
        usuarioEmail: saveData.usuarioEmail,
        userDisplayName: saveData.userDisplayName,
        userRole: saveData.userRole,
        clienteAdminId: saveData.clienteAdminId,
        creadoPor: saveData.creadoPor,
        creadoPorEmail: saveData.creadoPorEmail,
        userProfileFromCache: userProfile ? {
          uid: userProfile.uid,
          email: userProfile.email,
          displayName: userProfile.displayName,
          role: userProfile.role,
          clienteAdminId: userProfile.clienteAdminId
        } : null
      });

      // Guardar auditoría en IndexedDB
      await db.put('auditorias', saveData);

      // Procesar y guardar fotos si existen - IMPORTANTE: guardar imágenes reales
      if (auditoriaData.imagenes && auditoriaData.imagenes.length > 0) {
        await this.saveOfflineImages(auditoriaData.imagenes, auditoriaId, db);
      }

      // Encolar para sincronización (solo si no es autoguardado)
      if (!auditoriaData.autoSaved) {
        await syncQueueService.enqueueAuditoria(saveData, 1);
      }

      // También guardar en localStorage como respaldo (sin imágenes)
      const datosParaLocalStorage = {
        ...saveData,
        imagenes: saveData.imagenes.map(seccion => seccion.map(img => img ? 'image' : null))
      };
      this.saveToLocalStorage(datosParaLocalStorage);

      this.lastSaveTime = Date.now();
      console.log('✅ Autoguardado completado offline:', auditoriaId);
      
      return true;
    } catch (error) {
      console.error('❌ Error en autoguardado offline:', error);
      
      // Fallback a localStorage
      this.saveToLocalStorage(auditoriaData);
      
      return false;
    }
  }

  // Guardar fotos offline en IndexedDB
  async saveOfflineImages(imagenes, auditoriaId, db) {
    try {
      if (!imagenes || !Array.isArray(imagenes)) {
        return;
      }

      let fotosGuardadas = 0;
      
      for (let seccionIndex = 0; seccionIndex < imagenes.length; seccionIndex++) {
        const seccionImagenes = imagenes[seccionIndex];
        
        if (!Array.isArray(seccionImagenes)) continue;

        for (let preguntaIndex = 0; preguntaIndex < seccionImagenes.length; preguntaIndex++) {
          const imagen = seccionImagenes[preguntaIndex];
          
          // Solo guardar si es un File object real (no string, no null, no undefined)
          if (imagen instanceof File) {
            // Convertir File a Blob y guardar en IndexedDB
            const fotoId = generateOfflineId();
            const fotoData = {
              id: fotoId,
              auditoriaId: auditoriaId,
              seccionIndex: seccionIndex,
              preguntaIndex: preguntaIndex,
              blob: imagen,
              mime: imagen.type,
              width: 0, // Se puede calcular si es necesario
              height: 0,
              size: imagen.size,
              createdAt: Date.now(),
              originalName: imagen.name
            };

            await db.put('fotos', fotoData);
            fotosGuardadas++;
            
            console.log(`📸 Foto guardada offline: ${fotoId} (sección ${seccionIndex}, pregunta ${preguntaIndex})`);
          }
        }
      }
      
      if (fotosGuardadas > 0) {
        console.log(`✅ ${fotosGuardadas} foto(s) guardada(s) en IndexedDB`);
      }
    } catch (error) {
      console.error('❌ Error al guardar fotos offline:', error);
      throw error;
    }
  }

  // Cargar desde Firestore
  async loadFromFirestore(userId, sessionId) {
    try {
      const docRef = doc(db, 'auditorias_autosave', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📂 Datos cargados desde Firestore');
        return data;
      }
    } catch (error) {
      console.error('❌ Error al cargar desde Firestore:', error);
    }
    
    return null;
  }

  // Verificar si hay datos guardados recientemente
  hasRecentAutoSave() {
    const savedData = this.loadFromLocalStorage();
    if (!savedData) return false;

    // Considerar "reciente" si fue guardado en las últimas 24 horas
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return savedData.timestamp > oneDayAgo;
  }

  // Obtener información del último guardado
  getLastSaveInfo() {
    const savedData = this.loadFromLocalStorage();
    if (!savedData) return null;

    return {
      timestamp: savedData.timestamp,
      sessionId: savedData.sessionId,
      lastModified: savedData.lastModified
    };
  }

  // Verificar si hay cambios sin guardar comparando con el último guardado
  hasUnsavedChanges(currentData, lastSavedData) {
    if (!lastSavedData) return true;

    // Comparar datos críticos
    const currentHash = this.generateDataHash(currentData);
    const savedHash = this.generateDataHash(lastSavedData);

    return currentHash !== savedHash;
  }

  // Generar hash simple de los datos
  generateDataHash(data) {
    const criticalData = {
      empresa: data.empresaSeleccionada?.id,
      sucursal: data.sucursalSeleccionada,
      formulario: data.formularioSeleccionadoId,
      respuestas: JSON.stringify(data.respuestas),
      comentarios: JSON.stringify(data.comentarios),
      imagenes: data.imagenes.length
    };

    return btoa(JSON.stringify(criticalData));
  }

  // Restaurar auditoría desde datos guardados
  async restoreAuditoria(userId) {
    try {
      // Primero intentar cargar desde IndexedDB (offline) - tiene imágenes reales
      const db = await this.initOfflineDatabase();
      if (db) {
        const offlineData = await db.getAllFromIndex('auditorias', 'by-userId', userId);
        if (offlineData && offlineData.length > 0) {
          // Filtrar solo auditorías incompletas (que no estén sincronizadas como completadas)
          const incompleteAuditorias = offlineData.filter(a => 
            a.status === 'pending_sync' && 
            !a.estadoCompletada &&
            (!a.auditoriaGenerada || a.activeStep < 4)
          );
          
          if (incompleteAuditorias.length > 0) {
            // Obtener la más reciente
            const latestOffline = incompleteAuditorias.sort((a, b) => b.updatedAt - a.updatedAt)[0];
            console.log('🔄 Restaurando auditoría desde IndexedDB:', latestOffline.id);
            
            // Cargar imágenes reales desde IndexedDB
            const auditoriaConImagenes = await this.restoreAuditoriaImages(latestOffline, db);
            
            return auditoriaConImagenes;
          }
        }
      }

      // Fallback a localStorage (pero luego cargar imágenes desde IndexedDB si existen)
      const localData = this.loadFromLocalStorage();
      if (localData && localData.userId === userId) {
        // Verificar que no esté completada
        if (!localData.estadoCompletada && (!localData.auditoriaGenerada || localData.activeStep < 4)) {
          console.log('🔄 Restaurando auditoría desde localStorage');
          
          // Intentar cargar imágenes desde IndexedDB si hay un id
          // Si no hay db todavía, intentar inicializarlo
          let dbForImages = db;
          if (localData.id && !dbForImages) {
            dbForImages = await this.initOfflineDatabase();
          }
          
          if (localData.id && dbForImages) {
            const auditoriaConImagenes = await this.restoreAuditoriaImages(localData, dbForImages);
            if (auditoriaConImagenes && auditoriaConImagenes.imagenes) {
              return auditoriaConImagenes;
            }
          }
          
          return localData;
        } else {
          // Si está completada, limpiar
          this.clearLocalStorage();
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error al restaurar auditoría:', error);
      return null;
    }
  }

  // Restaurar imágenes de una auditoría desde IndexedDB
  async restoreAuditoriaImages(auditoriaData, db) {
    try {
      if (!auditoriaData.id || !db) {
        return auditoriaData;
      }

      // Buscar fotos asociadas a esta auditoría
      const fotos = await db.getAllFromIndex('fotos', 'by-auditoriaId', auditoriaData.id);
      
      if (fotos.length === 0) {
        console.log('📸 No se encontraron fotos guardadas para esta auditoría');
        return auditoriaData;
      }

      console.log(`📸 Restaurando ${fotos.length} imágenes desde IndexedDB`);

      // Reconstruir el array de imágenes con los File objects
      const imagenesRestauradas = [...(auditoriaData.imagenes || [])];

      for (const foto of fotos) {
        const { seccionIndex, preguntaIndex, blob, mime, originalName } = foto;
        
        // Asegurar que el array tenga la estructura correcta
        if (!imagenesRestauradas[seccionIndex]) {
          imagenesRestauradas[seccionIndex] = [];
        }
        if (!Array.isArray(imagenesRestauradas[seccionIndex])) {
          imagenesRestauradas[seccionIndex] = [];
        }

        // Convertir Blob a File object
        if (blob instanceof Blob) {
          const file = new File([blob], originalName || `foto_${foto.id}.jpg`, {
            type: mime || 'image/jpeg',
            lastModified: foto.createdAt || Date.now()
          });
          
          imagenesRestauradas[seccionIndex][preguntaIndex] = file;
          console.log(`✅ Imagen restaurada: sección ${seccionIndex}, pregunta ${preguntaIndex}`);
        }
      }

      return {
        ...auditoriaData,
        imagenes: imagenesRestauradas
      };
    } catch (error) {
      console.error('❌ Error al restaurar imágenes:', error);
      return auditoriaData; // Retornar datos sin imágenes si hay error
    }
  }

  // Obtener auditorías offline pendientes
  async getOfflineAuditorias(userId) {
    try {
      const db = await this.initOfflineDatabase();
      if (!db) return [];

      const offlineAuditorias = await db.getAllFromIndex('auditorias', 'by-userId', userId);
      return offlineAuditorias.filter(a => a.status === 'pending_sync');
    } catch (error) {
      console.error('❌ Error al obtener auditorías offline:', error);
      return [];
    }
  }

  // Obtener estadísticas de almacenamiento offline
  async getOfflineStats() {
    try {
      const db = await this.initOfflineDatabase();
      if (!db) return null;

      const auditorias = await db.getAll('auditorias');
      const fotos = await db.getAll('fotos');
      const queueStats = await syncQueueService.getQueueStats();

      const totalSize = fotos.reduce((sum, foto) => sum + (foto.size || 0), 0);

      return {
        auditorias: {
          total: auditorias.length,
          pending: auditorias.filter(a => a.status === 'pending_sync').length,
          synced: auditorias.filter(a => a.status === 'synced').length,
          failed: auditorias.filter(a => a.status === 'error').length
        },
        fotos: {
          total: fotos.length,
          totalSize: totalSize
        },
        queue: queueStats
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas offline:', error);
      return null;
    }
  }

  // Limpiar datos antiguos (más de 7 días)
  async cleanupOldData() {
    try {
      const savedData = this.loadFromLocalStorage();
      if (savedData) {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (savedData.timestamp < oneWeekAgo) {
          this.clearLocalStorage();
          console.log('🧹 Datos antiguos limpiados');
        }
      }
    } catch (error) {
      console.error('❌ Error al limpiar datos antiguos:', error);
    }
  }
}

export default new AutoSaveService(); 