# Dashboard de Seguridad HSE

## Qué hace

Muestra métricas técnicas de higiene y seguridad laboral calculadas en tiempo real sobre los datos reales de empleados y accidentes. Permite analizar el desempeño por sucursal y período.

## Ruta

- `/dashboard-seguridad` — página independiente (no es parte del tablero operativo)

## Índices calculados

Todos calculados en `src/components/pages/dashboard-higiene/hooks/useIndicesCalculator.js`:

| Índice | Fórmula | Qué mide |
|---|---|---|
| **IF** — Frecuencia | `(accidentes con tiempo perdido × 1.000.000) / horas trabajadas` | Accidentes graves por millón de horas |
| **IG** — Gravedad | `(días perdidos × 1.000.000) / horas trabajadas` | Días perdidos por millón de horas |
| **IA** — Accidentabilidad | `IF + IG` | Índice combinado frecuencia + gravedad |
| **II** — Incidencia | `(accidentes × 1.000) / promedio trabajadores expuestos` | Accidentes por cada 1.000 trabajadores |

Los cálculos usan **datos reales**: fechas de accidentes del período seleccionado, empleados activos, días de reposo registrados en accidentes y fechas de ingreso para calcular horas trabajadas.

## Selectores disponibles

- **Sucursal** — filtra datos por sucursal específica o todas
- **Período** — selección de mes y año

## Visualización

- Gráficos con Recharts (`GaugeChart`, `GraficoIndices`)
- Componentes de métricas: `IncidentMetrics`, `EmployeeMetrics`, `SafetyGoals`
- Seguimiento de metas con `TargetsMensualesCard`

## Archivos clave

- `src/components/pages/dashboard/DashboardSeguridadV2.jsx` — componente principal
- `src/components/pages/dashboard-higiene/hooks/useIndicesCalculator.js` — cálculo de índices
- `src/components/dashboard-seguridad/` — componentes de UI (charts, selectors, metrics)

## Notas importantes

- Los datos de accidentes para este dashboard vienen de la misma colección que el módulo de accidentes. No hay datos separados ni duplicados.
- El dashboard calcula las horas trabajadas estimando jornadas a partir de las fechas de ingreso de los empleados y los días de reposo registrados. No hay registro de horas trabajadas real.
