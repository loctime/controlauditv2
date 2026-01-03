# Notas para Iteración 2

## Qué queda pendiente

### 1. Validación de Existencia en Firestore

**Estado actual (Iteración 1):**
- Solo se validan tipos y campos requeridos
- No se verifica que `contextEventId`, `companyId`, `sucursalId` existan realmente

**Para Iteración 2:**
- Crear `contextValidator.ts` con validación de existencia
- Verificar que eventos existen antes de subir archivos
- Manejar modo offline con validación diferida

**Ubicación sugerida:** `src/services/contextValidator.ts`

### 2. Validación de Permisos

**Estado actual (Iteración 1):**
- No se valida que el usuario tenga acceso a `companyId` y `sucursalId`
- No se valida que `contextEventId` pertenezca al usuario

**Para Iteración 2:**
- Agregar validación de permisos en `contextValidator.ts`
- Verificar acceso a recursos antes de subir
- Manejar errores de permisos de forma clara

### 3. Servicio de Queries Avanzadas

**Estado actual (Iteración 1):**
- No existe servicio de queries
- Los componentes consultan archivos directamente desde Firestore

**Para Iteración 2:**
- Crear `contextFileQueryService.ts`
- Funciones: `getFilesByContext()`, `getFilesByContextType()`, etc.
- Detección automática de archivos legacy
- Normalización de resultados para UI

**Ubicación sugerida:** `src/services/contextFileQueryService.ts`

### 4. Índices Compuestos en Firestore

**Estado actual (Iteración 1):**
- Metadata plana permite queries simples
- No hay índices compuestos definidos

**Para Iteración 2:**
- Diseñar índices compuestos según necesidades de reportes:
  - `(contextType, contextEventId, uploadedAt DESC)`
  - `(contextType, companyId, tipoArchivo, uploadedAt DESC)`
  - `(contextType, sucursalId, uploadedAt DESC)`
- Documentar en `docs_v2/INDICES_FIRESTORE.md`

### 5. Migración de Archivos Legacy

**Estado actual (Iteración 1):**
- Archivos legacy coexisten con nuevos
- No hay migración automática

**Para Iteración 2:**
- Scripts de migración para archivos existentes
- Actualizar metadata de archivos legacy
- Validar integridad post-migración
- Herramientas de auditoría

**Ubicación sugerida:** `scripts/migrateLegacyFiles.js`

### 6. Reportes Cruzados

**Estado actual (Iteración 1):**
- No hay reportes cruzados por contexto

**Para Iteración 2:**
- Dashboard de auditoría de archivos por contexto
- Reportes cruzados (ej: archivos de capacitación y accidentes juntos)
- Análisis de uso de archivos

### 7. Limpieza de Código Legacy

**Estado actual (Iteración 1):**
- Wrappers legacy mantienen compatibilidad
- Funciones `uploadImageLegacy()` y `subirImagenesLegacy()` aún existen

**Para Iteración 2:**
- Remover funciones legacy cuando todos los componentes migren
- Eliminar código de `ensureCapacitacionFolder()` si ya no se usa
- Simplificar `uploadEvidence()` removiendo lógica legacy

## Mejoras de Performance (Iteración 2)

### Cache Mejorado
- Cache persistente (localStorage/IndexedDB)
- Invalidación inteligente cuando cambian eventos
- Métricas de hit rate

### Batch Operations
- Subida múltiple optimizada
- Queries batch para múltiples contextos

## Mejoras de UX (Iteración 2)

### Feedback Mejorado
- Progress indicators para subidas múltiples
- Mensajes de error más específicos
- Validación en tiempo real en formularios

## Criterios para Iniciar Iteración 2

- ✅ Al menos 2 módulos migrados y funcionando en producción
- ✅ Datos reales en Firestore con nuevo modelo
- ✅ Estabilidad validada de Iteración 1
- ✅ Necesidad identificada de queries avanzadas
- ✅ Recursos disponibles para implementación

## Notas Técnicas

### Versionado de Metadata

La metadata incluye `modelVersion: '1.0'` para facilitar migraciones futuras. En Iteración 2 se puede:
- Detectar archivos v1.0 vs v2.0
- Migrar automáticamente si es necesario
- Mantener compatibilidad hacia atrás

### Compatibilidad Legacy

Los wrappers legacy (`uploadImage()`, `subirImagenes()`) deben mantenerse hasta que:
- Todos los componentes UI migren
- No haya dependencias externas
- Se haya validado estabilidad completa

### Testing

Iteración 1 tiene tests básicos. Iteración 2 debería agregar:
- Tests de validación de existencia
- Tests de permisos
- Tests de queries avanzadas
- Tests de migración
