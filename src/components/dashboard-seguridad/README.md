# Dashboard de Higiene y Seguridad

Dashboard visual para monitorear indicadores clave de higiene y seguridad laboral.

## Ubicación

- **Ruta**: `/dashboard-seguridad`
- **Componente principal**: `src/components/pages/dashboard/DashboardSeguridad.jsx`

## Acceso

El dashboard está disponible para usuarios con rol:
- `max` (Cliente Administrador)
- `supermax` (Super Administrador)

Se puede acceder desde el menú lateral o directamente navegando a `/dashboard-seguridad`.

## Componentes

### DashboardHeader
Header del dashboard con logo y período actual.

### KpiCard
Tarjetas de indicadores con:
- Estados de color (success/warning/critical)
- Iconos descriptivos
- Barra de progreso opcional
- Subtítulos informativos

### SafetyCharts
Gráficos usando Recharts:
- Distribución de accidentes/incidentes (Pie Chart)
- Capacitaciones e inspecciones (Bar Chart)
- Porcentajes de cumplimiento (Bar Chart horizontal)
- Índice de gravedad (Gauge)

## Datos

### Servicio de datos
`src/services/safetyDashboardService.js`

### Estructura de datos en Firestore

**Colección**: `safetyDashboard`
**ID de documento**: `{companyId}-{period}` (ej: `company-001-2025-01`)

```javascript
{
  companyId: string,
  companyName: string,
  period: string,              // Formato: YYYY-MM
  totalAccidents: number,
  totalIncidents: number,
  daysWithoutAccidents: number,
  frequencyIndex: number,
  severityIndex: number,
  trainingsDone: number,
  trainingsPlanned: number,
  inspectionsDone: number,
  inspectionsPlanned: number,
  deviationsFound: number,
  deviationsClosed: number,
  eppDeliveryRate: number,     // Porcentaje 0-100
  contractorCompliance: number, // Porcentaje 0-100
  legalCompliance: number,      // Porcentaje 0-100
  alerts: string[]              // Array de mensajes de alerta
}
```

## Datos de ejemplo

Si no hay datos en Firestore, el sistema muestra datos de ejemplo automáticamente.

Para agregar datos reales, crea un documento en Firestore con la estructura mencionada arriba.

## Personalización

### Colores por estado
- **Success**: Verde (>= umbral bueno)
- **Warning**: Ámbar (>= umbral advertencia)
- **Critical**: Rojo (< umbral advertencia)

### Umbrales predeterminados
Los umbrales se definen en `DashboardSeguridad.jsx` y pueden ser ajustados según necesidad.

## Iconos

Se usan iconos de Material UI (`@mui/icons-material`) ya disponibles en el proyecto.

