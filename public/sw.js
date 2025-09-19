// Service Worker para ControlAudit PWA
const CACHE_NAME = 'controlaudit-v11';
const STATIC_CACHE = 'controlaudit-static-v11';
const DYNAMIC_CACHE = 'controlaudit-dynamic-v11';

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
  '/clear-cache.js',
  // Páginas principales para funcionamiento offline
  '/dashboard',
  '/auditoria',
  '/establecimientos',
  '/formularios',
  '/reportes',
  '/perfil'
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

// Función para crear respuestas offline
const createOfflineResponse = (request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  if (pathname.includes('.js')) {
    // Para archivos JS, devolver un módulo vacío válido
    return new Response('export {};', {
      status: 200,
      statusText: 'OK',
      headers: { 
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache'
      }
    });
  } else if (pathname.includes('.css')) {
    return new Response('/* Recurso no disponible offline */', {
      status: 200,
      statusText: 'OK',
      headers: { 
        'Content-Type': 'text/css',
        'Cache-Control': 'no-cache'
      }
    });
  } else if (pathname.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
    return new Response('', {
      status: 404,
      statusText: 'Not Found'
    });
  }
  
  return new Response('Recurso no disponible offline', { 
    status: 404, 
    statusText: 'Not Found' 
  });
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

          // Solo intentar fetch si estamos online
          if (navigator.onLine) {
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
                return createOfflineResponse(event.request);
              });
          } else {
            // Si estamos offline, devolver respuesta offline directamente
            console.log('📱 Offline - devolviendo respuesta offline para:', event.request.url);
            return createOfflineResponse(event.request);
          }
        })
    );
    return;
  }

  // Estrategia Network First para navegación
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('📦 Cache hit (navigate):', event.request.url);
            return response;
          }

          // Solo intentar fetch si estamos online
          if (navigator.onLine) {
            return fetch(event.request)
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
              });
          } else {
            // Si estamos offline, intentar servir index.html desde cache
            console.log('📱 Offline - intentando servir index.html desde cache');
            return caches.match('/index.html')
              .then((response) => {
                if (response) {
                  return response;
                }
                // Si no hay index.html en cache, devolver una respuesta básica
                return new Response('<!DOCTYPE html><html><head><title>ControlAudit</title></head><body><h1>ControlAudit Offline</h1><p>La aplicación no está disponible offline. Conecta a internet para continuar.</p></body></html>', {
                  status: 200,
                  statusText: 'OK',
                  headers: {
                    'Content-Type': 'text/html'
                  }
                });
              });
          }
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

        // Solo intentar fetch si estamos online
        if (navigator.onLine) {
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
              return createOfflineResponse(event.request);
            });
        } else {
          // Si estamos offline, devolver respuesta offline directamente
          console.log('📱 Offline - devolviendo respuesta offline para:', event.request.url);
          return createOfflineResponse(event.request);
        }
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
