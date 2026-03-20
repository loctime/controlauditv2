# Análisis y simplificación del frontend del módulo de capacitaciones

**Alcance:** Solo frontend (React, servicios que usan Firebase SDK, estado, navegación). Sin cambios en backend, Cloud Functions ni APIs externas. Modelo Firestore compatible con las colecciones actuales.

---

## 1) Mapa de arquitectura frontend actual

### Entrada y rutas

```
TrainingModule (tabs)
├── dashboard    → DashboardScreen
├── sessions     → SessionsScreen
├── people       → PeopleScreen
├── history      → EmployeeTrainingHistoryScreen
├── reports      → ReportsScreen
├── compliance   → ComplianceScreen
└── configuration → ConfigurationScreen
                    └── ConfigurationHub (tabs: catalog | plans)
                        ├── catalog  → CatalogScreenAdapter → CatalogScreen
                        └── plans    → AnnualPlansScreenAdapter
                                        ├── AnnualPlansPage (lista planes, DataGrid)
                                        ├── PlanDetailDrawer (ver/editar plan)
                                        └── PlanEditDialog (crear/editar plan)
                                        "Ver ítems" → navigate(/training/plans/:planId)
                                                      → PlanItemsPage (por ruta)
```

### Servicios de frontend (training)

| Servicio | Responsabilidad principal | Usado desde UI en |
|----------|---------------------------|-------------------|
| trainingCatalogService | CRUD tipos capacitación | CatalogScreen, CreateTrainingSession, SessionExecutionView, PlanDetailDrawer, etc. |
| trainingPlanService | Planes, ítems, assignTrainingTypeToPlan, findCompatiblePlanItems | AnnualPlansPage, PlanItemsPage, PlanDetailDrawer, CreateTrainingSession, TrainingSessionEntry |
| trainingSessionService | CRUD sesiones, transiciones, getAllowedTransitions | SessionsScreen, CreateTrainingSession, SessionClosurePanel |
| trainingAttendanceService | Asistencia por sesión, por empleado, period locks, upsert | CreateTrainingSession, SessionExecutionView, trainingSessionService |
| trainingPeriodResultService | Consolidado por período, listByEmployee | employeeTrainingRecordService, trainingReportingService |
| employeeTrainingRecordService | Registros empleado-tipo, recompute | CreateTrainingSession, trainingComplianceService, PeopleScreen, etc. |
| trainingComplianceService | getEmployeeCompliance, buildMatrix, snapshot | auditEvidenceService, trainingRoleRequirementService |
| trainingRequirementService | Reglas matriz requerimientos | CreateTrainingSession (sugerencias) |
| trainingReportingService | Agregación reportes | ReportsScreen |
| trainingCertificateService, trainingEvidenceService | Certificados y evidencias | Varios |
| trainingRoleRequirementService, trainingRiskComplianceService | Cumplimiento por rol/riesgo | ComplianceScreen |
| auditEvidenceService | Build para auditoría | — |

### Componentes con lógica de negocio relevante

| Componente | Lógica que debería vivir en servicios/util |
|------------|--------------------------------------------|
| **CreateTrainingSession** | `resolveMonthlyPeriodFromDate`, `loadSuggestions` (rules + records + suggested/blocked), `periodOccupancyByEmployee` + `blockedEmployeeIdSet`, filtros role/sector |
| **SessionExecutionView** | Solo llama servicios; mensaje de conflicto de período en UI (aceptable). |
| **SessionClosurePanel** | Usa `trainingSessionService.getAllowedTransitions` (correcto). |
| **PlanDetailDrawer** | Carga ítems con trainingPlanService; TabEditar/TabItems con formularios. |
| **AnnualPlansPage** | Lista planes + filtros; sin lógica pesada. |
| **PlanItemsPage** | Carga plan + ítems; KPIs y tabla; sin sugerencias de participantes. |

### Navegación de planes

