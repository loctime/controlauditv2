# IAM / Autenticación

## Qué hace

Gestiona identidad, roles y acceso mediante Firebase Auth. ControlFile actúa como capa IAM central para todo el ecosistema Control*: crea usuarios en Firebase Auth y setea los custom claims. El frontend nunca llama directamente a ControlFile para autenticación.

## Cómo funciona

### Flujo de autenticación

1. El usuario inicia sesión con email/password en Firebase Auth
2. Firebase devuelve un token JWT con custom claims
3. `AuthContext.jsx` lee el token y extrae `role`, `ownerId`, `appId`
4. El token se usa para validar acceso en reglas de Firestore y endpoints del backend

### Custom claims

Estructura del token para cada rol:

```js
// Admin (owner)
{ appId: 'auditoria', role: 'admin', ownerId: uid }

// Operario
{ appId: 'auditoria', role: 'operario', ownerId: uid_del_admin }

// Superdev
{ appId: 'auditoria', role: 'superdev', superdev: true, ownerId: uid }
```

### Asignación de roles

El backend (`backend/index.js`) expone `POST /api/set-role`. Solo un admin puede llamarlo, y solo para asignar roles dentro de su propio ownerId:

```js
// Validación del endpoint:
if (decodedToken.role !== 'admin' || decodedToken.ownerId !== decodedToken.uid) {
  return res.status(403).json({ error: 'Solo admin puede asignar roles' });
}
await admin.auth().setCustomUserClaims(targetUid, { appId, role, ownerId });
```

### Normalización de roles legacy

`src/utils/accessControl.js` maneja nombres de roles viejos para compatibilidad:

```js
const LEGACY_ROLE_MAP = {
  max: 'admin',
  supermax: 'superdev',
  superAdmin: 'superdev',
};
```

## Archivos clave

- `src/components/context/AuthContext.jsx` — contexto principal, lee claims del token
- `backend/index.js` — endpoint `POST /api/set-role`
- `backend/firebaseAdmin.js` — inicialización del SDK Admin
- `src/utils/accessControl.js` — lógica de roles y normalización
- `src/router/RouteGuard.jsx` — protección de rutas por rol
- `src/firebaseControlFile.js` — config de Firebase (compartida con ControlFile)

## Notas importantes

- El endpoint `/api/admin/create-user` que describe documentación legacy **no existe**. La creación de usuarios se gestiona vía ControlFile directamente o por consola de Firebase.
- El frontend usa el mismo proyecto de Firebase que ControlFile (auth compartida). Los datos de la app van al Firestore de ControlAudit.
- `superdev` siempre tiene acceso total: `if (role === 'superdev') return true` en `accessControl.js`.
