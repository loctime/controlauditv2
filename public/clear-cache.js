// Script para limpiar cache y forzar actualización del Service Worker
window.clearCache = function() {
  console.log('🧹 Limpiando cache y Service Worker...');
  
  // Limpiar todos los caches
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('🗑️ Eliminando cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      console.log('✅ Todos los caches eliminados');
    });
  }
  
  // Desregistrar Service Workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        console.log('🗑️ Desregistrando SW:', registration.scope);
        registration.unregister();
      }
    });
  }
  
  // Limpiar localStorage relacionado con la app
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('controlaudit_') || key.startsWith('vite-'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    console.log('🗑️ Eliminando localStorage:', key);
    localStorage.removeItem(key);
  });
  
  // Limpiar IndexedDB
  if ('indexedDB' in window) {
    try {
      indexedDB.deleteDatabase('controlaudit_offline_v1');
      console.log('🗑️ IndexedDB eliminado');
    } catch (error) {
      console.warn('⚠️ Error eliminando IndexedDB:', error);
    }
  }
  
  console.log('✅ Limpieza completada. Recarga la página.');
  
  // Recargar automáticamente después de 2 segundos
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};

// Ejecutar automáticamente si se llama directamente
if (window.location.search.includes('clear-cache')) {
  window.clearCache();
}
