# Capacitaciones

## Qué hace

Gestiona el ciclo completo de capacitación laboral: desde la planificación anual hasta el registro de sesiones y seguimiento del cumplimiento por empleado. Incluye catálogo de tipos, planes anuales, sesiones con asistencia y certificados.

## Ruta

- `/training` — matriz anual de cumplimiento por sucursal (única pantalla montada en el entrypoint del módulo)
- `/training/config` — configuración (catálogo y planes anuales)
- `/training/plans/:planId` — detalle de un plan anual

## Tabs activos

La ruta `/training` **no** usa navegación por `?tab=`. `TrainingModule.jsx` renderiza únicamente `MatrixScreen.jsx`. Otros `screens/` del directorio existen en el repo pero **no** están cableados a esta ruta.

| Ruta | Componente | Qué muestra |
|---|---|---|
| `/training` | `MatrixScreen.jsx` | Matriz año × sucursal: empleados × ítems del plan × mes; cambios pendientes y **Guardar sesión**; drawers (celda, nombre de empleado, cabecera de mes) |
| `/training/config` | `ConfigurationScreen.jsx` | Catálogo de tipos y planes anuales (según permisos) |
| `/training/plans/:planId` | `PlanItemsPage.jsx` | Detalle de un plan anual con KPIs, calendario y grilla de ítems por mes |

**Referencia legacy**: `useTrainingTabState.js` y tablas tipo `sessions` / `people` / `reports` / `compliance` describían un diseño anterior; no aplican al flujo actual de `/training`.

**Tab `dashboard`**: el componente `DashboardScreen.jsx` puede existir en disco; no forma parte del entrypoint `/training` descrito arriba.

**Tab `history`**: la URL `?tab=history` y redirecciones a `people` pertenecen al esquema por tabs legacy; el uso real de historial en la matriz está en los drawers (`EmployeeTrainingDrawer.jsx`, `MonthAttendanceDrawer.jsx`).

## Ruta standalone

- `/training/plans/:planId` → `PlanItemsPage.jsx` — detalle de un plan anual con KPIs, calendario y grilla de ítems por mes

## Subestados de sesión

Las sesiones transicionan por estos estados:
`draft` → `scheduled` → `in_progress` → `pending_closure` → `closed`

## Catálogo y planes anuales

El catálogo define tipos de capacitación con `validityMonths` (vigencia en meses). Al agregar un tipo a un plan, se generan automáticamente los meses planificados.

**Plan anual al crear sucursal**: en `sucursalService.crearSucursalCompleta` se invoca `trainingPlanService.ensureAnnualPlan` para el **año calendario en curso** y la sucursal recién creada; es el camino principal para que exista el plan. Si aun así no hay plan cargado en la matriz (otro año, datos incompletos o error previo), `MatrixScreen` puede mostrar un **respaldo** con botón “Crear plan anual” que vuelve a llamar a `ensureAnnualPlan`.

La función `generatePlannedMonths(frequencyMonths, startMonth)` en `src/services/training/trainingPlanUtils.js`:
- **Acepta `startMonth` configurable** (bug histórico corregido)
- **No valida** que `frequencyMonths` sea divisor de 12 — el input acepta cualquier número ≥ 1, lo que puede generar planes inconsistentes con vigencias como 5, 7 u 8 meses

## Archivos clave

- `src/components/pages/training/TrainingModule.jsx` — entrypoint `/training` (solo monta la matriz)
- `src/components/pages/training/screens/MatrixScreen.jsx` — matriz, modales y drawers
- `src/components/pages/training/components/matrix/TrainingMatrixTable.jsx`, `MatrixCell.jsx`, `SaveSessionModal.jsx`, `SessionViewDrawer.jsx`
- `src/components/pages/training/components/matrix/EmployeeTrainingDrawer.jsx`, `MonthAttendanceDrawer.jsx`, `EvidencePreviewList.jsx` — historial por empleado / por mes y evidencia expandible
- `src/hooks/training/useTrainingMatrix.js` — datos y cómputo de estado por celda (último registro)
- `src/hooks/training/useMatrixPendingChanges.js` — cambios pendientes y **bloqueo por columna activa** (`activeColumnId`)
- `src/services/sucursalService.js` — creación de sucursal + `ensureAnnualPlan`
- `src/services/training/trainingExecutionService.js` — sugerencia de participantes (`suggestParticipants`; `blockedEmployees` queda vacío: no bloquea por “mismo tipo en el mismo mes”)
- `src/services/training/trainingPlanUtils.js` — lógica de generación de meses
- `src/services/training/trainingPlanService.js` — operaciones de planes en Firestore
- `src/components/pages/training/useTrainingTabState.js` — lógica legacy de tabs (no usada por `TrainingModule.jsx` actual)

## Colecciones Firestore

- `trainingPlans` — planes anuales (`companyId`, `branchId`, `year`, `status`)
- `trainingPlanItems` — ítems del plan (`planId`, `trainingTypeId`, `plannedMonth`)
- `trainingSessions` — sesiones (`planId`, `planItemId`, estado, fechas)
- Asistencia por sesión — subcolección `training_sessions/{sessionId}/attendance/{employeeId}` (y denormalizado `training_attendance_by_employee`)
- `employeeTrainingRecords` — registros consolidados por empleado
- `trainingCatalog` — tipos de capacitación del catálogo

## Notas importantes

- **Matriz (`MatrixScreen`)**: cada celda refleja el **último estado** registrado para ese empleado y ese ítem de plan (`useTrainingMatrix.computeCellData`). Solo **Presente** bloquea la edición de la celda; **Ausente**, **N/A** y **vacío** siguen editables. Al guardar con **Guardar sesión** se agrupa por `planItemId` y se persisten sesión + asistencias.
- **Bloqueo por columna activa**: mientras hay cambios pendientes, `useMatrixPendingChanges` fija `activeColumnId`; solo esa columna (`planItemId`) admite nuevos pendientes hasta vaciar cambios o guardar.
- **Drawers en la matriz**: click en **nombre de empleado** abre `EmployeeTrainingDrawer` (resumen del año para ese empleado); click en **cabecera de mes** abre `MonthAttendanceDrawer` (empleados con actividad en ese mes). Ambos permiten expandir detalle con evidencias (`EvidencePreviewList`).
- **Sesiones manuales (`CreateTrainingSession`)**: `trainingExecutionService.suggestParticipants` deja `blockedEmployees` vacío; un empleado puede figurar en varias sesiones del mismo tipo/mes sin bloqueo desde ese servicio. *Nota:* en el **plan** (modal agregar al mes), `AddPlanItemModal` sigue evitando el mismo `trainingTypeId` dos veces en el **mismo mes** del plan — eso es independiente del bloqueo de participantes entre sesiones.
- `EmployeeTrainingHistoryScreen.jsx` y otros screens no montados pueden ser código muerto respecto de `/training`; conviene revisar antes de borrar.
- La validación de vigencias válidas (1, 3, 6, 12) en el UI del Catálogo está pendiente. Ver `docs/deuda-tecnica.md`.
- El punto de entrada principal operativo del módulo en producción es la **matriz** en `/training`, no un tab “compliance” histórico.
