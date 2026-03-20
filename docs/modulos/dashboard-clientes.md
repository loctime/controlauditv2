# Dashboard de Clientes (Tablero Operativo)

## Qué hace

Dashboard de control operativo diario para el admin. Responde la pregunta: **¿qué tengo que hacer hoy y dónde hay problemas?** No es un dashboard de análisis histórico ni de scheduling — para eso existen `/dashboard-seguridad` y `/panel`.

## Rutas

Hay **dos dashboards distintos**. Esto confundía la documentación anterior:

| Ruta | Componente | Propósito |
|---|---|---|
| `/tablero` | `Dashboard.jsx` | Control operativo diario (este documento) |
| `/panel` | `ClienteDashboard.jsx` | Calendario y agendamiento de auditorías (ver `docs/modulos/agendamiento.md`) |

## Qué muestra /tablero

`src/components/pages/dashboard/Dashboard.jsx` compone:

- **`DashboardAlerts`** — alertas críticas y warnings del sistema
- **`DashboardToday`** — tareas y auditorías del día
- **`DashboardBlocked`** — items trabados o pendientes de acción
- **`DashboardSummary`** — resumen general de métricas
- **`TargetsMensualesCard`** — progreso contra metas mensuales
- **`CapacitacionesGoalsCard`** — estado de metas de capacitación
- **`AccidentesGoalsCard`** — estado de metas de accidentabilidad
- **`AuditoriasManualWidget`** — acciones manuales sobre auditorías

Los datos vienen de hooks especializados: `useDashboardData`, `useDashboardRealtimeData`, `useTargetsMensualesData`, `useAccionesRequeridasStats`, `useGoalsData`.

## Archivos clave

- `src/components/pages/dashboard/Dashboard.jsx` — página principal `/tablero`
- `src/components/pages/dashboard/hooks/` — todos los hooks de datos
- `src/components/pages/dashboard/components/` — 20+ componentes de widgets

## Notas importantes

- `/tablero` **no tiene calendario ni historial de auditorías agendadas**. Quien busque esa funcionalidad debe ir a `/panel`.
- Los datos del tablero son en tiempo real via `useDashboardRealtimeData` con listeners `onSnapshot` de Firestore.
