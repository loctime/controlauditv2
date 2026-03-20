# 🧪 Instrucciones para Probar el Sistema

## ✅ Pre-requisitos

Antes de probar, asegúrate de:

1. ✅ El servidor está corriendo (`npm run dev:web`)
2. ✅ Estás logueado como `max` o `supermax`
3. ✅ Tienes al menos 1 sucursal creada

---

## 🔧 Paso 1: Crear Índices en Firebase (OBLIGATORIO)

### Opción A: Esperar a que aparezca el error y hacer clic

1. Ve a cada página (Empleados, Capacitaciones, Accidentes)
2. Si ves un error en consola que dice "The query requires an index"
3. Haz clic en el enlace que aparece en el error
4. Firebase abrirá la página para crear el índice automáticamente
5. Clic en "Create Index"

### Opción B: Crear manualmente (recomendado)

Ve a Firebase Console y crea estos índices:

**Para `empleados`:**
- Collection: `empleados`
- Fields: `sucursalId` (Asc), `nombre` (Asc)

**Para `capacitaciones`:**
- Collection: `capacitaciones`
- Fields: `sucursalId` (Asc), `fechaRealizada` (Desc)

**Para `accidentes`:**
- Collection: `accidentes`
- Fields: `sucursalId` (Asc), `fechaHora` (Desc)

---

## 👥 Paso 2: Probar Gestión de Empleados

1. **Ir a "Empleados"** en el menú
2. Deberías ver un selector de sucursal
3. **Selecciona una sucursal**
4. Clic en **"Nuevo Empleado"**
5. Llena los datos:
   ```
   Nombre: Juan Pérez
   DNI: 12345678
   Cargo: Operario
   Área: Producción
   Tipo: Operativo
   Fecha Ingreso: (hoy)
   Estado: Activo
   ```
6. **Guardar**
7. Deberías ver el empleado en la tabla
8. **Agrega 2-3 empleados más** para tener datos de prueba

### Verificaciones:
- ✅ El empleado aparece en la tabla
- ✅ Puedes filtrar por cargo, tipo, estado
- ✅ Puedes buscar por nombre o DNI
- ✅ Puedes editar el empleado
- ✅ Si cambias de sucursal, no ves los empleados de la otra

---

## 📚 Paso 3: Probar Capacitaciones

1. **Ir a "Capacitaciones"** en el menú
2. Selecciona la **misma sucursal** donde agregaste empleados
3. Clic en **"Nueva Capacitación"**
4. Llena los datos:
   ```
   Nombre: Prevención de Riesgos Laborales
   Descripción: Capacitación anual obligatoria
   Tipo: Charla
   Instructor: Carlos Gómez
   Fecha: (hoy)
   ```
5. **Crear**
6. Deberías ver la capacitación con estado "Activa"
7. Clic en **"Registrar Asistencia"**
8. Deberías ver la lista de empleados que agregaste
9. **Marca los checkboxes** de 2-3 empleados
10. Clic en **"Guardar"**
11. Vuelves a la lista de capacitaciones
12. Deberías ver "3 asistentes" (o los que marcaste)

### Verificaciones:
- ✅ La capacitación se crea correctamente
- ✅ Aparecen TODOS los empleados de la sucursal (incluso si los agregaste después)
- ✅ Los checkboxes se marcan correctamente
- ✅ El contador de asistentes se actualiza
- ✅ Puedes volver a "Registrar Asistencia" y agregar más empleados

### Probar "Completar":
13. Clic en **"Completar"** en la capacitación
14. El estado cambia a "Completada"
15. Ya no puedes registrar más asistencia
16. Aparece botón **"Duplicar"**

### Probar "Duplicar":
17. Clic en **"Duplicar"**
18. Se crea una **nueva capacitación** con:
    - Mismo nombre
    - Estado: Activa
    - Sin asistentes
19. Puedes volver a registrar asistencia en la nueva

---

## 🚨 Paso 4: Probar Accidentes

1. **Ir a "Accidentes"** en el menú
2. Selecciona la sucursal
3. Clic en **"Registrar Accidente"**
4. Llena los datos:
   ```
   Tipo: Accidente
   Gravedad: Leve
   Empleado: (selecciona uno de los que creaste)
   Fecha/Hora: (hoy, ahora)
   Lugar: Sector de Producción - Línea 2
   Descripción: Corte superficial en mano derecha
   Días perdidos: 1
   Estado: Cerrado
   ```
5. **Guardar**
6. Deberías ver el accidente en la lista

### Verificaciones:
- ✅ El accidente se registra correctamente
- ✅ Solo puedes seleccionar empleados de esa sucursal
- ✅ Los chips de color cambian según gravedad
- ✅ Puedes filtrar por tipo, gravedad, estado

---

## 📊 Paso 5: Verificar Dashboard

