# 🔧 Mejoras para Datos Reales del Dashboard

## 📋 Datos que Necesitas Agregar

### 1. **Colección: `empresas`**
Agregar campos:
```javascript
{
  // ... campos existentes
  totalEmpleados: 50,           // ✅ Total de empleados
  empleadosOperativos: 38,      // ✅ Operarios
  empleadosAdministrativos: 12, // ✅ Administrativos
  horasMensualesTrabajadas: 12000 // ✅ Horas trabajadas al mes
}
```

### 2. **Colección: `formularios`**
Agregar campos para capacitaciones:
```javascript
{
  // ... campos existentes
  tipo: 'capacitacion',  // ✅ 'charla', 'entrenamiento', 'capacitacion'
  planificado: true,     // ✅ Si fue planificado
  fechaPlanificada: Timestamp // ✅ Fecha planificada
}
```

### 3. **Colección: `auditorias`**
Agregar campos:
```javascript
{
  // ... campos existentes
  tipo: 'inspeccion',    // ✅ Tipo de auditoría
  planificado: true,     // ✅ Si fue planificado
  fechaPlanificada: Timestamp
}
```

### 4. **Nueva Colección: `desvios`** (Opcional)
Para rastrear desvíos y su cierre:
```javascript
{
  id: 'desvio-001',
  auditoriaId: 'auditoria-123',
  empresaId: '17dixBvPWs93vPdn33B3',
  descripcion: 'Falta de señalización',
  fechaDeteccion: Timestamp,
  estado: 'abierto', // 'abierto', 'en_proceso', 'cerrado'
  fechaCierre: Timestamp,
  responsable: 'Juan Pérez'
}
```

### 5. **Nueva Colección: `entregas_epp`** (Opcional)
Para rastrear entregas de EPP:
```javascript
{
  id: 'epp-001',
  empresaId: '17dixBvPWs93vPdn33B3',
  empleadoId: 'emp-123',
  elementos: ['casco', 'guantes', 'botas'],
  fechaEntrega: Timestamp,
  fechaVencimiento: Timestamp
}
```

### 6. **Nueva Colección: `contratistas`** (Opcional)
Para rastrear cumplimiento de contratistas:
```javascript
{
  id: 'contratista-001',
  empresaId: '17dixBvPWs93vPdn33B3',
  nombre: 'Contratista XYZ',
  documentacion: {
    arl: { vigente: true, vencimiento: Timestamp },
    seguros: { vigente: true, vencimiento: Timestamp }
  },
  cumplimiento: 95 // % de cumplimiento
}
```

---

## 🚀 Implementación Rápida (Sin nuevas colecciones)

### **Paso 1:** Actualizar el documento de tu empresa

Ve a Firebase Console > Firestore > `empresas` > tu empresa y agrega:

```json
{
  "totalEmpleados": 50,
  "empleadosOperativos": 38,
  "empleadosAdministrativos": 12,
  "horasMensualesTrabajadas": 12000
}
```

### **Paso 2:** Actualizar `safetyDashboardService.js`

Modificar para usar datos reales de la empresa:

```javascript
// En lugar de línea 185
const totalEmployees = companyInfo?.totalEmpleados || 50;
const operators = companyInfo?.empleadosOperativos || Math.floor(totalEmployees * 0.75);
const administrators = companyInfo?.empleadosAdministrativos || Math.floor(totalEmployees * 0.25);
const hoursWorked = companyInfo?.horasMensualesTrabajadas || (totalEmployees * 8 * 30);
```

---

## 📊 Prioridad de Implementación

### **Alta Prioridad** ⭐⭐⭐
1. ✅ Datos de empleados en `empresas`
2. ✅ Tipos de capacitación en `formularios`
3. ✅ Planificaciones en `formularios` y `auditorias`

### **Media Prioridad** ⭐⭐
4. Nueva colección `desvios`
5. Mejorar logs para incluir más detalles de accidentes

### **Baja Prioridad** ⭐
6. Colección `entregas_epp`
7. Colección `contratistas`

---

## 🎯 Resultado Final

Con estas mejoras, el dashboard mostrará:
- ✅ **100% datos reales** de auditorías y cumplimiento
- ✅ **100% datos reales** de accidentes/incidentes
- ✅ **100% datos reales** de empleados y horas trabajadas
- ✅ **100% datos reales** de capacitaciones planificadas vs realizadas
- ⚠️ **Datos estimados** solo para EPP y contratistas (si no implementas esas colecciones)