- **Config → Planes:** ConfigurationHub (section=plans) → AnnualPlansScreenAdapter → **AnnualPlansPage** (lista), PlanDetailDrawer, PlanEditDialog. "Abrir ítems" → `/training/plans/:planId` → **PlanItemsPage**.
- **AnnualPlansScreen.jsx** existe pero **no se usa** en ningún import; es código muerto (pantalla alternativa con createPlan + add item en un solo formulario).

### Resolución de período

- **trainingPeriodUtils.js:** `resolveTrainingPeriod(ownerId, sessionData)` — usado por trainingSessionService y trainingAttendanceService. Acepta sesión con `periodYear/periodMonth/periodKey` ya rellenados, o `sessionOrigin: 'plan'` + planId/planItemId, o fecha (scheduled/executed).
- **CreateTrainingSession.jsx:** Define localmente `resolveMonthlyPeriodFromDate(scheduledDate)` y `scheduledPeriod` (solo year/month). No usa `resolveTrainingPeriod` del servicio; por tanto la resolución de período para la UI de “bloqueados” es distinta (solo fecha, sin plan).

### Acceso a datos de asistencia

- **Por sesión:** `trainingAttendanceService.listAttendanceBySession(ownerId, sessionId)` → subcolección `training_sessions/{id}/attendance`. Usado en SessionsScreen (conteos), SessionExecutionView, trainingSessionService (removeSession, validateClosureGates, materialize).
- **Por empleado:** `listAttendanceByEmployee`, `listAttendanceByEmployeeAndPeriod` → colección `training_attendance_by_employee`. Usado en EmployeeTrainingHistoryScreen, trainingAttendanceService (consulta interna por período).
- **Locks:** `listPeriodLocks(ownerId, { companyId, branchId, trainingTypeId, periodYear, periodMonth })` → `training_attendance_period_locks`. Solo **CreateTrainingSession** llama esto para construir `periodOccupancyByEmployee` y `blockedEmployeeIdSet`.
- **Period results:** `trainingPeriodResultService.listByEmployee` usado desde employeeTrainingRecordService (recompute). No se lee directamente desde componentes de sesión.

---

## 2) Componentes responsables de lógica compleja

### CreateTrainingSession.jsx

- **resolveMonthlyPeriodFromDate(form.scheduledDate):** Calcula `{ periodYear, periodMonth }` en el cliente. Debería alinearse con la misma noción de período que usa el backend (trainingPeriodUtils).
- **loadSuggestions:**
  - Llama `trainingRequirementService.listRules` y `employeeTrainingRecordService.listByEmployees`.
  - Calcula “sugeridos” por cumplimiento (EXPIRED, EXPIRING_SOON, MISSING) y por coincidencia con reglas (role/sector).
  - Excluye a `blockedEmployeeIdSet` (que viene de `listPeriodLocks` en otro `useEffect`).
  - Toda esta lógica es de dominio y debería estar en un servicio frontend.
- **periodOccupancyByEmployee / blockedEmployeeIdSet:** Se derivan de `listPeriodLocks` en un `useEffect`. Correcto que consulte el servicio; la agregación “blocked” podría devolverla el servicio.
- **Efectos encadenados:** loadEmployees → loadSuggestions; otro efecto carga period locks; otro aplica blocked a suggested/selected. Esto hace el flujo frágil y difícil de testear; un único método `suggestParticipants(sessionContext)` simplificaría.

### Plan navigation

- **ConfigurationHub:** Solo orquesta tabs (catalog / plans) y filtros; PlanFiltersBar para plans.
- **AnnualPlansScreenAdapter:** Monta AnnualPlansPage + PlanDetailDrawer + PlanEditDialog y navega a `/training/plans/:planId`.
- **AnnualPlansPage:** Lista de planes con DataGrid; no depende de AnnualPlansScreen.
- **AnnualPlansScreen.jsx:** No referenciado; duplicado conceptual con “crear plan + añadir ítem” (en otra disposición). Candidato a eliminar o reemplazar por la misma UX que usa el adapter (AnnualPlansPage + drawer/dialog).

