# Auditorías

## Qué hace

Permite crear y completar auditorías sobre empresas y sucursales usando formularios personalizados. Funciona completamente offline. Incluye autoguardado automático y protección contra pérdida de datos al navegar.

## Rutas

- `/auditoria` — creación y edición de auditorías
- `/editar` — edición de auditorías existentes (gestión de formularios guardados)
- `/reporte` — visualización e impresión del reporte generado

## Flujo principal

1. El usuario selecciona empresa → sucursal → formulario
2. Completa las preguntas por sección (texto, opciones, fotos)
3. El autoguardado persiste el progreso en Firestore (`auditorias_autosave`) e IndexedDB
4. Al finalizar se genera el reporte

## Componentes clave

- `src/components/pages/auditoria/auditoria/Auditoria.jsx` — componente principal
- `src/components/pages/auditoria/auditoria/services/autoSaveService.js` — autoguardado (~42KB, lógica completa offline/online)
- `src/components/pages/auditoria/auditoria/hooks/useNavigationGuard.js` — bloquea navegación con cambios sin guardar (intercepta `beforeunload` y `popstate`)
- `src/components/pages/auditoria/auditoria/components/AutoSaveAlert.jsx` — indicador visual de estado de guardado
- `src/components/pages/auditoria/auditoria/components/ExitConfirmation.jsx` — diálogo de confirmación al salir
- `src/components/pages/auditoria/auditoriaService.jsx` — operaciones Firestore

## Notas importantes

- El autoguardado detecta cambios en: respuestas, comentarios, imágenes, empresa, sucursal y formulario seleccionado.
- El **agendamiento de auditorías** (calendario) no es parte de este módulo. Vive en `/panel` (ver `docs/modulos/agendamiento.md`).
- No existe un sistema de "agendar desde /auditoria". El campo `fechaVencimiento` que existe en algunas preguntas es para acciones correctivas, no para programar auditorías.
