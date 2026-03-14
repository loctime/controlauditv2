# Guía de Usuario - Módulo de Capacitación (/training)

**Versión auditada frente al código** — Esta guía refleja el comportamiento real del módulo de capacitaciones en ControlAudit (ruta `/training`).

Pensada para: responsables de Higiene y Seguridad, supervisores y auditores.

---

## 1. Estructura real del módulo (pestañas)

Las pestañas visibles en el módulo son:

| Pestaña | Descripción |
|--------|-------------|
| **Tablero** | Indicadores de cumplimiento, sesiones de la semana, pendientes de cierre, alertas (vencimientos 30/60/90 días, sesiones sin evidencia). Accesos rápidos: Nueva sesión, Ver vencimientos, Ver calendario, Ver empleados. El **calendario** se muestra dentro del Tablero al hacer clic en "Ver calendario" (no es una pestaña independiente). |
| **Sesiones** | Crear sesiones, listar sesiones, ejecutar sesión (asistencia, evaluación, firmas), cargar evidencias y cerrar sesión. |
| **Personas** | Consulta de historial de capacitación por empleado (autocompletar). Estados: vigente, por vencer, vencido. |
| **Historial** | Historial de capacitaciones por empleado (tabla por empleado seleccionado, con sesiones y estados de vigencia). |
| **Reportes** | Vistas consolidadas: sesiones por estado, cumplimiento por sucursal, certificados por vencer (próximos 90 días). Filtro por sucursal. |
| **Cumplimiento** | Matriz de cumplimiento, faltantes por puesto/rol, cumplimiento por riesgo, panel de exportación para auditoría. |
| **Configuración** *(solo admin/superdev)* | **Catálogo de capacitación** y **Planes anuales**. Filtros junto a las pestañas en Planes anuales. |

**Diferencias con la guía anterior:**

- **Calendario**: no es una pestaña propia; está integrado en el Tablero (botón "Ver calendario").
- **Certificados**: la pantalla de emisión/consulta/revocación de certificados existe en el código (`CertificatesScreen`) pero **no tiene pestaña ni ruta en el módulo**. No es accesible desde el menú actual. Ver sección 7 (mejoras sugeridas).
- **Matriz de requerimientos**: el código incluye `RequirementMatrixScreen` y `RequirementMatrixScreenAdapter`, pero **no están enlazados en Configuración**. En la UI de Configuración solo aparecen "Catálogo de capacitación" y "Planes anuales". Para que la matriz sea usable hay que añadirla como pestaña en `ConfigurationHub`.

---

## 2. Flujo administrador (configuración y supervisión)

Orden recomendado según el código:

1. **Catálogo** (Configuración > Catálogo de capacitación)  
   Crear y mantener tipos de capacitación: nombre, categorías, modalidad (presencial/virtual/híbrida), duración, vigencia en meses, descripción, estado (activo/inactivo). Opción "Agregar a plan anual" y "Ver en planes anuales" por tipo.

2. **Planes anuales** (Configuración > Planes anuales)  
   Crear planes por empresa/sucursal/año; asociar ítems (tipo de capacitación, mes planificado). Ver detalle en sidebar (Detalle / Editar / Ítems). Navegar a la página completa de ítems del plan (`/training/plans/:planId`) para calendario, listado y cumplimiento.

3. **Sesiones**  
   Crear sesión (paso 1: tipo, empresa, sucursal, fecha, instructor, modalidad, ubicación; paso 2: participantes manual, por puesto/sector o sugeridos por cumplimiento). Las sesiones pueden ser *ad hoc* o vinculadas a un ítem de plan anual.

4. **Supervisión**  
   En Sesiones: abrir sesión, revisar asistencia, evaluación, firmas y evidencias. Usar "Validar criterios de cierre" antes de cerrar. Cerrar solo cuando el sistema permita (validaciones en backend).

5. **Certificados**  
   La lógica de emisión/revocación está en el código; la pantalla de certificados no está enlazada en el menú (ver sección 7).

6. **Indicadores**  
   Tablero, Reportes y Cumplimiento para monitorear estado y tomar acciones correctivas.

---

## 3. Flujo operativo (ejecución de sesiones)

1. Ir a **Sesiones** y seleccionar la sesión en la lista (o crearla si aplica).

2. **Participantes y ejecución**  
   Por cada participante registrar:
   - **Asistencia**: Presente, Ausencia justificada, Ausencia injustificada, Reprogramado.
   - **Evaluación** (si el tipo de capacitación tiene `requiresEvaluation`): Aprobado, Desaprobado, Pendiente, No aplica.
   - **Firma empleado (ref)** y **Firma instructor (ref)**: texto de referencia (ej. URL o identificador de archivo).

