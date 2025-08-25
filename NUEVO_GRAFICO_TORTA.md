# 🍰 Nuevo Gráfico de Torta para Auditorías

## 📋 Descripción

Se ha agregado un nuevo componente de gráfico de torta moderno y responsivo para los reportes de auditorías. Este gráfico utiliza Chart.js y Material-UI para proporcionar una visualización clara y profesional de las estadísticas de auditorías.

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

## 📁 Archivos Creados

### 1. `AuditoriaPieChart.jsx`
Componente principal del gráfico de torta.

**Props:**
- `estadisticas`: Objeto con las estadísticas `{ 'Conforme': 15, 'No conforme': 3, ... }`
- `title`: Título del gráfico (opcional)
- `height`: Altura del gráfico (por defecto: 400px)
- `width`: Ancho del gráfico (por defecto: '100%')
- `showLegend`: Mostrar/ocultar leyenda (por defecto: true)
- `showTooltips`: Mostrar/ocultar tooltips (por defecto: true)
- `variant`: Tipo de gráfico - 'pie' o 'doughnut' (por defecto: 'pie')

### 2. `DemoAuditoriaPieChart.jsx`
Componente de demostración con controles interactivos para probar el gráfico.

### 3. `Informe.jsx` (Actualizado)
Se actualizó para usar el nuevo gráfico de torta.

### 4. `ReporteDetallePro.jsx` (Actualizado)
Se agregó un switch para alternar entre el gráfico original y el nuevo.

## 🚀 Cómo Usar

### Uso Básico
```jsx
import AuditoriaPieChart from './AuditoriaPieChart';

const estadisticas = {
  'Conforme': 15,
  'No conforme': 3,
  'Necesita mejora': 2,
  'No aplica': 5
};

<AuditoriaPieChart
  estadisticas={estadisticas}
  title="Distribución de Respuestas"
  height={400}
/>
```

### Uso Avanzado
```jsx
<AuditoriaPieChart
  estadisticas={estadisticas}
  title="Resultados de Auditoría"
  height={500}
  showLegend={true}
  showTooltips={true}
  variant="doughnut"
  width="80%"
/>
```

## 🔧 Integración en Reportes Existentes

### En ReporteDetallePro.jsx
Se agregó un switch para alternar entre gráficos:
```jsx
<FormControlLabel
  control={
    <Switch
      checked={useNewChart}
      onChange={(e) => setUseNewChart(e.target.checked)}
      size="small"
    />
  }
  label={useNewChart ? "Nuevo Gráfico de Torta" : "Gráfico Donut Original"}
/>
```

### En Informe.jsx
Se reemplazó el gráfico anterior con el nuevo:
```jsx
<AuditoriaPieChart
  estadisticas={estadisticas}
  title="Distribución de Respuestas de Auditoría"
  height={400}
  showLegend={true}
  showTooltips={true}
  variant="pie"
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

## 🔄 Migración

Para migrar reportes existentes al nuevo gráfico:

1. **Reemplazar import:**
   ```jsx
   // Antes
   import { Pie } from "react-chartjs-2";
   
   // Después
   import AuditoriaPieChart from './AuditoriaPieChart';
   ```

2. **Actualizar componente:**
   ```jsx
   // Antes
   <Pie data={data} options={options} />
   
   // Después
   <AuditoriaPieChart estadisticas={estadisticas} />
   ```

3. **Eliminar configuración manual:**
   - No es necesario configurar colores manualmente
   - No es necesario configurar tooltips manualmente
   - No es necesario configurar leyendas manualmente

## 🧪 Testing

Para probar el nuevo gráfico:

1. Navegar a la página de reportes de auditorías
2. Abrir un reporte detallado
3. Usar el switch para alternar entre gráficos
4. Probar diferentes configuraciones en el demo

## 📝 Notas Técnicas

- **Dependencias**: Chart.js, react-chartjs-2, Material-UI
- **Compatibilidad**: Funciona con datos existentes sin cambios
- **Performance**: Optimizado con useMemo para re-renders
- **Accesibilidad**: Incluye labels y descripciones apropiadas

## 🎨 Personalización

Para personalizar colores o estilos, modificar las constantes en `AuditoriaPieChart.jsx`:

```javascript
const COLOR_MAP = {
  'Conforme': '#43a047',        // Cambiar color verde
  'No conforme': '#e53935',    // Cambiar color rojo
  'Necesita mejora': '#fbc02d',// Cambiar color amarillo
  'No aplica': '#1976d2',      // Cambiar color azul
};
```
