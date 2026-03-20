# Gestión de Empleados

## Qué hace

Administra la nómina de empleados por sucursal. Permite crear, editar y eliminar empleados, con filtros y búsqueda. El estado activo/inactivo del empleado se gestiona aquí y también es modificado automáticamente por el módulo de accidentes.

## Ruta

- `/empleados` — lista y gestión de empleados

## Funcionalidades confirmadas en código

`src/components/pages/empleados/Empleados.jsx`:

- **Búsqueda** por `nombreCompleto`, DNI y email
- **Filtros** por `cargo`, `tipo` y `estado` (activo/inactivo)
- **CRUD completo** via `EmpleadoFormModal`
- `empleadoService.getEmpleadosBySucursal()` para carga de datos

## Estado activo/inactivo

El estado del empleado puede cambiar desde dos lugares:

1. **Manual** — el admin edita el empleado y cambia el estado directamente
2. **Automático desde accidentes** — cuando se registra un accidente con días de reposo, el sistema marca al empleado como `inactivo` automáticamente. Al cerrar el caso, lo reactiva. (Ver `docs/modulos/accidentes-incidentes.md`)

Estos dos mecanismos son independientes entre sí. El módulo de empleados no sabe que un accidente cambió el estado; solo muestra el valor actual en Firestore.

## Archivos clave

- `src/components/pages/empleados/Empleados.jsx` — lista con filtros y búsqueda
- `src/components/pages/empleados/EmpleadoForm.jsx` — formulario de creación/edición
- `src/services/empleadoService.js` — operaciones Firestore

## Notas importantes

- No hay indicador visual en la lista de empleados que explique *por qué* un empleado está inactivo (si fue por un accidente o por cambio manual). El campo `estado` solo dice "activo" o "inactivo".
- Los empleados existen a nivel de sucursal, no a nivel de empresa. Para ver todos los empleados de una empresa hay que recorrer sus sucursales.