---

## 3) Servicios que conviene fusionar o simplificar

### Opción A — Consolidar por dominio (sin tocar Firestore)

- **trainingExecutionService (nuevo, frontend):** Orquesta todo lo necesario para “ejecución” de una sesión:
  - `suggestParticipants(ownerId, sessionContext)` → `{ eligibleEmployees, blockedEmployees, suggestedIds, reasons }`.
  - Internamente llama a: empleadoService (por sucursal), trainingRequirementService.listRules, employeeTrainingRecordService.listByEmployees, trainingAttendanceService.listPeriodLocks, y aplica la misma lógica que hoy tiene CreateTrainingSession (sugeridos por cumplimiento + por reglas; bloqueados por locks).
  - No sustituye a trainingAttendanceService ni a trainingSessionService; solo agrega una API de “participantes sugeridos y bloqueados” para que la UI sea tonta.
- **trainingPlanService:** Ya unificado con `assignTrainingTypeToPlan`. Mantener como está.
- **trainingComplianceService / employeeTrainingRecordService:** Ya se dejó de escribir en matriz; getEmployeeCompliance y buildMatrix leen de employee_training_records. No hace falta fusionar más en frontend; la reducción de complejidad ya se hizo.

### Opción B — Sin nuevo archivo de servicio

- Añadir en **trainingAttendanceService** (o en un módulo de utilidades de “session execution”):
  - `getEligibleAndBlockedParticipants(ownerId, { trainingTypeId, companyId, branchId, scheduledDate, periodYear, periodMonth })` que devuelva `{ eligible, blocked, suggestedIds }`.
- La lógica de “sugeridos por cumplimiento y por reglas” podría quedar en **trainingComplianceService** o en **trainingRequirementService** como `getSuggestedParticipantIds(ownerId, { companyId, branchId, trainingTypeId }, employeeIds)` y desde el componente o desde attendance se combina con blocked.

Recomendación: **Opción A** con un único servicio frontend `trainingExecutionService` que exponga `suggestParticipants(sessionContext)` y oculte reglas + records + locks. Menos cambios en servicios existentes y un solo contrato para la UI.

---

## 4) Estructura de servicios frontend propuesta

Mantener los mismos archivos que hablan con Firestore; añadir un único orquestador de “ejecución” y reutilizar resolución de período.

| Servicio | Cambio |
|----------|--------|
| trainingCatalogService | Sin cambio. |
| trainingPlanService | Sin cambio (ya con assignTrainingTypeToPlan). |
| trainingSessionService | Sin cambio. Exponer (si no está) `resolveTrainingPeriod` vía re-export de trainingPeriodUtils para uso en UI. |
| trainingAttendanceService | Sin cambio. Sigue siendo la única fuente de listPeriodLocks y de escritura de asistencia. |
| trainingPeriodResultService | Sin cambio. |
| employeeTrainingRecordService | Sin cambio. |
| trainingComplianceService | Sin cambio. |
| trainingRequirementService | Sin cambio. |
| **trainingExecutionService** (nuevo) | `suggestParticipants(ownerId, sessionContext)` → `{ eligibleEmployees, blockedEmployees, suggestedIds, blockedReasons }`. Usa empleadoService, trainingRequirementService, employeeTrainingRecordService, trainingAttendanceService y trainingPeriodUtils (o resolveTrainingPeriod). |
| trainingReportingService, trainingCertificateService, trainingEvidenceService, trainingRoleRequirementService, trainingRiskComplianceService, auditEvidenceService | Sin cambio. |

No se eliminan servicios; se añade una capa fina de orquestación para “participantes sugeridos y bloqueados” y se centraliza el uso de `resolveTrainingPeriod` en la UI.

---

## 5) Componentes React que se pueden simplificar

