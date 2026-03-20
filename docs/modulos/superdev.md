# Superdev / Impersonación

## Qué hace

Permite al superdev ver el sistema como si fuera cualquier admin (owner), sin cambiar la sesión real ni modificar datos del usuario. Útil para debugging y soporte.

## Cómo funciona actualmente

La implementación tiene **dos partes desconectadas**: el backend está completo y seguro; el frontend es un stub estático que no lo usa.

### Backend (completo)

`backend/index.js` expone dos endpoints protegidos por el middleware `verificarSuperdev`:

**`GET /api/superdev/list-owners`**
Devuelve todos los owners válidos con cross-validación Firestore + Firebase Auth.

**`POST /api/superdev/impersonate`**
Flujo:
1. Valida que `ownerId` exista en Firestore con datos correctos (`role: admin`, `appId: auditoria`)
2. Valida que el usuario exista en Firebase Auth
3. Genera un custom token via Firebase Admin SDK con claims: `{ appId: 'auditoria', role: 'admin', ownerId: targetOwnerId }`
4. Devuelve `{ customToken }`

El middleware `verificarSuperdev` hace doble validación: `role === 'superdev'` **y** `superdev === true` en claims.

### Frontend (stub estático)

`src/components/common/SuperdevSelector.jsx` tiene una lista hardcodeada de 2 usuarios con UIDs fijos. Al seleccionar uno, llama `setSelectedOwnerId()` en el contexto — **sin llamar al endpoint ni generar ningún token**.

La "impersonación" real se resuelve en `AuthContext.jsx` vía `getEffectiveOwnerId()`:
```js
// Solo funciona para el UID hardcodeado del superdev actual
if (user?.uid === 'rixIn0BwiVPHB4SgR0K0SlnpSLC2' && selectedOwnerId) {
  return selectedOwnerId;
}
```

El estado persiste en localStorage mientras la sesión está activa. No hay mecanismo de "salir de la impersonación" — el superdev selecciona su propio UID para volver.

## Archivos clave

- `backend/index.js` (líneas ~509–762) — middleware `verificarSuperdev` + endpoints
- `src/components/common/SuperdevSelector.jsx` — selector de owner (stub estático)
- `src/components/context/AuthContext.jsx` — `getEffectiveOwnerId()` + persistencia en localStorage
- `src/components/layout/navbar/Navbar.jsx` — muestra el owner activo en la barra superior
- `src/utils/accessControl.js` — superdev bypasea todos los permisos

## Notas importantes

- El endpoint backend está listo para usarse. El frontend necesita reescribirse para consumirlo dinámicamente.
- El UID del superdev está hardcodeado en 3 lugares de `AuthContext.jsx`. Si hay un segundo superdev, el sistema no funciona sin tocar código.
- La documentación legacy referenciaba `app/api/superdev/impersonate/route.ts` (Next.js) — **ese archivo no existe**. El backend es Express en `backend/index.js`.
- Ver `docs/deuda-tecnica.md` para el detalle de esta deuda.
