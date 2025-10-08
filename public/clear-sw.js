// Script temporal para limpiar Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('✅ Service Worker desregistrado');
    });
  });
}

// Limpiar cachés
caches.keys().then(keys => {
  keys.forEach(key => {
    caches.delete(key);
    console.log('✅ Caché eliminada:', key);
  });
});

// Recargar después de 2 segundos
setTimeout(() => {
  window.location.reload();
}, 2000);

