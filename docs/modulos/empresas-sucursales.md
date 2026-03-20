# Gestión de Empresas y Sucursales

## Qué hace

Permite al admin gestionar las empresas y sucursales de sus clientes. Cada empresa tiene múltiples sucursales, y todos los datos del sistema (empleados, auditorías, capacitaciones, accidentes) están asociados a una sucursal.

## Ruta

- `/establecimiento` — página principal de gestión

## Estructura del módulo

El componente principal `EstablecimientosContainer.jsx` fue refactorizado de un monolito de 1.361 líneas a una estructura de tabs. Hoy importa y compone:

- `tabs/SucursalesTab.jsx` — gestión de sucursales con tabla expandible
- `tabs/EmpleadosTab.jsx` — vista de empleados de la empresa
- `tabs/CapacitacionesTab.jsx` — resumen de capacitaciones
- `tabs/AccidentesTab.jsx` — últimos 3 accidentes/incidentes

## Funcionalidades confirmadas

### Tabla expandible de sucursales

`SucursalesTab.jsx` usa un `Set` de IDs (`expandedRows`) para rastrear qué filas están expandidas. Al expandir una sucursal se muestran tabs anidados con el detalle.

### CRUD completo

Empresas:
- `AddEmpresaModal.jsx` — crear
- `EditarEmpresa.jsx` — editar
- `EliminarEmpresa.jsx` — eliminar

Sucursales:
- `SucursalFormModal.jsx` — crear y editar
- `sucursalService.listByEmpresa()` — carga por empresa

### Estadísticas por sucursal

`useSucursalesStats()` calcula:
- `targetMensual`, `targetAnualAuditorias`
- `calcularProgresoTargets()` — progreso contra metas definidas

## Archivos clave

- `src/components/pages/establecimiento/EstablecimientosContainer.jsx`
- `src/components/pages/establecimiento/tabs/SucursalesTab.jsx`
- `src/components/pages/establecimiento/tabs/EmpleadosTab.jsx`
- `src/components/pages/establecimiento/tabs/CapacitacionesTab.jsx`
- `src/components/pages/establecimiento/tabs/AccidentesTab.jsx`

## Notas importantes

- El tab de **Accidentes** en esta página solo muestra los últimos 3 registros con un resumen. Para la gestión completa ver `docs/modulos/accidentes-incidentes.md`.
- Las estadísticas de targets (metas mensuales/anuales) son configurables por sucursal y se calculan en tiempo real con los datos reales.
