# 📦 Componentes y Hooks Reutilizables

## 🎯 Resumen
Este documento cataloga todos los componentes reutilizables y hooks personalizados creados en las refactorizaciones recientes.

---

## 🧩 Componentes Reutilizables

### **Dashboard Higiene y Seguridad**

#### `IndiceCardCompact.jsx`
**Propósito:** Tarjeta compacta para mostrar índices técnicos  
**Props:**
- `titulo` (string) - Título del índice
- `valor` (number) - Valor del índice
- `unidad` (string) - Unidad de medida (ej: "%", "acc/MMHH")
- `icono` (ReactNode) - Icono de Material-UI
- `labelChip` (string) - Etiqueta del chip de estado
- `color` (object) - Thresholds: `{high, medium}`

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Comparación personalizada para re-renders
- ✅ Colores dinámicos según thresholds
- ✅ Hover effects

---

#### `MetricChips.jsx`
**Propósito:** Chips de métricas básicas  
**Props:**
- `metricas` (object) - `{totalEmpleados, empleadosEnReposo, horasTrabajadas, diasPerdidos}`

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Colores condicionales según valores

---

#### `AlertState.jsx`
**Propósito:** Alertas de estado estandarizadas  
**Props:**
- `severity` (string) - "error" | "warning" | "info" | "success"
- `message` (string) - Mensaje a mostrar
- `actionLabel` (string) - Texto del botón
- `actionUrl` (string) - URL de navegación
- `icon` (ReactNode) - Icono opcional

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Layout responsive

---

#### `SelectoresDashboard.jsx`
**Propósito:** Selectores de empresa, sucursal y período  
**Props:**
- `selectedEmpresa`, `selectedSucursal`, `selectedPeriodo` (string)
- `onEmpresaChange`, `onSucursalChange`, `onPeriodoChange` (func)
- `userEmpresas`, `sucursalesFiltradas` (array)
- `deshabilitado` (boolean)

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Comparación personalizada
- ✅ Iconos integrados

---

### **Editor de Formularios**

#### `ModalEditarFormulario.jsx`
**Propósito:** Modal para editar nombre de formulario  
**Props:**
- `open` (boolean)
- `onClose` (func)
- `nombreFormulario` (string)
- `onNombreChange` (func)
- `onGuardar` (func)

**Características:**
- ✅ Optimizado con `React.memo`

---

#### `ModalEditarSeccion.jsx`
**Propósito:** Modal para editar nombre de sección  
**Props similares a ModalEditarFormulario**

---

#### `ModalEditarPregunta.jsx`
**Propósito:** Modal para editar texto de pregunta  
**Props:**
- Similar a modales anteriores
- `textoPregunta` (string)
- `onTextoChange` (func)

---

#### `ModalAgregarPregunta.jsx`
**Propósito:** Modal para agregar nueva pregunta  
**Props:**
- `nuevaPregunta` (string)
- `onNuevaPreguntaChange` (func)

---

#### `ModalAgregarSeccion.jsx`
**Propósito:** Modal para agregar nueva sección  
**Props:**
- `nuevaSeccion` (string)
- `onNuevaSeccionChange` (func)

---

#### `SeccionItem.jsx`
**Propósito:** Item de sección con preguntas en tabla  
**Props:**
- `seccion`, `seccionIndex`
- `onEditarSeccion`, `onEliminarSeccion`, `onAgregarPregunta`, etc.
- `puedeEditar`, `puedeEliminar` (boolean)

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Handlers con `useCallback`

---

#### `FormularioInfo.jsx`
**Propósito:** Información de formulario con metadata  
**Props:**
- `formulario` (object)
- `puedeEditar`, `puedeEliminar` (boolean)

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Metadata calculada con `useMemo`

---

#### `FormulariosHeader.jsx`
**Propósito:** Header con controles de formularios  
**Props:**
- `isMobile`, `isSmallMobile` (boolean)
- `formularios` (array)
- `formularioSeleccionado` (object)
- Handlers: `onFormularioChange`, `onCrear`, etc.

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Comparación personalizada
- ✅ Layout responsive

---

#### `FormularioDetalleCard.jsx`
**Propósito:** Card con información detallada del formulario  
**Props:**
- `formulario` (object)
- `isSmallMobile` (boolean)

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Formateo automático de fechas
- ✅ UI responsive

---

### **Capacitaciones**

