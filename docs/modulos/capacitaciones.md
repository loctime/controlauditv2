# Capacitaciones

## Qué hace

Gestiona el ciclo completo de capacitación laboral: desde la planificación anual hasta el registro de sesiones y seguimiento del cumplimiento por empleado. Incluye catálogo de tipos, planes anuales, sesiones con asistencia y certificados.

## Ruta

- `/training` — módulo completo, navegación por tabs

## Tabs activos

| Tab (URL `?tab=`) | Componente | Qué muestra |
|---|---|---|
| `sessions` | `SessionsScreen.jsx` | Lista y creación de sesiones de capacitación |
| `people` | `PeopleScreen.jsx` | Vista por empleado: ficha de cumplimiento + historial (2 subtabs internos) |
| `historial` | `SessionHistoryScreen.jsx` | Registros de asistencia por período |
| `reports` | `ReportsScreen.jsx` | KPIs operativos + reportes gerenciales |
| `compliance` | `ComplianceScreen.jsx` | Matriz, cumplimiento por rol, por riesgo, exportación |
| `configuration` | `ConfigurationScreen.jsx` | Solo admin: catálogo de tipos + planes anuales |

**Tab `dashboard`**: el componente `DashboardScreen.jsx` existe pero **no está registrado como tab navegable**. Solo se renderiza como fallback.

**Tab `history`**: fue eliminado como tab de primer nivel. La URL `?tab=history` redirige automáticamente a `?tab=people`. El archivo `EmployeeTrainingHistoryScreen.jsx` sigue en disco pero es código muerto.

## Ruta standalone

- `/training/plans/:planId` → `PlanItemsPage.jsx` — detalle de un plan anual con KPIs, calendario y grilla de ítems por mes

## Subestados de sesión

Las sesiones transicionan por estos estados:
`draft` → `scheduled` → `in_progress` → `pending_closure` → `closed`

## Catálogo y planes anuales

El catálogo define tipos de capacitación con `validityMonths` (vigencia en meses). Al agregar un tipo a un plan, se generan automáticamente los meses planificados.

La función `generatePlannedMonths(frequencyMonths, startMonth)` en `src/services/training/trainingPlanUtils.js`:
- **Acepta `startMonth` configurable** (bug histórico corregido)
- **No valida** que `frequencyMonths` sea divisor de 12 — el input acepta cualquier número ≥ 1, lo que puede generar planes inconsistentes con vigencias como 5, 7 u 8 meses

## Archivos clave

- `src/components/pages/training/TrainingModule.jsx` — router del módulo
- `src/components/pages/training/useTrainingTabState.js` — lógica de tabs y redirecciones
- `src/components/pages/training/screens/` — todos los screens por tab
- `src/services/training/trainingPlanUtils.js` — lógica de generación de meses
- `src/services/training/trainingPlanService.js` — operaciones de planes en Firestore

## Colecciones Firestore

- `trainingPlans` — planes anuales (`companyId`, `branchId`, `year`, `status`)
- `trainingPlanItems` — ítems del plan (`planId`, `trainingTypeId`, `plannedMonth`)
- `trainingSessions` — sesiones (`planId`, `planItemId`, estado, asistentes)
- `trainingAttendance` — registros de asistencia por sesión
- `employeeTrainingRecords` — registros consolidados por empleado
- `trainingCatalog` — tipos de capacitación del catálogo

## Notas importantes

- `EmployeeTrainingHistoryScreen.jsx` es código muerto. Puede eliminarse.
- La validación de vigencias válidas (1, 3, 6, 12) en el UI del Catálogo está pendiente. Ver `docs/deuda-tecnica.md`.
- El tab `compliance` es el más completo del módulo: tiene 4 vistas diferentes y exportación PDF/ZIP.
