import { useCallback, useEffect, useState } from 'react';

// ✅ Configuración del cache
const CACHE_CONFIG = {
  EXPIRATION_TIME: 5 * 60 * 1000, // 5 minutos
  MAX_CACHE_SIZE: 10, // Máximo 10 formularios en cache
  CACHE_PREFIX: 'formulario_'
};

// ✅ Clase para manejar el cache de formularios
class FormularioCache {
  constructor() {
    this.prefix = CACHE_CONFIG.CACHE_PREFIX;
    this.maxSize = CACHE_CONFIG.MAX_CACHE_SIZE;
    this.expirationTime = CACHE_CONFIG.EXPIRATION_TIME;
  }

  // ✅ Generar clave del cache
  getCacheKey(formularioId) {
    return `${this.prefix}${formularioId}`;
  }

  // ✅ Guardar formulario en cache
  set(formularioId, data) {
    try {
      const cacheKey = this.getCacheKey(formularioId);
      const cacheData = {
        data,
        timestamp: Date.now(),
        lastAccessed: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Limpiar cache si excede el tamaño máximo
      this.cleanup();
      
      console.log('✅ Formulario cacheado:', formularioId);
      return true;
    } catch (error) {
      console.warn('⚠️ Error al cachear formulario:', error);
      return false;
    }
  }

  // ✅ Obtener formulario del cache
  get(formularioId) {
    try {
      const cacheKey = this.getCacheKey(formularioId);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      
      // Verificar si ha expirado
      if (Date.now() - cacheData.timestamp > this.expirationTime) {
        this.remove(formularioId);
        return null;
      }
      
      // Actualizar último acceso
      cacheData.lastAccessed = Date.now();
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      console.log('✅ Formulario recuperado del cache:', formularioId);
      return cacheData.data;
    } catch (error) {
      console.warn('⚠️ Error al recuperar cache:', error);
      return null;
    }
  }

  // ✅ Eliminar formulario del cache
  remove(formularioId) {
    try {
      const cacheKey = this.getCacheKey(formularioId);
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Formulario eliminado del cache:', formularioId);
      return true;
    } catch (error) {
      console.warn('⚠️ Error al eliminar del cache:', error);
      return false;
    }
  }

  // ✅ Limpiar cache expirado y mantener tamaño máximo
  cleanup() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      
      if (cacheKeys.length <= this.maxSize) return;
      
      // Obtener información de todos los caches
      const cacheInfo = cacheKeys.map(key => {
        try {
          const cached = localStorage.getItem(key);
          if (!cached) return null;
          
          const cacheData = JSON.parse(cached);
          return {
            key,
            lastAccessed: cacheData.lastAccessed || cacheData.timestamp,
            timestamp: cacheData.timestamp
          };
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      // Ordenar por último acceso (más antiguo primero)
      cacheInfo.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      // Eliminar los más antiguos hasta alcanzar el tamaño máximo
      const toRemove = cacheInfo.slice(0, cacheKeys.length - this.maxSize);
      toRemove.forEach(({ key }) => {
        localStorage.removeItem(key);
        console.log('🗑️ Cache limpiado:', key);
      });
    } catch (error) {
      console.warn('⚠️ Error al limpiar cache:', error);
    }
  }

  // ✅ Limpiar todo el cache
  clear() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('🗑️ Todo el cache de formularios limpiado');
      return true;
    } catch (error) {
      console.warn('⚠️ Error al limpiar todo el cache:', error);
      return false;
    }
  }

  // ✅ Obtener estadísticas del cache
  getStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      
      const stats = {
        total: cacheKeys.length,
        maxSize: this.maxSize,
        expirationTime: this.expirationTime
      };
      
      return stats;
    } catch (error) {
      console.warn('⚠️ Error al obtener estadísticas del cache:', error);
      return null;
    }
  }
}

// ✅ Instancia global del cache
const formularioCache = new FormularioCache();

// ✅ Hook personalizado para usar el cache
export const useFormularioCache = (formularioId) => {
  const [cachedData, setCachedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Cargar datos del cache
  const loadFromCache = useCallback(() => {
    if (!formularioId) return null;
    
    setIsLoading(true);
    const data = formularioCache.get(formularioId);
    setCachedData(data);
    setIsLoading(false);
    return data;
  }, [formularioId]);

  // ✅ Guardar datos en cache
  const saveToCache = useCallback((data) => {
    if (!formularioId || !data) return false;
    
    const success = formularioCache.set(formularioId, data);
    if (success) {
      setCachedData(data);
    }
    return success;
  }, [formularioId]);

  // ✅ Eliminar del cache
  const removeFromCache = useCallback(() => {
    if (!formularioId) return false;
    
    const success = formularioCache.remove(formularioId);
    if (success) {
      setCachedData(null);
    }
    return success;
  }, [formularioId]);

  // ✅ Cargar automáticamente al montar el componente
  useEffect(() => {
    if (formularioId) {
      loadFromCache();
    }
  }, [formularioId, loadFromCache]);

  return {
    cachedData,
    isLoading,
    loadFromCache,
    saveToCache,
    removeFromCache,
    cacheStats: formularioCache.getStats()
  };
};

// ✅ Hook para precargar formularios
export const usePreloadFormularios = (formularioIds) => {
  const [preloadedData, setPreloadedData] = useState({});
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadFormularios = useCallback(async () => {
    if (!formularioIds || formularioIds.length === 0) return;
    
    setIsPreloading(true);
    const preloaded = {};
    
    formularioIds.forEach(id => {
      const data = formularioCache.get(id);
      if (data) {
        preloaded[id] = data;
      }
    });
    
    setPreloadedData(preloaded);
    setIsPreloading(false);
    
    console.log(`✅ Precargados ${Object.keys(preloaded).length} formularios`);
  }, [formularioIds]);

  useEffect(() => {
    preloadFormularios();
  }, [preloadFormularios]);

  return {
    preloadedData,
    isPreloading,
    preloadFormularios
  };
};

// ✅ Funciones de utilidad para el cache
export const cacheUtils = {
  // ✅ Limpiar todo el cache
  clearAll: () => formularioCache.clear(),
  
  // ✅ Obtener estadísticas
  getStats: () => formularioCache.getStats(),
  
  // ✅ Limpiar cache expirado
  cleanup: () => formularioCache.cleanup(),
  
  // ✅ Verificar si un formulario está en cache
  has: (formularioId) => {
    try {
      const cacheKey = formularioCache.getCacheKey(formularioId);
      return localStorage.getItem(cacheKey) !== null;
    } catch {
      return false;
    }
  }
};

export default formularioCache; 