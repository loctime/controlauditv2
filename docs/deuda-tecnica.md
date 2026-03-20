# Deuda Técnica

Problemas identificados durante la auditoría de código (marzo 2026). Ordenados por impacto.

---

## 1. URL de ControlFile hardcodeada en múltiples archivos

**Impacto: Alto**

La URL base `https://files.controldoc.app` está hardcodeada en 4 archivos distintos además de `imageUtils.js`:
- `src/components/pages/auditoria/reporte/utils/normalizadores.js` — 4 ocurrencias
- `src/utils/capacitacionFileUtils.js` — 2 ocurrencias
- `src/components/pages/auditoria/reporte/utils/pdfStorageService.js` — 1 ocurrencia

Si la URL de ControlFile cambia, hay que buscar y editar manualmente en todos estos archivos. La solución correcta es una constante central en `imageUtils.js` que todos importen.

---

## 2. Frontend de Superdev no usa el endpoint de impersonación

**Impacto: Alto**

El backend tiene un endpoint completo y seguro (`POST /api/superdev/impersonate`) que genera custom tokens reales. El frontend (`SuperdevSelector.jsx`) ignora ese endpoint y usa una lista estática de 2 usuarios hardcodeados.

Si se necesita un segundo superdev, o si cambian los owners de prueba, el código tiene que editarse manualmente. Solución: conectar el selector al endpoint `GET /api/superdev/list-owners` y usar `signInWithCustomToken` al seleccionar.

---

## 3. UID del superdev hardcodeado en AuthContext

**Impacto: Alto**

El UID `rixIn0BwiVPHB4SgR0K0SlnpSLC2` aparece hardcodeado en 3 lugares de `AuthContext.jsx` para controlar la funcionalidad de impersonación. Si hay un segundo superdev, el sistema no funciona sin modificar el código.

Solución: verificar el claim `superdev === true` del token en lugar de comparar el UID explícito.

---

## 4. Validación de vigencias en el Catálogo de Capacitaciones

**Impacto: Medio**

El campo `vigencia (meses)` en el modal "Agregar al plan" del Catálogo acepta cualquier número ≥ 1. Vigencias que no dividen exactamente 12 (como 5, 7 u 8) generan planes con meses inconsistentes.

Solo deberían ser válidos: 1, 2, 3, 4, 6 y 12. El input necesita un `select` o validación que rechace otros valores antes de confirmar.

---

## 5. Archivo `EmployeeTrainingHistoryScreen.jsx` es código muerto

**Impacto: Bajo**

El componente existe en disco pero no está registrado en ningún tab del módulo de Capacitaciones. La URL `?tab=history` redirige a `?tab=people`. La funcionalidad fue absorbida en subtabs dentro de `PeopleScreen`.

Acción: eliminar el archivo para evitar confusión futura.

---

## 6. Archivo `AccidenteDetailPanel.old.jsx` es código muerto

**Impacto: Bajo**

El panel de detalle de accidentes tiene una versión activa (`AccidenteDetailPanelV2.jsx`) y una versión anterior con sufijo `.old.jsx` que ya no se usa.

Acción: eliminar el archivo.

---

## 7. Reportes no generan PDF binario real

**Impacto: Medio**

El sistema genera HTML como Blob y lo abre para imprimir desde el navegador. No hay un archivo `.pdf` descargable. Esto limita casos de uso como enviar reportes por email o almacenarlos en ControlFile automáticamente.

Si se necesita PDF real en el futuro, requiere implementar `jsPDF`, `Puppeteer` server-side, o similar.

---

## 8. Tab `dashboard` del módulo Capacitaciones no es navegable

**Impacto: Bajo**

`DashboardScreen.jsx` existe con KPIs relevantes (% cumplimiento, sesiones de la semana, vencimientos próximos) pero no está registrado en los tabs activos del módulo. Solo se renderiza como fallback.

Acción: registrarlo como tab o eliminarlo si ya no se quiere exponer.

---

## 9. Límites de PWA offline no visibles en la UI

**Impacto: Bajo**

El sistema tiene límites duros de 20 auditorías pendientes de sync y 3GB de cuota de storage. El usuario no recibe ningún aviso antes de alcanzar esos límites, lo que puede causar pérdida silenciosa de datos.

Acción: agregar alertas o indicadores de uso en el tablero.

---

## 10. Chips de estado en Galería de Formularios no implementados

**Impacto: Bajo**

La lógica para determinar si un formulario es "propio", "ya copiado" o "público" existe en el código (`esPropio`, `yaCopiado`) pero no se renderiza como chips visuales en la UI. El usuario no tiene forma visual de distinguir estos estados en la galería.

Acción: agregar chips de estado en el accordion de cada formulario.
