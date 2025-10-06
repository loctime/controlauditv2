// Script para forzar la actualización del Service Worker
// Ejecutar en la consola del navegador para limpiar caches y forzar actualización

console.log('🔄 Forzando actualización del Service Worker...');

// 1. Desregistrar el Service Worker actual
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('🗑️ Desregistrando SW:', registration.scope);
      registration.unregister();
    }
  });
}

// 2. Limpiar todos los caches
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

// 3. Recargar la página después de un breve delay
setTimeout(function() {
  console.log('🔄 Recargando página...');
  window.location.reload(true);
}, 1000);

console.log('✅ Script ejecutado. La página se recargará automáticamente.');
