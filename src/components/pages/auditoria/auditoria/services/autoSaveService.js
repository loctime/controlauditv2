import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../firebaseConfig';

class AutoSaveService {
  constructor() {
    this.storageKey = 'auditoria_autosave';
    this.lastSaveTime = null;
    this.isSaving = false;
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

  // Guardar en Firestore
  async saveToFirestore(userId, auditoriaData) {
    if (this.isSaving) {
      console.log('⏳ Ya hay un guardado en progreso...');
      return false;
    }

    this.isSaving = true;
    
    try {
      const sessionId = this.generateSessionId();
      const saveData = {
        ...auditoriaData,
        userId,
        sessionId,
        lastModified: new Date(),
        autoSaved: true
      };

      // Guardar en Firestore
      const docRef = doc(db, 'auditorias_autosave', sessionId);
      await setDoc(docRef, saveData);

      // También guardar en localStorage como respaldo
      this.saveToLocalStorage(saveData);

      this.lastSaveTime = Date.now();
      console.log('✅ Autoguardado completado en Firestore');
      
      return true;
    } catch (error) {
      console.error('❌ Error en autoguardado Firestore:', error);
      
      // Fallback a localStorage
      this.saveToLocalStorage(auditoriaData);
      
      return false;
    } finally {
      this.isSaving = false;
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
      // Primero intentar cargar desde localStorage
      const localData = this.loadFromLocalStorage();
      
      if (localData && localData.userId === userId) {
        console.log('🔄 Restaurando auditoría desde localStorage');
        return localData;
      }

      // Si no hay datos locales, intentar desde Firestore
      // (Aquí podrías implementar búsqueda de sesiones recientes)
      
      return null;
    } catch (error) {
      console.error('❌ Error al restaurar auditoría:', error);
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