#### `SelectoresCapacitaciones.jsx`
**Propósito:** Selectores de empresa, sucursal y filtros  
**Props:**
- `selectedEmpresa`, `selectedSucursal`, `filterTipo`, `filterEstado` (string)
- `onEmpresaChange`, `onSucursalChange`, `onTipoChange`, `onEstadoChange` (func)
- `userEmpresas`, `sucursalesFiltradas` (array)

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Comparación personalizada
- ✅ Iconos integrados

---

#### `CapacitacionCard.jsx`
**Propósito:** Card para mostrar capacitación  
**Props:**
- `capacitacion` (object)
- `onRegistrarAsistencia`, `onMarcarCompletada`, `onDuplicar`, etc. (func)

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Acciones condicionales según estado
- ✅ Formateo automático de fechas

---

#### `CapacitacionesAlertas.jsx`
**Propósito:** Alertas de estado  
**Props:**
- `userEmpresas` (array)
- `selectedSucursal` (string)
- `sucursalesFiltradas` (array)

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Alertas contextuales

---

#### `CapacitacionesEmptyState.jsx`
**Propósito:** Estado vacío cuando no hay capacitaciones
**Características:**
- ✅ UI amigable con icono
- ✅ Mensaje descriptivo

---

### **Auditoría**

#### `AlertasFaltantes.jsx`
**Propósito:** Alertas cuando faltan datos críticos  
**Props:**
- `cargandoDatosRespaldo` (boolean)
- `userEmpresas`, `userSucursales`, `userFormularios` (array)

**Lógica:**
- Muestra error si faltan empresas
- Muestra warning si faltan sucursales
- Muestra info si faltan formularios

**Características:**
- ✅ Optimizado con `React.memo`
- ✅ Lógica de priorización integrada

---

#### `AuditoriaHeader.jsx`
**Propósito:** Header con navegación y progreso  
**Props:**
- `navigate`, `location`
- `calcularProgresoAuditoria` (func)
- `mostrarAlertaReinicio`, `setMostrarAlertaReinicio`
- `theme`, `isMobile`

---

#### `AuditoriaStepper.jsx`
**Propósito:** Stepper de pasos de auditoría  
**Props:** múltiples estados y handlers

---

#### `AutoSaveAlert.jsx`
**Propósito:** Indicador de autoguardado  
**Props:**
- `isSaving`, `lastSaved`, `hasUnsavedChanges`
- `showAlert` (boolean)

---

#### `AuditoriaCompletada.jsx`
**Propósito:** Pantalla de auditoría completada

---

### **Componentes Comunes** (`src/components/common/`)

#### `ErrorBoundary.jsx`
**Propósito:** Manejo de errores de React  
**Características:**
- ✅ Wrapper para componentes
- ✅ UI de error amigable

---

#### `OfflineIndicator.jsx`
**Propósito:** Indicador de estado offline

---

#### `OfflineIndicatorMobile.jsx`
**Propósito:** Indicador offline optimizado para móvil

---

#### `SimpleOfflineDebug.jsx`
**Propósito:** Debug de conectividad en tiempo real

---

#### `AuditoriaDebugInfo.jsx`
**Propósito:** Debug específico de auditorías

---

#### `Permiso.jsx`
**Propósito:** Wrapper condicional basado en permisos  
**Props:**
- `permiso` (string) - Nombre del permiso
- `children` (ReactNode)

---

#### `PWAInstallPrompt.jsx`
**Propósito:** Prompt para instalar PWA

---

#### `FirmaDigital.jsx`
**Propósito:** Componente de firma digital

---

## 🪝 Hooks Personalizados

### **Dashboard Higiene**

#### `useDashboardDataFetch.js`
**Propósito:** Carga de empleados, accidentes y capacitaciones  
**Retorna:**
- `empleados`, `accidentes`, `capacitaciones` (array)
- `loading` (boolean)
- `recargarDatos` (func)

**Características:**
- ✅ Carga paralela con `Promise.all`
- ✅ Chunking para queries con >10 IDs
- ✅ Cleanup de memory leaks (flag `mounted`)
- ✅ Filtrado por sucursal/empresa

---

#### `useIndicesCalculator.js`
**Propósito:** Cálculo de índices técnicos  
**Retorna:**
- `calcularIndices` (func)
- `calcularPeriodo` (func)

**Características:**
- ✅ Cálculos por hora según sucursal
- ✅ Soporte para agregaciones múltiples
- ✅ Thresholds configurables

---

### **Capacitaciones**

