# 📊 Dashboard de Higiene y Seguridad - Datos Reales

## 🎯 **¿Qué cambió?**

El dashboard ahora conecta con **datos reales** de tu sistema en lugar de mostrar datos de ejemplo.

## 📈 **Fuentes de Datos**

### **1. Auditorías (`auditorias` collection)**
- **Accidentes e incidentes**: Detectados automáticamente desde logs
- **Desvíos**: Calculados desde respuestas "No conforme" 
- **Cumplimiento legal**: Porcentaje de respuestas "Conforme"
- **Inspecciones**: Formularios que contengan "inspección" en el nombre

### **2. Logs de Operarios (`logs_operarios` collection)**
- **Accidentes reportados**: Logs con `accion` que contenga "accidente"
- **Incidentes reportados**: Logs con `accion` que contenga "incidente"
- **Actividad reciente**: Para calcular días sin accidentes

### **3. Formularios (`formularios` collection)**
- **Capacitaciones**: Formularios con "capacitación", "entrenamiento" o "training"
- **Renovaciones**: Formularios vencidos (>365 días)

## 🔢 **Cálculos Automáticos**

### **Métricas de Seguridad**
```javascript
// Índice de Frecuencia = (Accidentes × 1,000,000) / Horas Trabajadas
frequencyIndex = (accidents.length * 1000000) / hoursWorked

// Índice de Gravedad = (Días Perdidos × 1,000,000) / Horas Trabajadas  
severityIndex = (diasPerdidos * 1000000) / hoursWorked

// Días sin Accidentes = Fecha actual - Último accidente
daysWithoutAccidents = Math.floor((Date.now() - lastAccident) / (1000 * 60 * 60 * 24))
```

### **Cumplimiento**
```javascript
// Cumplimiento Legal = (Respuestas Conformes / Total Auditorías) × 100
legalCompliance = (conformes / totalAuditorias) * 100

// Desvíos Cerrados = Estimación del 75% de desvíos encontrados
deviationsClosed = Math.floor(deviations * 0.75)
```

## 🚨 **Alertas Inteligentes**

El sistema genera alertas automáticas basadas en:

1. **Auditorías no conformes**: Hallazgos que requieren acción
2. **Capacitaciones vencidas**: Formularios >365 días de antigüedad  
3. **Accidentes recientes**: Reportados en últimos 30 días
4. **Inspecciones pendientes**: Con estado "pendiente" o "en_progreso"

## 📊 **Gráficos Dinámicos**

### **Datos Reales Disponibles:**
- **Accidentes por mes**: Últimos 6 meses desde logs
- **Incidentes por tipo**: Clasificación automática desde logs
- **Tendencia de cumplimiento**: Evolución mensual de auditorías conformes

### **Gráficos con Datos de Ejemplo:**
- **Distribución de eventos**: Si no hay datos reales suficientes
- **Capacitaciones vs planificadas**: Comparación actual vs meta
- **Porcentajes de cumplimiento**: EPP, contratistas, legal

## 🔧 **Configuración por Empresa**

### **Identificación de Empresa:**
```javascript
// El sistema usa automáticamente:
companyId = userProfile?.empresaId || userProfile?.uid
```

### **Período Actual:**
```javascript
// Período por defecto: mes actual
period = new Date().toISOString().slice(0, 7) // YYYY-MM
```

## 📝 **Cómo Agregar Más Datos**

### **Para Accidentes/Incidentes:**
1. Crear logs en `logs_operarios` con:
   ```javascript
   {
     accion: "Reporte de accidente en área X",
     detalles: {
       tipo: "accidente",
       empresaId: "tu-empresa-id",
       diasPerdidos: 5 // opcional
     }
   }
   ```

### **Para Capacitaciones:**
1. Crear formularios con nombres que contengan:
   - "capacitación"
   - "entrenamiento" 
   - "training"

### **Para Inspecciones:**
1. Crear formularios con nombres que contengan:
   - "inspección"
   - "inspeccion"

## 🎯 **Próximos Pasos**

1. **Verificar datos**: Revisar que las métricas reflejen la realidad
2. **Ajustar cálculos**: Modificar fórmulas según necesidades específicas
3. **Agregar más fuentes**: Conectar con otros sistemas (HR, mantenimiento)
4. **Personalizar alertas**: Definir umbrales específicos por empresa

## 🔍 **Debugging**

Para ver qué datos está obteniendo el sistema:

1. Abrir **DevTools** → **Console**
2. Buscar logs que empiecen con `[SafetyDashboard]`
3. Verificar:
   - `📊 X auditorías encontradas`
   - `📝 X logs encontrados` 
   - `📋 X formularios encontrados`

## ⚡ **Rendimiento**

- **Consultas optimizadas**: Máximo 100 logs por consulta
- **Datos en paralelo**: Auditorías, logs y formularios se cargan simultáneamente
- **Fallback inteligente**: Datos de ejemplo si hay errores de conexión
