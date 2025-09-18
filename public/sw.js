// Service Worker para ControlAudit PWA
const CACHE_NAME = 'controlaudit-v6';
const STATIC_CACHE = 'controlaudit-static-v6';
const DYNAMIC_CACHE = 'controlaudit-dynamic-v6';

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
  '/loguitoaudit.png'
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

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - devolver respuesta
        if (response) {
          console.log('📦 Cache hit:', event.request.url);
          return response;
        }

        // Cache miss - intentar fetch
        return fetch(event.request)
          .then((response) => {
            // Verificar si recibimos una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Determinar qué cache usar
            const shouldCache = CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
            if (!shouldCache) {
              return response;
            }

            // Clonar la respuesta para cachear
            const responseToCache = response.clone();

            // Cachear en cache dinámico
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('💾 Recurso cacheados:', event.request.url);
              })
              .catch((error) => {
                console.warn('⚠️ Error al cachear:', error);
              });

            return response;
          })
          .catch((error) => {
            console.warn('❌ Error en fetch:', error);
            
            // Para rutas de la app, devolver index.html (SPA fallback)
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Para otros recursos, devolver respuesta de error
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
