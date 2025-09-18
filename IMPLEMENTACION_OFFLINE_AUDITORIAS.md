# 📱 Implementación Offline para Auditorías - ControlAudit

## 🎯 Objetivo
Permitir a los usuarios realizar auditorías completas sin conexión a internet, con sincronización automática cuando vuelva la conectividad.

## 📋 Especificaciones Técnicas

### Límites de Almacenamiento
- **100 fotos por auditoría** (sin limitar al usuario)
- **3GB o 20 auditorías** (lo que ocurra primero)
- **Compresión 80%** (Fase 2)
- **Límites dinámicos** basados en `navigator.storage.estimate()`

### Experiencia de Usuario
- **Indicador discreto** de estado offline
- **Sincronización automática** + botón manual
- **Progreso de sincronización** visible
- **Exportación PDF** como respaldo si falla

## 🏗️ Arquitectura

### Mantener Sistema Actual
- ✅ **Firebase/Firestore** como backend
- ✅ **AutoSaveService** extendido
- ✅ **AuditoriaService** adaptado
- ✅ **Service Worker** actual extendido

### Nuevas Componentes
- 🆕 **IndexedDB** con librería `idb`
- 🆕 **Cola de sincronización** con backoff exponencial
- 🆕 **Detección de conectividad**
- 🆕 **Indicadores de estado offline**

## 📦 Dependencias a Instalar

```bash
npm install idb
```

## 🗄️ Esquema IndexedDB

### Base de Datos: `controlaudit_offline_v1`

```javascript
// Stores principales
auditorias: {
  key: 'id',
  value: {
    id: string,
    empresa: object,
    sucursal: string,
    formulario: object,
    secciones: array,
    respuestas: array,
    comentarios: array,
    imagenes: array,
    firmaAuditor: string,
    firmaResponsable: string,
    createdAt: number,
    updatedAt: number,
    status: 'draft' | 'pending_sync' | 'synced' | 'error'
  },
  indexes: {
    'by-updatedAt': number,
    'by-status': string
  }
}

fotos: {
  key: 'id',
  value: {
    id: string,
    auditoriaId: string,
    seccionIndex: number,
    preguntaIndex: number,
    blob: Blob,
    mime: string,
    width: number,
    height: number,
    size: number,
    createdAt: number
  },
  indexes: {
    'by-auditoriaId': string,
    'by-createdAt': number
  }
}

syncQueue: {
  key: 'id',
  value: {
    id: string,
    type: 'CREATE_AUDITORIA' | 'UPLOAD_PHOTO' | 'UPDATE_AUDITORIA',
    auditoriaId: string,
    payload: object,
    retries: number,
    lastError: string,
    createdAt: number,
    nextRetry: number
  },
  indexes: {
    'by-createdAt': number,
    'by-nextRetry': number
  }
}

settings: {
  key: 'key',
  value: {
    key: string,
    value: any
  }
}
```

## 🚀 Plan de Implementación

### Fase 1: Core Offline (CRÍTICO)

#### 1.1 Configurar IndexedDB
- [ ] Instalar librería `idb`
- [ ] Crear `src/services/offlineDatabase.js`
- [ ] Definir esquema de base de datos
- [ ] Crear funciones CRUD básicas

#### 1.2 Extender AutoSaveService
- [ ] Modificar `src/components/pages/auditoria/auditoria/services/autoSaveService.js`
- [ ] Agregar métodos para IndexedDB
- [ ] Mantener compatibilidad con localStorage
- [ ] Implementar detección de conectividad

#### 1.3 Adaptar AuditoriaService
- [ ] Modificar `src/components/pages/auditoria/auditoriaService.jsx`
- [ ] Agregar lógica offline/online
- [ ] Implementar cola de sincronización
- [ ] Mantener compatibilidad con Firebase

#### 1.4 Detección de Conectividad
- [ ] Crear `src/hooks/useConnectivity.js`
- [ ] Implementar `navigator.onLine` + listeners
- [ ] Agregar indicadores de estado en UI
- [ ] Manejar cambios de conectividad

