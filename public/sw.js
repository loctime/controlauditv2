// Service Worker para ControlAudit PWA
const CACHE_NAME = 'controlaudit-v7';
const STATIC_CACHE = 'controlaudit-static-v7';
const DYNAMIC_CACHE = 'controlaudit-dynamic-v7';

// Recursos críticos que deben estar siempre en cache
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
  '/vite.svg',
  '/loguitoaudit.png',
  '/clear-cache.js'
];

// Patrones de recursos que deben ser cacheados dinámicamente
const CACHE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/
];

// Función para verificar si un recurso debe ser cacheado
const shouldCache = (url) => {
  const urlObj = new URL(url);
  
  // Solo cachear recursos del mismo origen
  if (urlObj.origin !== location.origin) {
    return false;
  }
  
  // Cachear si coincide con algún patrón
  return CACHE_PATTERNS.some(pattern => pattern.test(urlObj.pathname));
};

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Cacheando recursos críticos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Recursos críticos cacheados');
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Solo eliminar caches antiguos
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Excluir ciertos dominios y tipos de requests
  const isExternalAPI = url.hostname.includes('firestore.googleapis.com') || 
                       url.hostname.includes('googleapis.com') ||
                       url.hostname.includes('google.com') ||
                       url.hostname.includes('gstatic.com') ||
                       url.hostname.includes('api.controlaudit.app');
  
  const isChromeExtension = url.protocol === 'chrome-extension:';
  const isDataURL = url.protocol === 'data:';
  const isBlob = url.protocol === 'blob:';
  
  // No interceptar requests externos, extensiones, data URLs o blobs
  if (isExternalAPI || isChromeExtension || isDataURL || isBlob) {
    return;
  }

  // Solo interceptar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  // Estrategia Cache First para recursos estáticos
  if (shouldCache(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('📦 Cache hit (static):', event.request.url);
            return response;
          }

          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                  console.log('💾 Recurso estático cacheado:', event.request.url);
                });

              return response;
            })
            .catch((error) => {
              console.warn('❌ Error en fetch estático:', error);
              return new Response('Recurso no disponible offline', { 
                status: 503, 
                statusText: 'Service Unavailable' 
              });
            });
        })
    );
    return;
  }

  // Estrategia Network First para navegación
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cachear la respuesta de navegación
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch((error) => {
          console.warn('❌ Error en navegación:', error);
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Para otros requests, usar estrategia por defecto
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('📦 Cache hit:', event.request.url);
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('💾 Recurso cacheado:', event.request.url);
              });

            return response;
          })
          .catch((error) => {
            console.warn('❌ Error en fetch:', error);
            return new Response('Recurso no disponible offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
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
