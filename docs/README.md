# Documentación ControlAudit v2

Documentación técnica generada a partir de auditoría de código (marzo 2026).
Todo lo que está aquí refleja el comportamiento **real del código actual**, no intenciones ni diseños previos.

---

## Infraestructura

Fundamentos del sistema sobre los que corren todos los módulos.

| Archivo | Qué cubre |
|---|---|
| [infraestructura/multi-tenant.md](infraestructura/multi-tenant.md) | Modelo de datos owner-centric, reglas Firestore, jerarquía de roles |
| [infraestructura/iam-autenticacion.md](infraestructura/iam-autenticacion.md) | Firebase Auth, custom claims, asignación de roles, ControlFile como IAM |
| [infraestructura/sistema-permisos.md](infraestructura/sistema-permisos.md) | Hook `usePermiso`, componente `<Permiso />`, lista de permisos disponibles |
| [infraestructura/pwa-offline.md](infraestructura/pwa-offline.md) | Service worker, IndexedDB, cola de sincronización con reintentos |
| [infraestructura/controlfile-archivos.md](infraestructura/controlfile-archivos.md) | Storage vía ControlFile, shareToken, conversión a base64 para PDF |

---

## Módulos

| Archivo | Ruta | Qué hace |
|---|---|---|
| [modulos/auditorias.md](modulos/auditorias.md) | `/auditoria` | Crear y completar auditorías con autoguardado offline |
| [modulos/galeria-formularios.md](modulos/galeria-formularios.md) | `/formulario` | Biblioteca pública de formularios con rating y copia |
| [modulos/reportes-pdf.md](modulos/reportes-pdf.md) | `/reporte` | Generación de reportes como HTML imprimible |
| [modulos/empresas-sucursales.md](modulos/empresas-sucursales.md) | `/establecimiento` | CRUD de empresas y sucursales con tabla expandible |
| [modulos/empleados.md](modulos/empleados.md) | `/empleados` | Nómina por sucursal con filtros y búsqueda |
| [modulos/capacitaciones.md](modulos/capacitaciones.md) | `/training` | Sesiones, planes anuales, cumplimiento por empleado |
| [modulos/accidentes-incidentes.md](modulos/accidentes-incidentes.md) | `/accidentes` | Registro de accidentes con días de reposo y cierre automático |
| [modulos/dashboard-hse.md](modulos/dashboard-hse.md) | `/dashboard-seguridad` | Índices IF, IG, IA calculados sobre datos reales |
| [modulos/dashboard-clientes.md](modulos/dashboard-clientes.md) | `/tablero` | Control operativo diario: tareas, alertas, metas |
| [modulos/agendamiento.md](modulos/agendamiento.md) | `/panel` | Calendario de auditorías agendadas con CRUD |
| [modulos/superdev.md](modulos/superdev.md) | — | Impersonación de owners para debugging |

---

## Deuda técnica

[deuda-tecnica.md](deuda-tecnica.md) — 10 problemas identificados durante la auditoría, ordenados por impacto.

---

## Documentación anterior

[legacy/](legacy/) — archivos de la documentación previa, sin eliminar por si se necesitan como referencia. No reflejan el estado actual del sistema.

---

## Notas sobre la arquitectura general

- **Stack**: React 18 + Firebase 10 + Express (backend separado) + Vite + PWA
- **Datos**: Firestore bajo `apps/auditoria/owners/{ownerId}/`
- **Storage**: Backblaze B2 vía ControlFile (nunca acceso directo)
- **Deploy**: Vercel (frontend) + backend independiente
- **Roles**: `superdev` → `admin` (owner) → `operario`
- **Dos dashboards distintos**: `/tablero` (operativo) y `/panel` (agenda + calendario)
- **Reportes**: HTML imprimible, no PDF binario
