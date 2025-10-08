# 🏢 Nueva Tabla de Sucursales Expandible

## ✅ ¿Qué se cambió?

La página `/sucursales` ahora muestra una **tabla expandible** en lugar de tarjetas, con funcionalidad completa de gestión por sucursal.

---

## 🎯 Características Principales

### 📊 **Vista de Tabla**
- **Información compacta**: Nombre, empresa, dirección, teléfono
- **Estadísticas en tiempo real**: Empleados, capacitaciones, accidentes
- **Indicadores visuales**: Iconos de color según el estado
- **Fila expandible**: Clic en la flecha para ver opciones de gestión

### 🔧 **Gestión por Sucursal**
Cada sucursal expandida muestra:

1. **Dashboard** (botón azul)
   - Ver estadísticas detalladas de la sucursal
   - Gráficos y métricas específicas

2. **Empleados** (botón outline)
   - Gestionar empleados de esa sucursal
   - Muestra cantidad registrada

3. **Capacitaciones** (botón outline)
   - Crear y gestionar capacitaciones
   - Muestra completadas/total

4. **Accidentes** (botón outline)
   - Registrar incidentes y accidentes
   - Muestra cantidad registrada

### 📈 **Estadísticas en Tiempo Real**
- **Empleados activos**: Contador total
- **Capacitaciones completadas**: X/Y formato
- **Capacitaciones pendientes**: Diferencia entre total y completadas
- **Incidentes/Accidentes**: Con color según gravedad

---

## 🚀 Cómo Funciona

### 1. **Navegación Inteligente**
```
Sucursales → Clic en flecha → Clic en botón → Página específica
```

- Al hacer clic en cualquier botón de gestión, automáticamente:
  - Se preselecciona esa sucursal
  - Se navega a la página correspondiente
  - La página se carga con la sucursal correcta

### 2. **Preselección de Sucursal**
- Usa `localStorage` para pasar la sucursal seleccionada
- Se limpia automáticamente después de usar
- Fallback a primera sucursal si no hay selección

### 3. **Estadísticas Dinámicas**
- Se cargan automáticamente al abrir la página
- Consultas a Firestore: `empleados`, `capacitaciones`, `accidentes`
- Se actualizan en tiempo real

---

## 📱 Diseño Responsivo

### **Desktop** (md+)
- 4 botones en fila horizontal
- Resumen de estadísticas en grid 4 columnas
- Tabla completa con todas las columnas

### **Tablet** (sm-md)
- 2 botones por fila
- Resumen en grid 2 columnas
- Tabla adaptada

### **Mobile** (xs)
- 1 botón por fila
- Resumen en grid 2 columnas
- Tabla con scroll horizontal

---

## 🎨 Elementos Visuales

### **Iconos por Tipo**
- 👥 **Empleados**: `PeopleIcon` (azul)
- 🎓 **Capacitaciones**: `SchoolIcon` (morado)
- ⚠️ **Accidentes**: `ReportProblemIcon` (rojo si hay abiertos, gris si no)
- 📊 **Dashboard**: `DashboardIcon` (azul, botón destacado)

### **Colores de Estado**
- **Empleados**: Azul primario
- **Capacitaciones**: Morado secundario
- **Accidentes**: Rojo si hay abiertos, verde si no hay
- **Pendientes**: Amarillo warning

### **Estados de Expansión**
- **Contraído**: Flecha hacia abajo
- **Expandido**: Flecha hacia arriba
- **Animación**: Suave con `Collapse` de MUI

---

## 🔄 Flujo de Trabajo

### **Para Administradores**
1. **Ir a `/sucursales`**
2. **Ver todas las sucursales** en tabla compacta
3. **Expandir sucursal** que quiera gestionar
4. **Ver estadísticas** en tiempo real
5. **Clic en botón** para ir a gestión específica
6. **Gestionar** empleados/capacitaciones/accidentes
7. **Volver a sucursales** y ver estadísticas actualizadas

### **Ventajas**
- ✅ **Vista general** de todas las sucursales
- ✅ **Acceso rápido** a gestión específica
- ✅ **Estadísticas visuales** sin entrar a cada página
- ✅ **Navegación intuitiva** con preselección automática
- ✅ **Datos en tiempo real** siempre actualizados