| Componente | Simplificación |
|------------|----------------|
| **CreateTrainingSession** | Quitar `loadSuggestions`, `resolveMonthlyPeriodFromDate` y la derivación local de blocked/suggested. Llamar a `trainingExecutionService.suggestParticipants(ownerId, sessionContext)` cuando tenga branchId, trainingTypeId, companyId, scheduledDate (y opcionalmente planId/planItemId). Recibir `eligibleEmployees`, `blockedEmployees`, `suggestedIds`; mostrar lista y deshabilitar bloqueados. Usar `resolveTrainingPeriod` (re-exportado) para el contexto de período si el servicio lo requiere con plan. |
| **SessionExecutionView** | Sin cambio relevante; ya delega en trainingAttendanceService. |
| **SessionClosurePanel** | Sin cambio; ya usa getAllowedTransitions. |
| **PlanDetailDrawer** | Opcional: extraer TabEditar y TabItems a subcomponentes; no obligatorio para simplificación. |
| **AnnualPlansScreen.jsx** | Eliminar o marcar como no usado. La entrada real a planes es ConfigurationHub → AnnualPlansScreenAdapter → AnnualPlansPage. Si se quiere la UX “crear plan + añadir ítem” en una sola pantalla, se puede reutilizar la lógica de AnnualPlansPage + PlanEditDialog en lugar de mantener dos pantallas distintas. |

---

## 6) Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `src/services/training/trainingExecutionService.js` | **Crear.** Implementar `suggestParticipants(ownerId, sessionContext)` usando empleadoService, trainingRequirementService, employeeTrainingRecordService, trainingAttendanceService y `resolveTrainingPeriod` (trainingPeriodUtils). |
| `src/services/training/index.js` | Exportar `trainingExecutionService`. |
| `src/components/pages/training/components/sessions/CreateTrainingSession.jsx` | Sustituir `loadSuggestions` y la lógica de periodOccupancy/blocked por una llamada a `trainingExecutionService.suggestParticipants`. Obtener período con `resolveTrainingPeriod(ownerId, sessionLikeContext)` o con el objeto que devuelva el servicio (p. ej. periodYear/periodMonth en sessionContext). Mostrar solo `eligibleEmployees` y `blockedEmployees` con razones; usar `suggestedIds` como preselección. |
| `src/services/training/trainingPeriodUtils.js` | Sin cambio de firma. Re-exportar `resolveTrainingPeriod` (y si hace falta `buildMonthlyPeriodFromDate`) para que CreateTrainingSession o trainingExecutionService puedan construir un `sessionContext` mínimo (scheduledDate o planId+planItemId) y obtener periodYear/periodMonth/periodKey de forma unificada. |
| `src/components/pages/training/screens/AnnualPlansScreen.jsx` | Eliminar o documentar como no usado; si hay rutas que lo referencien, redirigir a ConfigurationHub section=plans. |

---

## 7) Plan de implementación paso a paso

### Paso 1 — Utilidad de período en la UI

- Re-exportar desde `trainingPeriodUtils` (o desde un barrel `training/utils`) la función que necesite la UI para construir contexto de sesión: p. ej. para una fecha y opcionalmente planId+planItemId, devolver `{ periodYear, periodMonth, periodKey }` sin escribir en Firestore.
- En CreateTrainingSession, reemplazar `resolveMonthlyPeriodFromDate` por una llamada a esa utilidad (o a `resolveTrainingPeriod(ownerId, sessionLike)` si se construye un objeto tipo sesión con scheduledDate o con planId/planItemId).
- Objetivo: una sola fuente de verdad para “período” en flujos de creación de sesión.

### Paso 2 — Servicio de sugerencia de participantes

