# Spec: Rediseño Gestión de Empresas y Sucursales

**Fecha:** 2026-04-12  
**Módulo:** `src/components/pages/establecimiento/`  
**Estado:** Aprobado

---

## Problema

La pantalla actual tiene demasiada información amontonada en tablas con muchas columnas. Resulta difícil de leer y de usar en producción. El objetivo es simplificar la vista sin perder ninguna funcionalidad.

---

## Objetivo

Reemplazar la tabla de empresas y la tabla de sucursales por un sistema de **cards expandibles**:
- Una card por empresa, expandible para ver sus sucursales.
- Cada sucursal como card interna con stats y navegación directa a módulos.

---

## Archivos involucrados

### Modificar
| Archivo | Cambio |
|---|---|
| `EstablecimientosContainer.jsx` | Reemplazar `TableContainer` + `EmpresaRow` por lista de cards. Eliminar lógica de `activeTabPerEmpresa` multi-tab. |
| `SucursalesTab.jsx` | Reemplazar `TableContainer` + `SucursalRow` por cards internas. Eliminar sub-expansión por sucursal. |
| `EmpresasHeader.jsx` | Simplificar: título "Empresas (N)", quitar botón "Accidentes", mantener "Verificar" y "+ Agregar Empresa". |

### Crear
| Archivo | Descripción |
|---|---|
| `components/EmpresaCard.jsx` | Card principal de empresa con expand/collapse. Reemplaza `EmpresaRow`. |
| `components/SucursalCard.jsx` | Card interna de sucursal con stats y acciones. Reemplaza `SucursalRow` en el nuevo contexto. |

### No tocar
- Todos los hooks: `useEmpresasStats`, `useEmpresasHandlers`, `useEmpresasEditHandlers`, `useSucursalesStats`
- Todos los servicios: `sucursalService`
- Todos los modales: `AddEmpresaModal`, `EditarEmpresaModal`, `SucursalFormModal`, `EmpresaOperariosDialog`, `EliminarEmpresa`
- Contexto y autenticación: `useAuth`, `usePermissions`
- Lógica de navegación con `localStorage`/`navigate`
- Archivos de tabs que siguen usándose: `EmpleadosTab`, `CapacitacionesTab`, `AccidentesTab` (ya no se renderizan dentro del expand de empresa, pero sus archivos permanecen intactos)

---

## Diseño por sección

### Header de página

**Antes:** Título grande con ícono + botones Verificar, Accidentes, Agregar Empresa + texto de instrucción debajo.

**Después:**
```
Empresas (3)                    [Verificar]  [+ Agregar empresa]
```
- Título: `"Empresas"` + cantidad entre paréntesis. Sin ícono grande. Sin color especial.
- Botón "Verificar": `variant="outlined"` (ghost).
- Botón "+ Agregar empresa": `variant="contained"` (azul primario). Solo se muestra si `canCreateEmpresa`.
- **Eliminar:** botón "Accidentes" y texto de instrucción.

Componente: `EmpresasHeader.jsx` (modificar props y render, no lógica).

---

### Card de empresa (`EmpresaCard.jsx`)

Reemplaza `EmpresaRow` (TableRow). Usa MUI `Card` o `Paper`.

**Layout de la fila principal (siempre visible):**
```
[ Avatar/Iniciales ]  Nombre empresa        Sucursales: 2  Empleados: 10  Accidentes: 0   [▼]
                      propietario · fecha
```

- **Avatar:** Si `empresa.logo` es válido, mostrar imagen. Si no, iniciales en Box con `alpha(primary.main, 0.1)`. Mismo código que `EmpresaRow` actual.
- **Nombre + propietario + fecha:** `Typography` stacked (subtitle1 bold / caption textSecondary). Mismo `ownerLabel` lógico actual.
- **Stats resumidas:** Tres chips de texto plano (sin botón): Sucursales `N`, Empleados `N`, Accidentes `N`. Si `stats.accidentesAbiertos > 0`, el número de accidentes va en color `error`.
- **Flecha expandir:** `IconButton` con `ExpandMoreIcon`/`ExpandLessIcon`. Al hacer click llama a `toggleRow(empresa.id)`.
- **Click en la card completa** (o en la flecha) expande/colapsa.
- **Acciones de empresa** (editar, eliminar, operarios): `IconButton`s inline al final de la fila de la card (antes de la flecha). Orden: `EditIcon` (editar empresa) → `PersonAddIcon` (operarios) → `EliminarEmpresa` (componente existente). Mismos guards de permisos (`canEditEmpresa`, `canDeleteEmpresa`, `canManageOperarios`) que en `EmpresaRow` actual.

**Estado expandido:** usa MUI `Collapse in={isExpanded}`. El contenido expandido es la sección de sucursales (ver abajo).

---

### Sección expandida — Sucursales

Dentro del `Collapse` de la card de empresa. Fondo: `background.default` o `grey[50]`.

**Header de sección:**
```
SUCURSALES                              [+ Agregar sucursal]
```
- Label `"SUCURSALES"` en `Typography variant="caption"` uppercase, color `textSecondary`.
- Botón `"+ Agregar sucursal"`: `variant="outlined"` size small. Llama a `handleOpenCreateModal()` de `SucursalesTab`.