---

## 🛠️ Detalles Técnicos

### **Componentes Modificados**
- `ListaSucursales.jsx`: Completamente reescrito como tabla
- `Empleados.jsx`: Agregado soporte para localStorage
- `Capacitaciones.jsx`: Agregado soporte para localStorage  
- `Accidentes.jsx`: Agregado soporte para localStorage
- `DashboardSeguridadV2.jsx`: Agregado soporte para localStorage

### **Nuevas Funciones**
- `loadSucursalesStats()`: Carga estadísticas de cada sucursal
- `toggleRow()`: Maneja expansión/contracción de filas
- `navigateToPage()`: Navegación con preselección de sucursal

### **Consultas Firestore**
```javascript
// Para cada sucursal se ejecutan 3 consultas paralelas:
query(collection(db, 'empleados'), where('sucursalId', '==', sucursalId))
query(collection(db, 'capacitaciones'), where('sucursalId', '==', sucursalId))
query(collection(db, 'accidentes'), where('sucursalId', '==', sucursalId))
```

### **Estado Local**
- `expandedRows`: Set con IDs de filas expandidas
- `sucursalesStats`: Objeto con estadísticas por sucursal
- `localStorage`: Comunicación entre componentes

---

## 🎯 Casos de Uso

### **Caso 1: Ver Estado General**
1. Admin entra a `/sucursales`
2. Ve tabla con todas las sucursales
3. Observa estadísticas sin expandir
4. Identifica sucursales que necesitan atención

### **Caso 2: Gestionar Empleados**
1. Admin expande sucursal "Planta Norte"
2. Ve que tiene 15 empleados registrados
3. Clic en botón "Empleados"
4. Se abre página con sucursal preseleccionada
5. Agrega/edita empleados
6. Vuelve a sucursales y ve contador actualizado

### **Caso 3: Revisar Capacitaciones**
1. Admin ve que "Planta Sur" tiene 3/5 capacitaciones completadas
2. Expande la fila
3. Ve resumen: 2 capacitaciones pendientes
4. Clic en "Capacitaciones"
5. Completa las capacitaciones faltantes

### **Caso 4: Dashboard Específico**
1. Admin quiere ver dashboard de sucursal específica
2. Expande la sucursal
3. Clic en "Dashboard" (botón azul destacado)
4. Se abre dashboard con esa sucursal preseleccionada
5. Ve métricas específicas de esa sucursal

---

## ✨ Beneficios

### **Para el Usuario**
- 🚀 **Navegación más rápida**
- 📊 **Vista general clara**
- 🎯 **Acceso directo a gestión**
- 📱 **Funciona en móvil**

### **Para el Sistema**
- ⚡ **Consultas optimizadas**
- 🔄 **Datos en tiempo real**
- 💾 **Estado persistente**
- 🎨 **UI/UX mejorada**

---

## 🚨 Notas Importantes

### **Índices Firestore Requeridos**
Para que las estadísticas funcionen correctamente, necesitas estos índices:

```
empleados: sucursalId (Asc)
capacitaciones: sucursalId (Asc), fechaRealizada (Desc)
accidentes: sucursalId (Asc), fechaHora (Desc)
```

### **Performance**
- Las estadísticas se cargan una vez al abrir la página
- No hay polling automático (se actualiza al recargar)
- Para datos en tiempo real, usar `onSnapshot` en lugar de `getDocs`

### **LocalStorage**
- Se usa temporalmente para preselección
- Se limpia automáticamente después de usar
- No afecta el funcionamiento normal si se limpia manualmente

---

## 🎉 Resultado Final

**¡La página de sucursales ahora es un centro de control completo!**

- ✅ Vista general de todas las sucursales
- ✅ Estadísticas en tiempo real
- ✅ Acceso directo a gestión específica
- ✅ Navegación intuitiva
- ✅ Diseño responsive
- ✅ Integración perfecta con el sistema existente

**¡El sistema está listo para usar!** 🚀
