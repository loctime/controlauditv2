# 🍰 Sistema de Gráficos para Reportes de Auditoría

## 📋 Descripción

El sistema de reportes de auditoría utiliza gráficos de Google Charts para proporcionar una visualización clara y profesional de las estadísticas de auditorías. El formato de impresión replica el diseño "Urquiza" con un layout compacto y profesional.

## 🎨 Características

### Colores por Categoría
- ✅ **Conforme** - Verde (#43a047)
- ❌ **No conforme** - Rojo (#e53935)
- ⚠️ **Necesita mejora** - Amarillo (#fbc02d)
- ℹ️ **No aplica** - Azul (#1976d2)

### Funcionalidades
- **Iconos visuales** en las leyendas
- **Tooltips informativos** con porcentajes
- **Animaciones suaves** al cargar
- **Responsive design** para diferentes dispositivos
- **Manejo de datos vacíos** con mensaje informativo
- **Dos variantes**: Torta (pie) y Donut (doughnut)
- **Resumen numérico** debajo del gráfico

## 📁 Archivos del Sistema

### 1. `EstadisticasChart.jsx`
Componente principal del gráfico de donut usando Google Charts.

**Props:**
- `estadisticas`: Objeto con las estadísticas `{ 'Conforme': 15, 'No conforme': 3, ... }`
- `title`: Título del gráfico (opcional)
- `height`: Altura del gráfico (por defecto: 320px)
- `width`: Ancho del gráfico (por defecto: '100%')

### 2. `ReporteDetallePro.jsx` (Actualizado)
Componente principal del reporte con formato estilo "Urquiza" optimizado para impresión.

### 3. `Informe.jsx` (Actualizado)
Se actualizó para usar el gráfico de Google Charts.

### 4. `DemoReporteUrquiza.jsx`
Componente de demostración para probar el nuevo formato de reporte.

## 🚀 Cómo Usar

### Uso Básico
```jsx
import EstadisticasChart from './EstadisticasChart';

const estadisticas = {
  'Conforme': 15,
  'No conforme': 3,
  'Necesita mejora': 2,
  'No aplica': 5
};

<EstadisticasChart
  estadisticas={estadisticas}
  title="Distribución de Respuestas"
  height={320}
/>
```

### Uso en Reportes
```jsx
import ReporteDetallePro from './ReporteDetallePro';

<ReporteDetallePro
  reporte={datosReporte}
  modo="modal"
  open={true}
  onClose={handleClose}
/>
```

## 🔧 Integración en Reportes

### En ReporteDetallePro.jsx
El componente usa automáticamente el gráfico de Google Charts:
```jsx
<EstadisticasChart
  ref={chartRef}
  estadisticas={reporte.estadisticas.conteo}
  title="Distribución general de respuestas"
/>
```

### En Informe.jsx
Se usa el gráfico de Google Charts:
```jsx
<EstadisticasChart
  estadisticas={estadisticas}
  title="Distribución de Respuestas de Auditoría"
  height={320}
/>
```

## 📊 Formato de Datos

El componente espera recibir las estadísticas en este formato:
```javascript
{
  'Conforme': 15,
  'No conforme': 3,
  'Necesita mejora': 2,
  'No aplica': 5
}
```

## 🎯 Ventajas del Nuevo Gráfico

1. **Mejor UX**: Iconos visuales y colores consistentes
2. **Más Información**: Tooltips con porcentajes y cantidades
3. **Responsive**: Se adapta a diferentes tamaños de pantalla
4. **Accesible**: Manejo de datos vacíos y estados de error
5. **Personalizable**: Múltiples opciones de configuración
6. **Moderno**: Diseño actualizado con Material-UI

## 🎯 Características del Formato Urquiza

El nuevo formato de reporte incluye:

1. **Cabecera compacta** con logo y datos del establecimiento
2. **Tabla de resumen** con badges de colores y porcentajes
3. **Gráfico donut** integrado usando Google Charts
4. **Secciones numeradas** (1.1, 1.2, etc.)
5. **Metadatos por sección** con conteos
6. **Firmas mejoradas** con mejor layout
7. **Comentarios generales** al final
8. **Geolocalización** opcional
9. **Optimizado para impresión** A4

## 🧪 Testing

Para probar el nuevo formato:

1. Navegar a la página de reportes de auditorías
2. Abrir un reporte detallado
3. Usar el botón "Imprimir" para ver el formato final
4. Probar el demo en `DemoReporteUrquiza.jsx`

## 📝 Notas Técnicas

- **Dependencias**: Google Charts, Material-UI
- **Compatibilidad**: Funciona con datos existentes sin cambios
- **Performance**: Optimizado para impresión
- **Accesibilidad**: Incluye labels y descripciones apropiadas

## 🎨 Personalización

Para personalizar colores o estilos, modificar las constantes en `EstadisticasChart.jsx`:

```javascript
const COLOR_MAP = {
  'Conforme': '#43a047',        // Cambiar color verde
  'No conforme': '#e53935',    // Cambiar color rojo
  'Necesita mejora': '#fbc02d',// Cambiar color amarillo
  'No aplica': '#1976d2',      // Cambiar color azul
};
```