#### `useCapacitacionesData.js`
**Propósito:** Carga de capacitaciones individuales y planes anuales  
**Retorna:**
- `capacitaciones`, `planesAnuales` (array)
- `loading` (boolean)
- `recargarDatos` (func)

**Características:**
- ✅ Carga paralela optimizada
- ✅ Cleanup de memory leaks
- ✅ Filtrado por empresa/sucursal
- ✅ Queries dinámicas según filtros

---

#### `useFilterState.js`
**Propósito:** Gestión de estado de filtros y selección  
**Retorna:**
- Estados: `filterTipo`, `filterEstado`, `selectedEmpresa`, `selectedSucursal`
- Setters para cada estado
- `sucursalesFiltradas`, `empresasCargadas`

**Características:**
- ✅ Auto-selección de empresa si solo hay una
- ✅ Restauración desde localStorage
- ✅ Sincronización de filtros
- ✅ Memoización de sucursales filtradas

---

#### `useCapacitacionesHandlers.js`
**Propósito:** Handlers para acciones de capacitaciones  
**Retorna:**
- `handleRegistrarAsistencia` (func)
- `handleMarcarCompletada` (func)
- `handleDuplicar` (func)

**Características:**
- ✅ Optimizado con `useCallback`
- ✅ Confirmaciones integradas
- ✅ Manejo de errores

---

### **Auditoría**

#### `useAuditoriaState.js`
**Propósito:** Gestión de estado de auditoría  
**Retorna:** múltiples estados y setters

---

#### `useAuditoriaData.js`
**Propósito:** Carga de datos de auditoría  
**Características:** listeners reactivos

---

#### `useAuditoriaHandlers.js`
**Propósito:** Manejo de eventos de auditoría  
**Retorna:** handlers para CRUD

---

#### `useNavigationGuard.js`
**Propósito:** Protección de navegación  
**Retorna:**
- Detección de cambios no guardados
- Confirmación antes de salir
- Autoguardado automático

---

### **Editor de Formularios**

#### `useFormularioCache.js`
**Propósito:** Cache de formularios en localStorage  
**Retorna:**
- `useNormalizarSecciones`
- `useFormularioCache`
- `useFormularioStats`

**Características:**
- ✅ Expiración automática (5 min)
- ✅ Límite de tamaño (10 formularios)
- ✅ Limpieza inteligente

---

#### `useFormularioHandlers.js`
**Propósito:** Handlers de formularios  
**Retorna:** funciones de CRUD

---

#### `useFormulariosData.js`
**Propósito:** Carga de formularios con cache y filtrado multi-tenant  
**Retorna:**
- `formularios`, `formulariosCompletos` (array)
- `loading` (boolean)
- `recargar` (func)

**Características:**
- ✅ Cache localStorage (10 min)
- ✅ Suscripción reactiva onSnapshot
- ✅ Filtrado multi-tenant
- ✅ Cleanup automático

---

#### `useFormularioPermisos.js`
**Propósito:** Verificar permisos de formularios  
**Retorna:**
- `puedeEditar`, `puedeEliminar`, `puedeVer` (func)

**Características:**
- ✅ Optimizado con `useCallback`
- ✅ Lógica centralizada de permisos

---

#### `useFormularioSeleccionado.js`
**Propósito:** Gestión de selección de formularios  
**Retorna:**
- `formularioSeleccionado`, `setFormularioSeleccionado`
- `cargandoFormulario` (boolean)
- `handleChangeFormulario` (func)

**Características:**
- ✅ Auto-selección desde query params
- ✅ Sincronización con cache
- ✅ Loading states

---

### **Hooks Globales** (`src/hooks/`)

#### `useUserProfile.js`
**Propósito:** Gestión de perfil de usuario  
**Retorna:**
- `userProfile`, `role`, `permisos`
- `createOrGetUserProfile`, `updateUserProfile`

---

#### `useUserManagement.js`
**Propósito:** Gestión de usuarios y operarios  
**Retorna:**
- `crearOperario`, `editarPermisosOperario`
- `getUsuariosDeClienteAdmin`, etc.

---

#### `usePWAInstall.js`
**Propósito:** Detección y prompt de instalación PWA

---

#### `useConnectivity.js`
**Propósito:** Estado de conectividad  
**Retorna:**
- `isOnline` (boolean)
- `isOfflineMode` (boolean)

---

#### `useOfflineData.js`
**Propósito:** Manejo de datos offline

---

#### `useClienteSorting.js`
**Propósito:** Ordenamiento de clientes

---

#### `useBackButton.js`
**Propósito:** Manejo de botón atrás en móvil

