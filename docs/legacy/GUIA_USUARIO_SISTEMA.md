# Guía de Usuario - Sistema de Empleados, Capacitaciones y Accidentes

## Inicio Rápido

### 1. Acceso al Sistema

Como administrador (`max` o `supermax`), ahora tienes 3 nuevas secciones en el menú:
- 👥 **Empleados**
- 📚 **Capacitaciones**
- 🚨 **Accidentes**

---

## 👥 Gestión de Empleados

### Agregar un Empleado

1. Ve a **Empleados** en el menú
2. Selecciona la **Sucursal** donde trabajará
3. Clic en **"Nuevo Empleado"**
4. Completa los datos:
   - Nombre completo
   - DNI
   - Cargo (ej: Operario, Supervisor)
   - Área (ej: Producción, Administración)
   - Tipo: Operativo o Administrativo
   - Fecha de ingreso
   - Estado: Activo
5. Clic en **"Guardar"**

### Buscar/Filtrar Empleados

- **Buscar:** Por nombre o DNI
- **Filtrar por:** Cargo, Tipo, Estado
- **Editar:** Clic en el ícono de lápiz
- **Eliminar:** Clic en el ícono de papelera

---

## 📚 Gestión de Capacitaciones

### Crear una Capacitación

1. Ve a **Capacitaciones** en el menú
2. Selecciona la **Sucursal**
3. Clic en **"Nueva Capacitación"**
4. Completa los datos:
   - Nombre (ej: Prevención de Riesgos Laborales)
   - Descripción
   - Tipo: Charla, Entrenamiento o Capacitación
   - Instructor
   - Fecha de realización
5. Clic en **"Crear"**

La capacitación se crea con estado **"Activa"** y sin asistentes registrados.

### Registrar Asistencia

1. En el listado de capacitaciones, encuentra la capacitación **activa**
2. Clic en **"Registrar Asistencia"**
3. Verás la lista de TODOS los empleados de la sucursal
4. **Marca los checkboxes** de los empleados que asistieron
   - Tip: Usa "Marcar Todos" para seleccionar todos
5. Clic en **"Guardar"**

**Importante:** Si un empleado nuevo ingresó después de crear la capacitación, **aparecerá en la lista** automáticamente para que lo puedas marcar.

### Marcar como Completada

1. Cuando hayas registrado todos los asistentes
2. Clic en **"Completar"**
3. La capacitación cambia a estado **"Completada"**

### Duplicar Capacitación

1. Cuando una capacitación está **completada**
2. Clic en **"Duplicar"**
3. Se crea una **nueva instancia** con:
   - Mismo nombre y descripción
   - Fecha actual
   - Estado: Activa
   - Sin asistentes (lista vacía)
4. Ya puedes registrar asistencia en la nueva instancia

**Uso típico:** Capacitaciones anuales que se repiten cada año.

---

## 🚨 Registro de Accidentes

### Registrar un Accidente/Incidente

1. Ve a **Accidentes** en el menú
2. Selecciona la **Sucursal**
3. Clic en **"Registrar Accidente"**
4. Completa los datos:
   - **Tipo:** Accidente o Incidente
   - **Gravedad:** Leve, Moderado o Grave
   - **Empleado afectado:** Selecciona de la lista
   - **Fecha y hora:** Cuándo ocurrió
   - **Lugar:** Ubicación específica (ej: Sector Producción - Línea 2)
   - **Descripción:** Detalla lo que sucedió
   - **Días perdidos:** Cantidad de días que el empleado no pudo trabajar
   - **Estado:** Abierto (en investigación) o Cerrado
5. Clic en **"Guardar"**

### Filtrar Accidentes

- Por **Tipo:** Accidente o Incidente
- Por **Gravedad:** Leve, Moderado, Grave
- Por **Estado:** Abierto o Cerrado

---

## 📊 Dashboard de Seguridad

### Selector de Sucursal

El dashboard ahora tiene un **selector de sucursales** en la parte superior.

1. Ve a **Dashboard Higiene y Seguridad**
2. Selecciona la **Sucursal** que quieres ver
3. El dashboard se actualiza automáticamente con los datos de esa sucursal

### Datos Mostrados (100% Reales)

El dashboard ahora muestra datos reales de:

✅ **Empleados:**
- Total de empleados activos
- Operativos vs Administrativos
- Horas trabajadas (calculadas)

✅ **Accidentes:**
- Total de accidentes registrados
- Total de incidentes
- Días sin accidentes
- Índices de frecuencia y severidad

✅ **Capacitaciones:**
- Capacitaciones completadas
- Capacitaciones activas (planificadas)
- Progreso por tipo (Charlas, Entrenamientos, Capacitaciones)

✅ **Gráficos:**
- Accidentes por mes
- Incidentes por gravedad
- Tendencias de cumplimiento

---

## Flujo de Trabajo Típico

### Inicio de Operaciones en una Sucursal

1. **Cargar Empleados**
   - Ir a Empleados → Seleccionar sucursal
   - Agregar todos los empleados uno por uno
   - O esperar funcionalidad de importar Excel (próximamente)

2. **Planificar Capacitaciones Anuales**
   - Ir a Capacitaciones → Seleccionar sucursal
   - Crear cada capacitación planificada para el año
   - Ej: "Prevención de Riesgos", "Uso de EPP", "Primeros Auxilios", etc.

3. **Ejecutar Capacitaciones**
   - Cuando realices una capacitación
   - Abrir "Registrar Asistencia"
   - Marcar empleados presentes
   - Guardar

4. **Al Finalizar el Ciclo**
   - Marcar como "Completada"
   - Si se repite (ej: anualmente), usar "Duplicar"

5. **Si Ocurre un Accidente**
   - Registrar inmediatamente en "Accidentes"
   - El dashboard se actualiza automáticamente

---

## Preguntas Frecuentes

### ¿Puedo editar una capacitación después de crearla?
Por ahora no hay edición. Si necesitas cambiar algo, elimínala y créala de nuevo, o duplica y modifica.

### ¿Puedo eliminar un empleado?
Sí, pero es mejor cambiar su estado a "Inactivo" para mantener el historial.

### ¿Los empleados nuevos aparecen automáticamente en las capacitaciones?
Sí! Cuando registres asistencia, verás TODOS los empleados activos de la sucursal, incluyendo los que se agregaron después de crear la capacitación.

### ¿Puedo agregar empleados a una capacitación después de marcarla como completada?
No. Una vez completada, debes duplicarla para crear una nueva instancia.

### ¿Cómo se calculan los índices de accidentabilidad?
- **Índice de Frecuencia:** (Número de accidentes × 1,000,000) / Horas trabajadas
- **Índice de Severidad:** (Días perdidos × 1,000,000) / Horas trabajadas
- **Horas trabajadas:** Empleados activos × 8 horas × 30 días

---

## Próximas Mejoras (Fase 2)

- 📥 Importar empleados desde Excel
- 📄 Generar certificados automáticos de capacitación
- 📧 Notificaciones de capacitaciones próximas
- 📊 Reportes exportables en PDF
- 📱 Portal para que empleados vean sus capacitaciones
- 🔄 Renovación automática de capacitaciones anuales