3. **Evidencias**  
   Tipo: Foto, Planilla firmada, Firma digital, Archivo de evaluación, Documento. Campos: referencia de archivo (obligatoria) y notas. Botón "Cargar evidencia".

4. **Cierre**  
   - Opción "Validar criterios de cierre": el sistema indica si se puede cerrar o qué falta.
   - Transiciones de estado: Borrador → Programada → En progreso → Pendiente de cierre → Cerrada (o Cancelada en cualquier momento).  
   - **Cerrar sesión** solo está habilitado si se cumplen las validaciones (ver sección 4). Al cerrar, el sistema materializa los registros históricos de los empleados.

5. Consultar **Personas** o **Historial** para seguimiento de vigencias por empleado.

---

## 4. Validaciones automáticas (código)

### 4.1 Criterios para cerrar sesión

El sistema **no permite** cerrar la sesión hasta que se cumpla todo lo siguiente (`trainingSessionService.validateClosureGates`):

- **Asistencia capturada**: existe al menos un registro de asistencia para la sesión.
- **Firmas** (si el tipo de capacitación tiene `requiresSignature`): todos los registros de asistencia deben tener `employeeSignature` e `instructorSignature` (no vacíos).
- **Evaluación** (si el tipo tiene `requiresEvaluation`): ningún registro puede tener `evaluationStatus` vacío o `pending`.
- **Certificados** (si el tipo tiene `requiresCertificate`): todo participante con asistencia "present" y evaluación "approved" debe tener `certificateId` asignado.

**Importante:** Las **evidencias** (panel Evidencias) **no** forman parte de la validación de cierre. Cargar evidencias es buena práctica pero el backend no las exige para cerrar.

### 4.2 Estados de sesión y transiciones

- `draft` → `scheduled` | `cancelled`
- `scheduled` → `in_progress` | `cancelled`
- `in_progress` → `pending_closure` | `cancelled`
- `pending_closure` → `closed` | `in_progress`
- `closed` y `cancelled`: sin transiciones.

Al pasar a **Cerrada**, se llama a `materializeEmployeeRecord`: se actualizan los registros de asistencia y se recomputan los registros de cumplimiento por empleado (`employee_training_record`).

### 4.3 Emisión de certificados

- Creación: se puede hacer con `sessionId` + `employeeId` (y tipo de capacitación, fechas, referencia de archivo, etc.). El servicio vincula el certificado al registro de asistencia y actualiza vigencia en el historial del empleado.
- Revocación: el certificado pasa a estado "revocado" y se desvincula del empleado en asistencia/historial.

### 4.4 Roles

- **Configuración** (Catálogo y Planes anuales): solo visible para `role === 'admin'` o `role === 'superdev'` (`TrainingModule.jsx`).
- Resto de pestañas: accesibles para operario, admin y superdev (según `routesConfig`).

---

## 5. Flujo auditor (consulta y evidencias)

1. **Cumplimiento**  
   Matriz de cumplimiento, faltantes por rol, cumplimiento por riesgo. Panel de exportación para auditoría.

2. **Reportes**  
   Sesiones por estado, cumplimiento por sucursal, cantidad de certificados por vencer (90 días).

3. **Personas / Historial**  
   Ver por empleado el historial de capacitaciones y estados de vigencia (vigente, por vencer, vencido).

4. **Evidencias**  
   Por sesión, en la pantalla Sesiones: panel "Evidencias" con tipo y referencia de archivo (la carga es por referencia, no subida directa en esta guía).

---

## 6. Paso a paso según el sistema real

### A) Configurar el sistema

1. Ir a **Configuración** (solo admin/superdev).
2. **Catálogo de capacitación**: crear tipos con modalidad, vigencia, requisitos (evaluación, firma, certificado según catálogo).
3. **Planes anuales**: crear plan por empresa/sucursal/año y cargar ítems (tipo + mes). Los filtros (buscar, empresa, sucursal, año, estado) están junto a las pestañas Catálogo / Planes anuales.
4. **Matriz de requerimientos**: implementada en código pero no accesible desde Configuración; ver sección 7.

### B) Crear sesiones

1. **Sesiones** > sección "1. Crear nueva sesión".
2. Paso 1: tipo de capacitación, empresa, sucursal, fecha, instructor, modalidad, ubicación. Opción de vincular a plan anual (origen plan/ad hoc).
3. Paso 2: participantes (manual, filtro por puesto/sector, o sugeridos por cumplimiento).
4. Crear sesión. La sesión aparece en "2. Lista de sesiones".

### C) Registrar asistencia y evaluación

1. En **Sesiones**, seleccionar la sesión en la lista.
2. En "Participantes y ejecución" editar por persona: asistencia, evaluación (si aplica), referencia de firma empleado e instructor. Guardar por fila (actualización automática al cambiar).

