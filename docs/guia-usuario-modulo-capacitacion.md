# Guia de Usuario - Modulo de Capacitacion (/training)

Esta guia esta pensada para responsables de Higiene y Seguridad, supervisores y auditores.

## 1) Que hace cada pestana

- **Tablero**: muestra indicadores de cumplimiento, estado operativo, alertas y accesos rapidos.
- **Sesiones**: permite crear sesiones, asignar participantes, registrar asistencia y evaluacion, cargar evidencias y cerrar sesiones.
- **Calendario**: muestra las sesiones programadas en vista mensual y detalle por dia.
- **Personas**: consulta historial de capacitacion por empleado con estados de vigencia.
- **Certificados**: emision, consulta, descarga y revocacion de certificados.
- **Configuracion** (solo admin/supermax): catalogo de capacitaciones, matriz de requerimientos y planes anuales.
- **Reportes**: vistas consolidadas de estado de sesiones, cumplimiento y certificados por vencer.

## 2) Flujo correcto para administradores

1. Cargar y mantener el **Catalogo** de capacitaciones.
2. Definir la **Matriz de requerimientos** por empresa/sucursal/puesto/sector/riesgo.
3. Cargar **Planes anuales**.
4. Crear **Sesiones** y asignar participantes sugeridos por cumplimiento.
5. Supervisar ejecucion: asistencia, evaluacion, evidencias y firmas.
6. Cerrar sesiones validando criterios de cierre.
7. Emitir o revocar certificados segun resultados.
8. Monitorear indicadores y reportes para acciones correctivas.

## 3) Flujo correcto para usuarios operativos

1. Entrar en **Sesiones** y abrir la sesion asignada.
2. Registrar asistencia por empleado.
3. Registrar evaluacion cuando aplique.
4. Cargar evidencias y referencias de firma.
5. Dejar la sesion en pendiente de cierre o cerrarla si cumple validaciones.
6. Consultar **Personas** para seguimiento de vigencias.

## 4) Paso a paso

### A) Configurar el sistema

1. Ir a **Configuracion > Catalogo de capacitacion**.
2. Crear tipos de capacitacion con modalidad, vigencia y requisitos.
3. Ir a **Configuracion > Matriz de requerimientos**.
4. Crear reglas por empresa/sucursal y contexto laboral.
5. Ir a **Configuracion > Planes anuales**.
6. Crear plan anual y sus items.

### B) Crear sesiones de capacitacion

1. Ir a **Sesiones**.
2. En **Paso 1**, completar:
   - tipo de capacitacion
   - empresa
   - sucursal
   - fecha
   - instructor
   - modalidad
   - ubicacion
3. Hacer clic en **Continuar a participantes**.
4. En **Paso 2**, seleccionar participantes:
   - seleccion manual
   - filtro por puesto/sector
   - seleccion sugerida por cumplimiento
5. Hacer clic en **Crear sesion**.

### C) Registrar asistencia

1. En **Sesiones**, abrir la sesion desde la tabla.
2. En **Ejecucion de la sesion**, cargar por persona:
   - estado de asistencia: presente, ausencia justificada, ausencia injustificada, reprogramado
   - estado de evaluacion (si aplica): aprobado, desaprobado, pendiente, no aplica
3. Guardar cambios por fila.

### D) Cargar evidencia y firmas

1. En **Evidencias**, elegir tipo de evidencia.
2. Completar referencia de archivo y notas.
3. Hacer clic en **Cargar evidencia**.
4. En ejecucion, completar referencias de firma de empleado e instructor cuando corresponda.

### E) Cerrar sesion

1. Ir al panel **Cierre de sesion**.
2. Hacer clic en **Validar criterios de cierre**.
3. Si hay pendientes, corregir asistencia/evidencia/firmas.
4. Si todo esta OK, hacer clic en **Cerrar sesion**.
5. El sistema materializa registros historicos de empleados.

### F) Emitir certificados

1. Ir a **Certificados**.
2. Completar:
   - numero de certificado
   - empleado
   - capacitacion
   - sesion
   - fechas de emision/vigencia/vencimiento
   - referencia de archivo
3. Hacer clic en **Emitir certificado**.
4. Desde la tabla, usar acciones para ver, descargar o revocar.

### G) Verificar cumplimiento por empleado

1. Ir a **Personas**.
2. Buscar y seleccionar empleado por autocompletar.
3. Revisar la linea de tiempo:
   - vigente
   - por vencer
   - vencido
   - incompleto
4. Priorizar acciones con apoyo de **Tablero** y **Reportes**.

## 5) Recomendaciones operativas

- Registrar asistencia y evidencias el mismo dia de la sesion.
- No cerrar sesiones con pendientes de firma/evaluacion.
- Revisar semanalmente vencimientos de 30/60/90 dias.
- Usar reportes por sucursal para planificar refuerzos.
