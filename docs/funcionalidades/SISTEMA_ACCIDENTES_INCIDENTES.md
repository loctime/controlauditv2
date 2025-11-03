# Sistema de Accidentes e Incidentes

## Resumen

Sistema completo para el registro y gestión de accidentes e incidentes laborales con soporte para múltiples empleados involucrados, gestión de días de reposo, y carga de imágenes.

## Características Principales

### 1. Registro de Accidentes
- Selección múltiple de empleados involucrados mediante checkboxes
- Switch individual para marcar empleados con días de reposo
- Al activar "días de reposo":
  - El empleado se marca como **inactivo** automáticamente
  - Se registra la fecha de inicio del reposo
  - Se reactiva automáticamente al cerrar el caso
- Campo de descripción detallada
- Carga de múltiples imágenes (opcional, máx 5MB por imagen)

### 2. Registro de Incidentes
- Selección múltiple de testigos/personal involucrado
- Campo de descripción detallada
- Carga de múltiples imágenes (opcional)
- No afecta el estado de los empleados

### 3. Gestión y Visualización
- **Página principal** `/accidentes` con:
  - Filtros por empresa, sucursal, tipo y estado
  - Tabla con paginación
  - Estadísticas en tiempo real
  - Modal de detalles con imágenes ampliables
  - Cambio de estado (abierto/cerrado)
  
- **Tab en Establecimiento** con:
  - Resumen estadístico por empresa
  - Últimos 3 registros
  - Botón para acceder a gestión completa

## Estructura de Datos

### Colección `accidentes`

```javascript
{
  empresaId: string,
  sucursalId: string,
  tipo: "accidente" | "incidente",
  fechaHora: Timestamp,
  descripcion: string,
  
  // Para ACCIDENTES
  empleadosInvolucrados: [
    {
      empleadoId: string,
      empleadoNombre: string,
      conReposo: boolean,
      fechaInicioReposo: Timestamp | null
    }
  ],
  
  // Para INCIDENTES
  testigos: [
    {
      empleadoId: string,
      empleadoNombre: string
    }
  ],
  
  imagenes: string[], // URLs de Firebase Storage
  estado: "abierto" | "cerrado",
  createdAt: Timestamp,
  reportadoPor: string
}
```

### Actualización de `empleados`

Campos agregados:
- `fechaInicioReposo`: Timestamp (opcional) - Se agrega cuando el empleado tiene reposo

## Archivos Creados

1. **`src/services/accidenteService.js`**
   - CRUD completo de accidentes/incidentes
   - Gestión de imágenes en Firebase Storage
   - Actualización automática del estado de empleados
   - Funciones de estadísticas

2. **`src/components/pages/accidentes/Accidentes.jsx`**
   - Página principal con tabla y filtros
   - Integración con modales
   - Sistema de paginación
   - Modal de detalles

3. **`src/components/pages/accidentes/NuevoAccidenteModal.jsx`**
   - Modal para reportar accidentes
   - Checkboxes de empleados con switch de reposo
   - Upload de imágenes con preview
   - Validaciones

4. **`src/components/pages/accidentes/NuevoIncidenteModal.jsx`**
   - Modal para reportar incidentes
   - Selección de testigos
   - Upload de imágenes con preview

## Archivos Modificados

1. **`src/components/pages/establecimiento/tabs/AccidentesTab.jsx`**
   - Reemplazado con vista de resumen
   - Estadísticas por tipo y estado
   - Últimos 3 registros

2. **`src/components/pages/establecimiento/EstablecimientosContainer.jsx`**
   - Botón "Accidentes" en header (junto a "Agregar Empresa")
   - Navega a `/accidentes`

3. **`src/router/routes.js`** y **`src/router/routesOptimized.js`**
   - Ruta `/accidentes` agregada

4. **`FIRESTORE_STRUCTURE.md`**
   - Documentación actualizada con nueva estructura
   - Notas sobre días de reposo

## Índices de Firestore Requeridos

```javascript
// accidentes
- (empresaId ASC, sucursalId ASC, fechaHora DESC)
- (sucursalId ASC, fechaHora DESC)
- (sucursalId ASC, tipo ASC, fechaHora DESC)
- (empresaId ASC, tipo ASC, estado ASC)
```

## Flujo de Uso

### Reportar un Accidente

1. Ir a `/accidentes` o hacer clic en "Accidentes" en el header de Establecimiento
2. Seleccionar empresa y sucursal
3. Clic en "Nuevo Accidente"
4. Seleccionar empleados involucrados
5. Para cada empleado, activar "Con días de reposo" si aplica
6. Escribir descripción detallada
7. (Opcional) Subir imágenes
8. Guardar → El sistema:
   - Crea el registro
   - Marca empleados como inactivos si tienen reposo
   - Guarda fecha de inicio de reposo
   - Sube imágenes a Storage

### Reportar un Incidente

1. Ir a `/accidentes`
2. Clic en "Nuevo Incidente"
3. Seleccionar testigos
4. Escribir descripción
5. (Opcional) Subir imágenes
6. Guardar

### Cerrar un Caso

1. Ver detalles del accidente/incidente
2. Clic en "Cerrar Caso"
3. El estado cambia a "cerrado"
4. **Si es un accidente con empleados con reposo**, estos se reactivan automáticamente

### Reactivar Empleado

La reactivación se hace automáticamente al cerrar el caso de accidente. El campo `fechaInicioReposo` permanece como registro histórico.

## Acceso

- Roles permitidos: `max`, `supermax`
- El botón aparece en el menú de navegación lateral
- También accesible desde el tab "Accidentes" en Establecimiento

## Consideraciones Técnicas

- Las imágenes se almacenan en `accidentes/{accidenteId}/`
- Límite de 5MB por imagen
- Validación de tipos de archivo (solo imágenes)
- Lazy loading de la página para mejor rendimiento
- Queries optimizadas con filtros compuestos




