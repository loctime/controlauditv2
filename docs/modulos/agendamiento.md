# Agendamiento de Auditorías

## Qué hace

Permite programar auditorías en un calendario, asignarlas a empresas/sucursales y marcarlas como completadas. Es el panel de gestión para el admin que coordina el trabajo de auditoría.

## Ruta

- `/panel` → `ClienteDashboard.jsx`

## Cómo funciona

### Calendario

`CalendarioAuditorias.jsx` es un calendario **construido a medida en React** — no usa FullCalendar ni ninguna librería externa. Incluye:
- Navegación mes anterior / mes siguiente con dropdowns de mes y año
- Soporte de swipe táctil en móvil
- Visualización de auditorías agendadas por día

### Datos en Firestore

Colección: `apps/auditoria/owners/{ownerId}/auditorias_agendadas`

Campos de cada documento:
```
fecha: string (YYYY-MM-DD)
hora: string
estado: 'agendada' | 'completada'
empresaId: string
sucursalId: string
formularioId: string
encargado: { uid, nombre, email }
fechaCreacion: timestamp
fechaActualizacion: timestamp
```

### Operaciones disponibles

Todas en `useClienteDashboard.js`:
- `handleAgendarAuditoria()` — crea nueva agenda desde `AgendarAuditoriaDialog`
- `handleCompletarAuditoria()` — marca como completada
- `handleEliminarAuditoria()` — elimina del calendario

### Componentes del panel

- `CalendarioAuditorias.jsx` — vista de calendario
- `AgendarAuditoriaDialog.jsx` — formulario de nueva agenda
- `AuditoriasDelDia.jsx` — lista de auditorías del día seleccionado
- `ProximasAuditorias.jsx` — próximas auditorías agendadas
- `ResumenGeneral.jsx` — resumen de estadísticas

## Archivos clave

- `src/components/pages/admin/ClienteDashboard.jsx` — página principal
- `src/components/pages/admin/hooks/useClienteDashboard.js` — lógica central
- `src/components/pages/admin/components/CalendarioAuditorias.jsx` — calendario custom
- `src/components/pages/admin/components/AgendarAuditoriaDialog.jsx` — formulario de agenda

## Notas importantes

- Esta funcionalidad **no está en `/tablero`**. Está en `/panel`. Son rutas distintas con propósitos distintos.
- El calendario no soporta eventos recurrentes ni arrastrar-y-soltar. Cada auditoría se agenda manualmente.
- `auditorias_agendadas` es independiente de `auditorias` (las auditorías reales completadas). Agendar no crea una auditoría; completar una auditoría agendada tampoco la vincula automáticamente con el resultado real.
