# Accidentes e Incidentes

## Qué hace

Registra y gestiona accidentes e incidentes laborales. Soporta múltiples empleados involucrados, días de reposo con impacto automático sobre el estado del empleado, carga de imágenes y seguimiento de estado (abierto/cerrado).

## Ruta

- `/accidentes` — gestión completa
- Tab en `/establecimiento` — últimos 3 registros por empresa

## Diferencia entre accidente e incidente

Usan la **misma colección Firestore** (`accidentes` bajo `owners/{ownerId}/accidentes/`) diferenciada por el campo `tipo`:
- `tipo: 'accidente'` — afecta estado de empleados (días de reposo)
- `tipo: 'incidente'` — no afecta estado de empleados

Tienen modales separados (`NuevoAccidenteModal.jsx` / `NuevoIncidenteModal.jsx`) pero comparten la misma lógica de base.

## Funcionalidades clave

### Días de reposo y estado del empleado

Al registrar un accidente, por cada empleado involucrado:
- Toggle "Con reposo" → registra `fechaInicioReposo` y marca al empleado como `inactivo` en Firestore
- Al **cerrar el caso** (estado → `cerrado`): el sistema calcula `diasPerdidos = fechaCierre - fechaInicioReposo` y reactiva automáticamente al empleado (`estado: 'activo'`)

Lógica en `src/services/accidenteService.js` (función de cierre de caso).

### Filtros disponibles

- Por `tipo` (accidente / incidente)
- Por `estado` (abierto / cerrado)
- Por rango de fechas (`fechaDesde`, `fechaHasta`)
- Búsqueda por descripción

### Imágenes

Carga de múltiples imágenes vía `UnifiedFileUploader`. La validación de tamaño (máx 5MB) se gestiona en el servicio de archivos, no en el modal.

## Archivos clave

- `src/components/pages/accidentes/Accidentes.jsx` — página principal
- `src/components/pages/accidentes/NuevoAccidenteModal.jsx` — creación de accidente
- `src/components/pages/accidentes/NuevoIncidenteModal.jsx` — creación de incidente
- `src/components/pages/accidentes/components/AccidenteDetailPanelV2.jsx` — panel de detalle (activo)
- `src/components/pages/accidentes/components/AccidenteDetailPanel.old.jsx` — versión anterior (código muerto, puede eliminarse)
- `src/services/accidenteService.js` — operaciones Firestore y lógica de cierre
- `src/components/pages/establecimiento/tabs/AccidentesTab.jsx` — tab resumen en Establecimiento

## Notas importantes

- `AccidenteDetailPanel.old.jsx` es código muerto. Puede eliminarse.
- El estado del empleado se cambia directamente en la colección `empleados` al abrir y cerrar el accidente. No hay eventos ni logs de esa transición.
- Los datos de accidentes son también la fuente de los índices IF/IG/IA del Dashboard HSE (ver `docs/modulos/dashboard-hse.md`).