### D) Cargar evidencia y firmas

1. **Evidencias**: elegir tipo, completar "Referencia de archivo" (obligatoria) y notas. "Cargar evidencia".
2. Las firmas se registran en "Participantes y ejecución" (campos Firma empleado ref / Firma instructor ref).

### E) Cerrar sesión

1. Panel "Cierre de sesión".
2. "Validar criterios de cierre": el sistema indica si puede cerrarse o qué falta (asistencia, firmas, evaluación, certificados según catálogo).
3. Si hay pendientes, completar en participantes/evidencias/certificados.
4. "Cerrar sesión" (solo habilitado si las validaciones pasan). El sistema materializa el historial de empleados.

### F) Certificados

- La pantalla de certificados (emisión, número, empleado, capacitación, sesión, fechas, referencia, ver/descargar/revocar) **existe en el código pero no está enlazada** en el módulo. Para usarla hace falta añadir una ruta/pestaña (ver sección 7).

### G) Cumplimiento por empleado

1. **Personas**: autocompletar empleado, revisar historial (vigente, por vencer, vencido).
2. **Historial**: seleccionar empleado y ver tabla de asistencia/cumplimiento por tipo.
3. Tablero y Reportes para priorizar acciones (vencimientos 30/60/90 días).

---

## 7. Discrepancias, UX y mejoras sugeridas

### Pasos en la guía que no existen o no son accesibles

- **Certificados**: la pestaña "Certificados" no existe; la pantalla `CertificatesScreen` no está en el router ni en las pestañas del módulo.
- **Matriz de requerimientos**: no aparece en la configuración; el componente existe pero no está enlazado en `ConfigurationHub`.

### Pasos en el código no reflejados en la guía anterior

- Transiciones explícitas: "Iniciar sesión" (→ en progreso), "Pendiente de cierre" (→ pendiente de cierre).
- La evidencia **no** se valida en el cierre; solo asistencia, firmas (si aplica), evaluación (si aplica) y certificados (si aplica).
- Calendario dentro del Tablero (no como pestaña).
- Pestañas reales: Historial y Cumplimiento (además de Tablero, Sesiones, Personas, Reportes, Configuración).

### Posibles errores de UX

- Certificados no accesibles desde el módulo.
- Matriz de requerimientos no accesible desde Configuración.
- Evidencias: solo referencia de archivo (texto), no subida de archivo en la UI auditada; puede generar confusión si se espera adjuntar archivos.

### Mejoras sugeridas

1. **Certificados**: añadir pestaña "Certificados" en el módulo de capacitaciones (o ruta `/training/certificates`) y enlazar `CertificatesScreen`.
2. **Matriz de requerimientos**: añadir en `ConfigurationHub` la pestaña "Matriz de requerimientos" y renderizar `RequirementMatrixScreenAdapter` cuando corresponda.
3. **Cierre**: en el panel de cierre, mostrar de forma explícita los criterios que fallan (lista de razones que ya devuelve `validateClosureGates`).
4. **Evidencias**: si se desea que las evidencias sean obligatorias para cerrar, añadir la validación en `validateClosureGates` (por ejemplo exigir al menos un ítem de evidencia por sesión cuando el tipo lo requiera).

### Validaciones faltantes (opcional)

- Comprobar que la sesión tenga al menos un participante "present" antes de cerrar (el código exige "attendance captured" pero no que haya al menos un presente).
- Mostrar en UI los requisitos del tipo de capacitación (requiresSignature, requiresEvaluation, requiresCertificate) en el panel de cierre para que el usuario sepa qué debe completar.

---

## 8. Resumen de responsabilidades por rol

| Rol | Configuración | Sesiones (crear/ejecutar/cerrar) | Personas / Historial | Reportes / Cumplimiento |
|-----|----------------|----------------------------------|-----------------------|--------------------------|
| **operario** | No | Sí | Sí (consulta) | Sí (consulta) |
| **admin** | Sí (Catálogo, Planes) | Sí | Sí | Sí |
| **superdev** | Sí | Sí | Sí | Sí |

La matriz de requerimientos y la pantalla de certificados, una vez enlazadas, deberían seguir el mismo criterio (Configuración/operación solo admin/superdev según corresponda; certificados típicamente admin/superdev).

---

*Documento generado por auditoría del código del módulo de capacitaciones (training). Archivos principales: TrainingModule.jsx, ConfigurationHub.jsx, SessionsScreen.jsx, SessionCreateWizard.jsx, SessionExecutionView.jsx, SessionClosurePanel.jsx, SessionEvidencePanel.jsx, trainingSessionService.js, trainingAttendanceService.js, trainingCertificateService.js, employeeTrainingRecordService.js.*