#### 1.5 Cola de Sincronización
- [ ] Crear `src/services/syncQueue.js`
- [ ] Implementar backoff exponencial
- [ ] Procesar cola automáticamente
- [ ] Manejar errores y reintentos

#### 1.6 Indicadores de Estado
- [ ] Modificar header/navbar para mostrar estado
- [ ] Agregar indicador discreto de offline
- [ ] Mostrar progreso de sincronización
- [ ] Lista de auditorías pendientes

### Fase 2: Optimización (DESPUÉS)

#### 2.1 Compresión de Fotos
- [ ] Implementar compresión 80% al sincronizar
- [ ] Usar Web Worker para no bloquear UI
- [ ] Generar thumbnails para UI
- [ ] Optimizar tamaño de archivos

#### 2.2 Límites Dinámicos
- [ ] Implementar `navigator.storage.estimate()`
- [ ] Mostrar barra de progreso de espacio
- [ ] Límite dinámico 3GB o 20 auditorías
- [ ] Alertas de espacio insuficiente

#### 2.3 Exportación de Respaldo
- [ ] Crear función de exportación PDF
- [ ] Generar ZIP con auditorías completas
- [ ] Ofrecer descarga si falla sincronización
- [ ] Mantener datos hasta confirmar subida

## 🔧 Archivos a Modificar

### Nuevos Archivos
```
src/services/
├── offlineDatabase.js          # Configuración IndexedDB
├── syncQueue.js               # Cola de sincronización
└── connectivityService.js     # Detección de conectividad

src/hooks/
└── useConnectivity.js         # Hook para estado de red

src/components/common/
└── OfflineIndicator.jsx       # Indicador de estado offline
```

### Archivos a Modificar
```
src/components/pages/auditoria/auditoria/
├── services/autoSaveService.js    # Extender para IndexedDB
└── auditoriaService.jsx           # Adaptar para offline

src/components/layout/
└── Header.jsx                     # Agregar indicador offline

public/
└── sw.js                          # Extender service worker
```

## 🧪 Testing

### Casos de Prueba
- [ ] Crear auditoría sin internet
- [ ] Tomar 100 fotos offline
- [ ] Sincronizar cuando vuelva internet
- [ ] Manejar fallos de sincronización
- [ ] Límites de almacenamiento
- [ ] Exportación de respaldo

### Dispositivos de Prueba
- [ ] Android Chrome (PWA)
- [ ] iOS Safari (PWA)
- [ ] Desktop Chrome
- [ ] Diferentes tamaños de pantalla

## 📊 Métricas de Éxito

### Funcionalidad
- ✅ Auditorías completas offline
- ✅ Sincronización automática
- ✅ No pérdida de datos
- ✅ UX fluida

### Performance
- ✅ < 2 segundos para guardar offline
- ✅ < 5 segundos para sincronizar
- ✅ < 100MB por auditoría promedio
- ✅ < 3GB total de almacenamiento

## 🚨 Consideraciones Importantes

### iOS Safari
- Límites más conservadores (~0.5-1GB)
- Políticas de memoria estrictas
- Testing en dispositivo real necesario

### Android Chrome
- Cuotas más generosas
- Mejor soporte para IndexedDB
- Background sync disponible

### Seguridad
- Refrescar tokens antes de sincronizar
- Validar datos antes de subir
- Manejar errores de autenticación

## 📝 Notas de Implementación

### Orden de Desarrollo
1. **IndexedDB setup** → Base sólida
2. **AutoSaveService offline** → Funcionalidad core
3. **Detección conectividad** → UX básica
4. **Cola de sincronización** → Sincronización
5. **Indicadores UI** → Experiencia completa

### Compatibilidad
- Mantener funcionalidad online existente
- No romper flujo actual de auditorías
- Migración gradual de usuarios
- Fallback a localStorage si IndexedDB falla

---

## 🎯 Próximos Pasos

1. **Instalar dependencias** (`npm install idb`)
2. **Crear estructura IndexedDB**
3. **Implementar detección de conectividad**
4. **Extender AutoSaveService**
5. **Testing básico offline**

¿Listo para comenzar con la implementación? 🚀
