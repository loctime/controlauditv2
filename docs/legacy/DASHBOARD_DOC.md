🧠 ControlAudit — Dashboard v1

Propósito: control operativo diario
Usuario: admin (cliente administrador)
Pregunta que responde:

¿Qué tengo que hacer hoy y dónde tengo problemas ahora?

1️⃣ Qué NO es este dashboard (muy importante)

Este dashboard NO:

❌ analiza históricos

❌ muestra gráficos complejos

❌ reemplaza reportes

❌ configura el sistema

❌ usa el calendario legacy

Eso va a:
👉 “Análisis y Reportes” (Dash v2)

2️⃣ Estructura general (layout)

Orden vertical, de arriba hacia abajo, por urgencia:

[ Alertas Críticas ]
[ Qué tengo que hacer hoy ]
[ Qué está trabado ]
[ Resumen rápido ]


Nada de tabs en v1.
El usuario entra y entiende en 5 segundos.

3️⃣ Sección 1 — 🔴 Alertas críticas (PRIORIDAD ABSOLUTA)
Objetivo

Mostrar problemas reales, no informativos.

Contenido (solo si existen)

Auditorías offline pendientes de sincronizar

Auditorías en autosave (borradores)

Accidentes abiertos

Capacitaciones activas sin asistencia

Reglas

Si NO hay alertas → no se muestra la sección

Si hay → fondo destacado (rojo / ámbar)

Cada ítem con CTA directo

Ejemplos de CTA:

Continuar auditoría

Sincronizar

Cerrar accidente

Cargar asistencia

👉 Esto es el corazón del dashboard.

4️⃣ Sección 2 — 🟧 ¿Qué tengo que hacer hoy?
Criterio

Basado en hoy, no en estado histórico.

Incluye

Auditorías creadas hoy y no finalizadas

Capacitaciones activas hoy

Eventos / registros abiertos hoy

NO incluye

cosas viejas

cosas ya cerradas

análisis mensual

👉 Esto guía el día del usuario.

5️⃣ Sección 3 — 🟨 ¿Qué está trabado?
Criterio

Trabajo iniciado pero no cerrado, sin importar la fecha exacta.

Ejemplos:

Auditorías en autosave desde días anteriores

Accidentes abiertos hace X días

Capacitaciones activas sin registros

👉 Esto responde:

“¿Qué vengo pateando?”

6️⃣ Sección 4 — 🟦 Resumen rápido

Solo números chicos, nada de gráficos pesados:

Auditorías este mes

Accidentes abiertos / cerrados

Capacitaciones activas / completadas

Este bloque:

da contexto

no distrae

no reemplaza análisis

7️⃣ Acciones globales visibles

Arriba o lateral (según UI actual):

Crear auditoría

Registrar accidente

Nueva capacitación

⚠️ Solo si tiene permisos (admin).