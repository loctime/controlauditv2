# Dashboard de Higiene y Seguridad

Dashboard visual para monitorear indicadores clave de higiene y seguridad laboral.

## Ubicación

- **Ruta**: `/dashboard-seguridad`
- **Componente principal**: `src/components/pages/dashboard/DashboardSeguridadV2.jsx`

## Acceso

El dashboard está disponible para usuarios con rol:
- `max` (Cliente Administrador)
- `supermax` (Super Administrador)

Se puede acceder desde el menú lateral o directamente navegando a `/dashboard-seguridad`.

## Componentes

### PeriodSelector
Selector de año y mes para filtrar datos del dashboard.

### SucursalSelector
Selector de sucursal para filtrar datos por ubicación.

### GaugeChart
Gráficos de medidores circulares para métricas de cumplimiento:
- Actividades SST/año
- Actividades SST/mes
- Capacitaciones/año

### EmployeeMetrics
Métricas de empleados:
- Total de empleados (operarios y administradores)
- Días sin accidentes
- Horas trabajadas

### SafetyGoals
Objetivos de seguridad:
- Índice de Frecuencia (IF)
- Índice de Gravedad (IG)
- Índice de Accidentabilidad (IA)

### TrainingMetrics
Métricas de capacitación:
- Charlas de seguridad
- Entrenamientos
- Capacitaciones

### SafetyCharts
Gráficos usando Recharts:
- Distribución de accidentes/incidentes (Pie Chart)
- Capacitaciones e inspecciones (Bar Chart)
- Porcentajes de cumplimiento (Bar Chart horizontal)
- Índice de gravedad (Gauge)

## Datos

### Servicio de datos
`src/services/safetyDashboardService.js`

El servicio obtiene datos en tiempo real de múltiples fuentes:
- **Auditorías** (`auditorias` collection): Para calcular cumplimiento legal y desvíos
- **Logs de operarios** (`logs_operarios` collection): Para accidentes e incidentes
- **Formularios** (`formularios` collection): Para capacitaciones e inspecciones
- **Empleados**: Para métricas de personal

### Datos en tiempo real

El dashboard utiliza listeners de Firestore (`onSnapshot`) para actualizaciones automáticas cuando cambian los datos.

### Estructura de datos

Los datos se calculan dinámicamente desde las colecciones de Firestore. El servicio procesa:
- Accidentes e incidentes desde logs
- Desvíos desde respuestas "No conforme" en auditorías
- Cumplimiento legal desde porcentaje de respuestas "Conforme"
- Capacitaciones desde formularios que contengan "capacitación", "entrenamiento" o "training"
- Inspecciones desde formularios que contengan "inspección" en el nombre

## Personalización

### Colores por estado
- **Success**: Verde (>= umbral bueno)
- **Warning**: Ámbar (>= umbral advertencia)
- **Critical**: Rojo (< umbral advertencia)

### Umbrales predeterminados
Los umbrales se definen en `DashboardSeguridadV2.jsx` y pueden ser ajustados según necesidad.

## Iconos

Se usan iconos de Material UI (`@mui/icons-material`) ya disponibles en el proyecto.