- Crear `src/services/training/trainingExecutionService.js`.
  - `async suggestParticipants(ownerId, sessionContext)` donde `sessionContext = { trainingTypeId, companyId, branchId, scheduledDate, planId?, planItemId? }`.
  - Resolver período con `resolveTrainingPeriod(ownerId, sessionContext)` (o con buildMonthlyPeriodFromDate si la sesión aún no existe).
  - Obtener empleados de sucursal (empleadoService.getEmpleadosBySucursal(ownerId, branchId)).
  - En paralelo: trainingRequirementService.listRules, employeeTrainingRecordService.listByEmployees(employeeIds), trainingAttendanceService.listPeriodLocks(ownerId, { companyId, branchId, trainingTypeId, periodYear, periodMonth }).
  - Calcular suggestedIds (cumplimiento EXPIRED/EXPIRING_SOON/MISSING + match con reglas); construir blockedEmployees y blockedReasons desde locks.
  - Devolver `{ eligibleEmployees, blockedEmployees, suggestedIds, blockedReasons }`.
- Añadir export en `src/services/training/index.js`.

### Paso 3 — CreateTrainingSession usa el servicio

- En CreateTrainingSession, eliminar `loadSuggestions`, el useEffect que llama a `listPeriodLocks` para `periodOccupancyByEmployee`, y el useEffect que aplica `blockedEmployeeIdSet` a suggested/selected.
- Añadir un único efecto o llamada (p. ej. al tener form.trainingTypeId, companyId, branchId, branchId, scheduledDate): llamar a `trainingExecutionService.suggestParticipants(ownerId, sessionContext)` y guardar en estado `eligibleEmployees`, `blockedEmployees`, `suggestedIds`, `blockedReasons`.
- Renderizar lista de empleados desde `eligibleEmployees`; mostrar bloqueados aparte con `blockedReasons`; inicializar selección con `suggestedIds`.
- Mantener filtros role/sector en cliente sobre `eligibleEmployees` si se desea; no es lógica de negocio crítica.

### Paso 4 — Navegación de planes (opcional)

- Si se confirma que AnnualPlansScreen.jsx no se usa: eliminarlo o redirigir cualquier ruta que lo use a `?tab=configuration&section=plans` (AnnualPlansPage vía adapter).
- Opcional: renombrar para evitar confusión (p. ej. AnnualPlansPage → PlansScreen y mantener PlanItemsPage como PlanDetail o PlanItemsScreen). No estrictamente necesario para simplificación.

### Paso 5 — Acceso a datos de asistencia (revisión)

- Dejar como están las lecturas: `listAttendanceBySession` para sesión, `listPeriodLocks` para bloqueados en creación. El nuevo trainingExecutionService puede ser el único consumidor de listPeriodLocks desde la UI; CreateTrainingSession ya no lo llamaría directamente.
- No añadir nuevas colecciones ni cambiar contratos de Firestore; solo centralizar quién llama a qué en el flujo “sugerir participantes”.

---

## 8) Resumen

- **Servicios:** Se añade un único servicio frontend, `trainingExecutionService`, con `suggestParticipants(sessionContext)`. El resto de servicios se mantienen; no se fusionan archivos que ya tocan Firestore.
- **Participantes:** Toda la lógica de “sugeridos” y “bloqueados” (reglas, cumplimiento, period locks) se concentra en ese servicio; la UI solo muestra resultados.
- **Período:** Una sola utilidad/función (`resolveTrainingPeriod` o wrapper) para todos los flujos de creación de sesión; CreateTrainingSession deja de tener su propia `resolveMonthlyPeriodFromDate`.
- **Planes:** Se identifica AnnualPlansScreen.jsx como no usado; se propone eliminarlo o redirigir. Navegación actual (ConfigurationHub → AnnualPlansPage → PlanItemsPage) se mantiene; opcional simplificar nombres.
- **Asistencia:** Sin cambios en colecciones ni en contratos; solo se centraliza el uso de listPeriodLocks en trainingExecutionService para la pantalla de creación de sesión.
- **Firestore:** Compatible con el modelo actual; no se proponen cambios de backend ni de Cloud Functions.