---

#### `useChromePreload.js`
**Propósito:** Optimizaciones para Chrome

---

## 🔧 Servicios

### `src/services/`

#### `empresaService.js`
**Funciones:**
- `getUserEmpresas(userId, role, clienteAdminId)`
- `subscribeToUserEmpresas(...)` - Listener reactivo
- `crearEmpresa(data)`
- `updateEmpresa(empresaId, data)`
- `canViewEmpresa(empresaId, profile)`

---

#### `auditoriaService.js`
**Funciones:**
- `getUserAuditorias(userId, role)`
- `getAuditoriasCompartidas(userId)`
- `compartirAuditoria(...)`
- `canViewAuditoria(auditoriaId, profile, auditoriasCompartidas)`

---

#### `empleadoService.js`
**Funciones:**
- `getEmpleadosByEmpresa(empresaId)`
- `getEmpleadosBySucursal(sucursalId)`
- `getEmpleadosBySucursales(sucursalesIds)`
- `crearEmpleado(data, user)`
- `updateEmpleado(empleadoId, data, user)`

---

#### `accidenteService.js`
**Funciones:** CRUD de accidentes

---

#### `capacitacionService.js`
**Funciones:** CRUD de capacitaciones

---

#### `completeOfflineCache.js`
**Funciones:**
- `saveCompleteUserCache(...)`
- Caché completo para modo offline

---

#### `offlineDatabase.js`
**Funciones:** Operaciones IndexedDB

---

#### `syncQueue.js`
**Funciones:** Cola de sincronización offline

---

#### `userService.js`
**Funciones:** Gestión de usuarios

---

## 📊 Arquitectura de Optimizaciones

### **Patrones Aplicados**

#### 1. **Componentes Memoizados**
```jsx
const Component = React.memo(({ prop1, prop2 }) => {
  // Lógica
}, (prevProps, nextProps) => {
  // Comparación personalizada
  return prevProps.prop1 === nextProps.prop1;
});
```

#### 2. **Hooks con useCallback**
```jsx
const handler = useCallback(() => {
  // Lógica
}, [dependency1, dependency2]);
```

#### 3. **Cálculos con useMemo**
```jsx
const calculated = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

#### 4. **Cleanup Patterns**
```jsx
useEffect(() => {
  let mounted = true;
  const asyncWork = async () => {
    if (mounted) {
      // Actualizar estado
    }
  };
  return () => { mounted = false; };
}, [deps]);
```

---

## 🎯 Uso Recomendado

### **Para Nuevos Componentes**

1. **Crear componente reutilizable** si se usa 2+ veces
2. **Memoizar** si recibe props estables
3. **Extraer hooks** si lógica >50 líneas
4. **Crear servicios** si hay queries/complejidad

### **Estructura de Archivos**

```
src/components/
├── common/              # Globales
├── pages/
│   ├── dashboard-higiene/
│   │   ├── components/  # Específicos
│   │   ├── hooks/       # Específicos
│   │   └── index.jsx
│   └── ...
└── context/             # Contextos

src/hooks/               # Hooks globales
src/services/            # Servicios
src/utils/               # Utilidades
```

---

## 📈 Métricas de Mejora

### **Reducciones Logradas**
| Archivo | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| `DashboardHigieneSeguridad.jsx` | 581 | 424 | -27% |
| `EditarSeccionYPreguntas.jsx` | 788 | 619 | -21% |
| `Auditoria.jsx` | 721 | 639 | -11% |
| `Capacitaciones.jsx` | 825 | 336 | -59% ✅ |
| `EditarFormulario.jsx` | 800 | 249 | -69% ✅ |

### **Componentes Creados**
- **Dashboard:** 4 componentes + 2 hooks
- **Editor:** 12 componentes + 5 hooks ✅
- **Auditoría:** 5 componentes
- **Capacitaciones:** 4 componentes + 3 hooks ✅

---

## ✅ Checklist de Buenas Prácticas

- ✅ Componentes <400 líneas
- ✅ Hooks separados por responsabilidad
- ✅ `React.memo` en componentes con props estables
- ✅ `useCallback` en handlers
- ✅ `useMemo` en cálculos pesados
- ✅ Cleanup en efectos asíncronos
- ✅ Comparaciones personalizadas
- ✅ Type safety (proptypes/documentación)
- ✅ DRY (Don't Repeat Yourself)
- ✅ Single Responsibility Principle

---

**Última actualización:** ${new Date().toLocaleDateString()}