1. **Ir a "Dashboard Higiene y Seguridad"**
2. En la parte superior, deberías ver **selector de sucursales**
3. **Selecciona la sucursal** donde agregaste datos
4. El dashboard debería mostrar:
   ```
   Total Empleados: 3 (o los que agregaste)
   Operativos: 2-3
   Administrativos: 0-1
   Total Accidentes: 1
   Capacitaciones Realizadas: 1 (completada)
   Capacitaciones Planificadas: 1 (activa)
   ```

### Verificaciones:
- ✅ Los números coinciden con lo que agregaste
- ✅ Al cambiar de sucursal, los datos cambian
- ✅ Los gráficos muestran datos reales
- ✅ Los indicadores de progreso funcionan

---

## 🎯 Paso 6: Probar Flujo Completo

### Simular un mes de trabajo:

1. **Semana 1:**
   - Agregar 5 empleados nuevos
   - Crear capacitación "Uso de EPP"
   - Registrar asistencia de 3 empleados
   - Dashboard: 5 empleados, 1 capacitación activa

2. **Semana 2:**
   - Agregar 2 empleados más (nuevos que entraron)
   - Abrir "Registrar Asistencia" de "Uso de EPP"
   - Marcar los 2 nuevos empleados (ahora 5 asistentes total)
   - Marcar como "Completada"
   - Dashboard: 7 empleados, 1 capacitación completada

3. **Semana 3:**
   - Duplicar capacitación "Uso de EPP"
   - Dashboard: 7 empleados, 1 completada, 1 activa
   - Registrar accidente leve
   - Dashboard: muestra 1 accidente, días sin accidentes se resetea

4. **Semana 4:**
   - Crear nueva capacitación "Primeros Auxilios"
   - Registrar asistencia de todos
   - Dashboard: 2 activas, 1 completada

### Resultado Final:
- 7 empleados
- 3 capacitaciones (1 completada, 2 activas)
- 1 accidente
- Dashboard muestra todo correctamente

---

## 🐛 Solución de Problemas Comunes

### "No tienes sucursales asignadas"
**Causa:** `userSucursales` no se ha cargado aún
**Solución:** 
- Espera 2-3 segundos (debería aparecer loading)
- Recarga la página
- Verifica que tu usuario tenga empresas asignadas
- Verifica que esas empresas tengan sucursales

### "No aparecen empleados en Registrar Asistencia"
**Causa:** No hay empleados con estado "activo" en esa sucursal
**Solución:**
- Ve a Empleados
- Verifica que la sucursal sea la misma
- Verifica que los empleados estén en estado "Activo"

### "Error: The query requires an index"
**Causa:** Falta crear índice en Firebase
**Solución:**
- Haz clic en el enlace del error
- O crea manualmente en Firebase Console

### "No se actualizan los datos del dashboard"
**Causa:** Dashboard cacheado o sucursal diferente
**Solución:**
- Cambia de sucursal y vuelve a la anterior
- Recarga la página (Ctrl+R)
- Verifica que seleccionaste la sucursal correcta

---

## ✅ Checklist de Funcionalidad

Marca cuando pruebes cada funcionalidad:

**Empleados:**
- [ ] Crear empleado
- [ ] Editar empleado
- [ ] Eliminar empleado
- [ ] Buscar por nombre
- [ ] Filtrar por cargo
- [ ] Filtrar por tipo
- [ ] Cambiar de sucursal

**Capacitaciones:**
- [ ] Crear capacitación
- [ ] Registrar asistencia
- [ ] Marcar completada
- [ ] Duplicar capacitación
- [ ] Filtrar por tipo
- [ ] Filtrar por estado
- [ ] Agregar empleado a capacitación existente

**Accidentes:**
- [ ] Registrar accidente
- [ ] Registrar incidente
- [ ] Seleccionar empleado
- [ ] Filtrar por gravedad
- [ ] Cambiar estado a cerrado

**Dashboard:**
- [ ] Selector de sucursales funciona
- [ ] Datos de empleados son correctos
- [ ] Datos de capacitaciones son correctos
- [ ] Datos de accidentes son correctos
- [ ] Gráficos muestran datos reales
- [ ] Al cambiar sucursal, datos se actualizan

---

## 🎉 Sistema Funcionando Correctamente Si:

✅ Puedes crear empleados, capacitaciones y accidentes
✅ El dashboard muestra los números correctos
✅ El selector de sucursales funciona
✅ Los empleados nuevos aparecen en capacitaciones
✅ Puedes duplicar capacitaciones completadas
✅ No hay errores en la consola (excepto los de índices al inicio)

---

## 📝 Notas Finales

- **Service Worker:** Está deshabilitado temporalmente para evitar problemas de cache
- **Índices:** Pueden tardar 2-5 minutos en crearse
- **Datos:** Todo es real, nada está hardcoded
- **Escalabilidad:** Funciona con cualquier cantidad de empleados/capacitaciones

**¡El sistema está listo para producción!** 🚀

