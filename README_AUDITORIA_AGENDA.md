# Integración Auditoría-Agenda

## Objetivo

Permitir que al hacer clic en "Completar" desde el calendario, el usuario sea dirigido al flujo de auditoría con los datos pre-cargados (empresa, sucursal, formulario, fecha), y que los pasos 1 y 2 estén bloqueados para edición salvo confirmación explícita. Al finalizar, la auditoría se marca como "completada" en Firestore, tanto si viene de la agenda como si se detecta una coincidencia.

---

## Flujo de usuario

1. **Desde el calendario:**  
   - El usuario hace clic en "Completar".
   - Se navega a `/auditoria` con los datos de la agenda.
   - Los pasos 1 y 2 están bloqueados.
   - Si el usuario intenta editar, se muestra una advertencia y puede desbloquear para editar manualmente.
   - Al finalizar, la auditoría agendada se marca como "completada" en Firestore.

2. **Desde el flujo normal:**  
   - El usuario inicia una auditoría nueva.
   - Si al finalizar existe una auditoría agendada para los mismos datos y fecha, se marca como "completada".

---

## Logs y feedback

- Todas las acciones clave (desbloqueo, cambios, errores, actualización de estado) se registran en consola y se notifican al usuario con Snackbar.
- Los logs siguen el prefijo `[AUDITORIA]` para fácil filtrado.

---

## Integración

- **`AuditoriasDelDia.jsx`:**  
  El botón "Completar" navega a `/auditoria` pasando los datos de la agenda.

- **`Auditoria.jsx`:**  
  - Detecta si viene de la agenda (`auditoriaId` en `location.state`).
  - Bloquea los pasos 1 y 2, permitiendo desbloqueo con advertencia.
  - Al finalizar, actualiza el estado en Firestore.
  - Usa logs y Snackbar para feedback.

---

## Consideraciones

- Si el usuario desbloquea los pasos, puede editar los datos, pero se registra el cambio.
- Si hay errores al actualizar Firestore, se notifica al usuario.
- El sistema es extensible para otros flujos similares.

---

## Ejemplo de log

```
[AUDITORIA] Auditoría agendada (ID: 123abc) marcada como completada.
[AUDITORIA] El usuario desbloqueó los datos de agenda para edición manual.
[AUDITORIA] Error al marcar auditoría como completada: [Error]
```

---

## Mantenimiento

- Revisar que los IDs y campos de Firestore coincidan con el modelo de datos.
- Mantener los logs y feedback para trazabilidad.
- Validar que los datos pasados por navegación sean correctos.

---

## Contacto

Para dudas o mejoras, contactar al equipo de frontend. 