**Estado vacío:** Typography centrado "No hay sucursales registradas para esta empresa."

**Estado cargando:** `CircularProgress` centrado.

**Lista de sucursales:** Una `SucursalCard` por sucursal.

---

### Card de sucursal (`SucursalCard.jsx`)

Card blanca interna (`Paper elevation=1` o `Card`). Una por fila.

**Layout:**
```
Nombre sucursal          👥 5   📚 3   ⚠️ 0       [✏️] [🗑️]
Av. Corrientes 1234
```

- **Nombre:** `Typography variant="subtitle2"` bold.
- **Dirección:** `Typography variant="caption"` color textSecondary debajo del nombre.
- **Stats:** tres iconos+número clickeables:
  - `PeopleIcon` + `stats.empleados` → navega a `/empleados` con `localStorage.setItem('selectedSucursal', sucursal.id)`
  - `SchoolIcon` + `stats.capacitaciones` → navega a `/capacitaciones` con preselección
  - `ReportProblemIcon` + `stats.accidentes` → color `error` si `accidentesAbiertos > 0`, navega a `/accidentes`
  - Lógica de navegación: usar `navigateToPage` existente en `SucursalesTab`.
- **Acciones:** `IconButton` editar (`EditIcon`) → `handleOpenEditModal(sucursal)` y `IconButton` eliminar (`DeleteIcon`) → `handleDeleteSucursal(sucursal)`. Mismos permisos que hoy (el componente padre los pasa).

**Sin sub-expansión.** No hay tabs de empleados/capacitaciones inline dentro de la sucursal card. Los números son links directos a los módulos.

---

## Eliminaciones confirmadas

| Elemento | Dónde estaba |
|---|---|
| Tabla principal de empresas (`TableContainer`, `Table`, `EmpresaTableHeader`, `EmpresaRow`) | `EstablecimientosContainer.jsx` |
| Tabla de sucursales (`SucursalTableHeader`, `SucursalRow`, `TableContainer`) | `SucursalesTab.jsx` |
| Sub-tabs inline por sucursal (`EmpleadosContent`, `CapacitacionesContent`, `AccidentesContent`, `AccionesRequeridas`) del expand de sucursal | `SucursalesTab.jsx` |
| `EmpresaStats` (resumen de 4 números abajo del expand) | `EstablecimientosContainer.jsx` |
| `activeTabPerEmpresa` state y `setActiveTab`/`getActiveTab` | `EstablecimientosContainer.jsx` |
| Tabs condicionales dentro del expand de empresa (`EmpleadosTab`, `CapacitacionesTab`, `AccidentesTab`) | `EstablecimientosContainer.jsx` |
| Texto "Haz clic en la flecha para expandir..." | `EstablecimientosContainer.jsx` |
| Botón "Accidentes" del header | `EmpresasHeader.jsx` |
| Columnas tabla empresa: Propietario, Dirección, Teléfono, Sucursales, Empleados, Capacitaciones, Accidentes, Acciones | `EmpresaTableHeader.jsx` (archivo puede quedar obsoleto) |
| Columnas tabla sucursal: Horas/Semana, Target Mes, Acciones Req. | `SucursalTableHeader.jsx` (archivo puede quedar obsoleto) |

---

## Lo que se mantiene sin tocar

- `expandedRows` con `Set` y `toggleRow` — lógica intacta, solo se usa diferente
- Todos los modales de crear/editar empresa y sucursal
- `EliminarEmpresa` componente
- `EmpresaOperariosDialog`
- Toda la lógica de `handleVerificarEmpresas`
- `navigateToPage` con `localStorage` para preselección por módulo
- `loadSucursales`, `handleSubmit`, `handleDeleteSucursal` en `SucursalesTab`
- `useEmpresasStats` y `loadEmpresasStats` (llamados igual que hoy)
- `calcularProgresoTargets` y `targetsProgreso` (pueden quedar disponibles para uso futuro, aunque ya no se muestran columnas de target)
- Permisos `canEditEmpresa`, `canDeleteEmpresa`, `canManageOperarios`, `canCreateEmpresa`, `canViewEmpresa`

---

## Tecnología

- **MUI v5** (ya instalado): `Card`, `CardContent`, `Collapse`, `Chip`, `IconButton`, `Tooltip`, `Box`, `Typography`, `Paper`
- **Sin nuevas dependencias**
- **Colores:** usar `theme.palette` existente, sin hardcodear colores nuevos

---

## Notas de implementación

1. `EmpresaCard` recibe las mismas props que recibía `EmpresaRow` + `isExpanded` + `onToggleRow` + el contenido expandido como children o como prop `expandedContent`.
2. `SucursalesTab` pasa a ser la sección completa del expand (header + lista de cards). Su interface (`empresaId`, `empresaNombre`, `userEmpresas`, `loadEmpresasStats`) no cambia.
3. `SucursalCard` recibe: `sucursal`, `stats`, `onEdit`, `onDelete`, `navigateToPage`, `empresaId`.
4. El `expand` en `EstablecimientosContainer` deja de condicionar por tab y siempre renderiza solo `SucursalesTab`.
