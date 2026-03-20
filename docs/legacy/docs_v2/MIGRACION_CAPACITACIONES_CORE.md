# Migración de Capacitaciones al Núcleo Reutilizable

## 📋 Análisis y Mapeo

### Mapeo de Conceptos

| Capacitaciones (Actual) | Core Reutilizable | Notas |
|------------------------|-------------------|-------|
| `capacitacionId` | `entityId` | String normalizado |
| `empleadoIds` | `personas` | Array de strings o objetos |
| `imagenes` | `evidencias` | Array con `{id, shareToken, nombre, createdAt}` |
| `registrosAsistencia` | `registros` | Colección base |
| `getRegistrosByCapacitacion` | `getRegistriesByEntity` | Mismo contrato |
| `getEmpleadosUnicosByCapacitacion` | `getPersonasUnicasByEntity` | Mismo contrato |
| `getImagenesByCapacitacion` | `getEvidenciasByEntity` | Mismo contrato |
| `createRegistroAsistencia` | `createRegistry` | Necesita adapter |
| `attachImagesToRegistro` | `attachEvidencias` | Mismo contrato |

### Estructura de Datos

**Registro de Asistencia (Actual):**
```javascript
{
  capacitacionId: string,      // → entityId
  empleadoIds: string[],       // → personas (normalizar)
  imagenes: Array<{            // → evidencias
    id: string,
    fileId: string,
    shareToken: string,
    nombre: string,
    createdAt: Timestamp
  }>,
  fecha: Timestamp,
  creadoPor: string,
  createdAt: Timestamp,
  appId: 'auditoria'
}
```

**Personas (Normalización):**
- Entrada: `Array<string>` (IDs de empleados)
- Salida: `Array<string>` (mantener como strings, el core acepta ambos)

## 🔧 Adaptaciones Necesarias

### 1. Adapter para registrosAsistenciaService

**Opción A: Wrapper que implementa contrato del core (RECOMENDADA)**
- Mantiene métodos actuales para compatibilidad
- Agrega métodos del core internamente usando `createBaseRegistryService`
- Permite migración gradual

**Opción B: Refactor completo**
- Reemplaza implementación actual con `createBaseRegistryService`
- Más limpio pero requiere cambios en todos los lugares que usan el servicio

**Decisión: Opción A** - Mantener compatibilidad hacia atrás.

### 2. CapacitacionDetailPanel → EventDetailPanel

**Mapeo de Props:**
```javascript
// Actual
<CapacitacionDetailPanel
  open={boolean}
  onClose={() => void}
  capacitacionId={string}
  initialMode={'view' | 'registrar'}
  onRegistrarAsistencia={() => void}
  onMarcarCompletada={() => void}
  onEditarPlan={() => void}
  onRealizarCapacitacion={() => void}
/>

// Nuevo (usando EventDetailPanel)
<EventDetailPanel
  open={boolean}
  onClose={() => void}
  entityId={capacitacionId}
  initialMode={'view' | 'registrar'}
  userId={userProfile.uid}
  entityService={capacitacionServiceWrapper}
  registryService={registrosAsistenciaServiceAdapter}
  renderHeader={(capacitacion) => ReactNode}
  renderActions={(capacitacion) => ReactNode}
  renderRegistryForm={(props) => ReactNode}
/>
```

**Tabs:**
- Usar tabs por defecto del core (Resumen, Registros, Evidencias, Personas)
- Personalizar TabResumen si es necesario (mostrar info específica de capacitación)

### 3. RegistrarAsistenciaInline → EventRegistryInline

**Mapeo de Configuración:**
```javascript
<EventRegistryInline
  entityId={capacitacionId}
  entityType="capacitacion"
  userId={userId}
  entity={capacitacion}
  registryService={registrosAsistenciaServiceAdapter}
  personasConfig={{
    collectionName: 'empleados',
    filterBy: (capacitacion) => ({
      sucursalId: capacitacion?.sucursalId,
      estado: 'activo'
    }),
    normalize: (selectedIds) => selectedIds, // Mantener como strings
    fieldName: 'empleadoIds'
  }}
  evidenciasConfig={{
    folderName: 'Capacitaciones',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxCount: 20
  }}
  fields={[
    {
      id: 'personas',
      type: 'personas',
      label: 'Empleados Asistentes',
      required: true
    },
    {
      id: 'evidencias',
      type: 'evidencias',
      label: 'Evidencias Fotográficas'
    }
  ]}
/>
```

## 🎯 Plan de Implementación

### Fase 1: Crear Adapter del Servicio
1. Crear `registrosAsistenciaServiceAdapter` que:
   - Implementa contrato del core (`createRegistry`, `attachEvidencias`, etc.)
   - Usa `createBaseRegistryService` internamente
   - Mantiene métodos legacy para compatibilidad

### Fase 2: Adaptar Panel de Detalles
1. Crear `CapacitacionDetailPanelV2` que usa `EventDetailPanel`
2. Mantener `CapacitacionDetailPanel` original como fallback
3. Migrar gradualmente referencias

### Fase 3: Adaptar Formulario de Registro
1. Crear `RegistrarAsistenciaInlineV2` que usa `EventRegistryInline`
2. Mantener versión original como fallback
3. Migrar gradualmente

### Fase 4: Validación y Limpieza
1. Validar que todas las funcionalidades funcionen
2. Verificar estadísticas y tablas
3. Eliminar código legacy si todo funciona

## ⚠️ Consideraciones Especiales

### Estados de Capacitación
- `plan_anual`: No permite registrar asistencia directamente
- `activa`: Permite registrar asistencia
- `completada`: Solo lectura

### Acciones Específicas
- "Realizar Capacitación": Convierte `plan_anual` → `activa`
- "Marcar Completada": Cambia estado a `completada`
- "Registrar Asistencia": Solo disponible si `estado === 'activa'`

### Tabs Personalizados
- TabResumen puede necesitar mostrar información específica de capacitación
- Considerar agregar tab personalizado si es necesario

## 📝 Archivos a Modificar

### Nuevos
- `src/services/adapters/registrosAsistenciaServiceAdapter.js` - Adapter del servicio
- `src/components/pages/capacitaciones/components/CapacitacionDetailPanelV2.jsx` - Panel usando core

### Modificar
- `src/components/pages/capacitaciones/components/CapacitacionDetailPanel.jsx` - Migrar a usar core
- `src/components/pages/capacitaciones/components/RegistrarAsistenciaInline.jsx` - Migrar a usar core
- `src/components/pages/capacitaciones/Capacitaciones.jsx` - Actualizar referencias si es necesario

### Legacy (a eliminar después de validación)
- Ninguno por ahora (mantener compatibilidad)

## ✅ Checklist de Validación

- [ ] Panel se abre correctamente
- [ ] Tabs muestran datos correctos
- [ ] Registrar asistencia funciona
- [ ] Evidencias se suben y muestran correctamente
- [ ] Estadísticas se calculan correctamente
- [ ] Tabla de capacitaciones sigue funcionando
- [ ] Acciones (Realizar, Completar) funcionan
- [ ] Refresh sin reload funciona
- [ ] No hay regresiones en funcionalidad existente
