// Service Worker para ControlAudit PWA
const CACHE_NAME = 'controlaudit-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-48x48.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/vite.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Eliminando cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Forzar recarga del manifest
      return self.clients.claim();
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Excluir ciertos dominios y tipos de requests
  const url = new URL(event.request.url);
  const isExternalAPI = url.hostname.includes('firestore.googleapis.com') || 
                       url.hostname.includes('googleapis.com') ||
                       url.hostname.includes('google.com') ||
                       url.hostname.includes('gstatic.com');
  
  const isChromeExtension = url.protocol === 'chrome-extension:';
  const isDataURL = url.protocol === 'data:';
  
  // No interceptar requests externos, extensiones o data URLs
  if (isExternalAPI || isChromeExtension || isDataURL) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - devolver respuesta
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Verificar si recibimos una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Solo cachear requests del mismo origen
            if (url.origin !== location.origin) {
              return response;
            }

            // Clonar la respuesta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.warn('Error al cachear:', error);
              });

            return response;
          }
        ).catch((error) => {
          console.warn('Error en fetch:', error);
          // Devolver una respuesta de error básica
          return new Response('Error de red', { status: 408, statusText: 'Request Timeout' });
        });
      })
  );
});

// Manejar notificaciones push (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de ControlAudit',
    icon: '/loguitoaudit.png',
    badge: '/loguitoaudit.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/loguitoaudit.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/loguitoaudit.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ControlAudit', options)
  );
});
