# PWA / Modo Offline

## Qué hace

Permite usar el sistema sin conexión a internet. Las auditorías se crean y editan localmente, y se sincronizan automáticamente cuando se restaura la conectividad. Las fotos se almacenan como Blobs locales hasta poder subirlas.

## Cómo funciona

### Service Worker

`public/sw.js` gestiona el cache con tres capas:
- `controlaudit-v16` — cache principal
- `controlaudit-static-v16` — assets estáticos (JS, CSS, fuentes)
- `controlaudit-dynamic-v16` — contenido dinámico

Estrategia: **cache-first** para assets estáticos, **network-first** para datos.

Rutas pre-cacheadas: `/`, `/tablero`, `/auditoria`, `/establecimiento`, `/editar`, `/reporte`, `/perfil`.

### Base de datos local (IndexedDB)

`src/services/offlineDatabase.js` gestiona la base local con nombre `controlaudit_offline_v1` (versión 4).

Stores disponibles:

| Store | Propósito |
|---|---|
| `auditorias` | Auditorías en progreso y completadas |
| `fotos` | Fotos como Blobs, asociadas por `auditoriaId` |
| `syncQueue` | Cola de operaciones pendientes de sincronizar |
| `settings` | Configuración local |
| `userProfile` | Perfil del usuario cacheado |
| `empresas` | Lista de empresas cacheada |
| `formularios` | Formularios disponibles cacheados |

### Cola de sincronización

`src/services/syncQueue.js` maneja la sincronización con reintentos:

- Reintentos con backoff exponencial: 10s → 30s → 1min → 2min → 5min
- Máximo 5 reintentos por operación
- Deduplicación: no encola la misma auditoría dos veces
- Prioridades configurables

### Límites operativos

- Máximo **20 auditorías** pendientes de sincronización simultáneas
- Cuota de storage local: **3GB**
- Fotos offline: almacenadas como Blobs hasta sincronización

## Archivos clave

- `public/sw.js` — service worker
- `public/manifest.json` — metadata PWA
- `src/services/offlineDatabase.js` — IndexedDB
- `src/services/syncQueue.js` — cola de sync con reintentos
- `src/components/pages/auditoria/auditoria/services/autoSaveService.js` — autoguardado de auditorías

## Notas importantes

- El autoguardado guarda en dos lugares en paralelo: Firestore (`auditorias_autosave`) e IndexedDB. Firestore funciona como respaldo en la nube; IndexedDB como respaldo local.
- Los límites de 20 auditorías pendientes y 3GB no están documentados en ningún lugar visible de la UI. El usuario no recibe warning antes de llegar al límite.
- El número de versión del cache (`v16`) debe actualizarse manualmente cuando se hacen cambios que requieren invalidar el cache.
