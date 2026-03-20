# Multi-Tenant

## Qué hace

Aísla completamente los datos de cada cliente (owner) dentro de Firestore. Cada admin es un "owner" y todos sus datos viven bajo su propio nodo. Los operarios acceden a los datos de su owner vía custom claims.

## Cómo funciona

Toda la información de la app vive bajo esta ruta en Firestore:

```
apps/auditoria/owners/{ownerId}/
├── usuarios/
├── empresas/
├── sucursales/
├── formularios/
├── reportes/
├── empleados/
├── accidentes/
├── auditorias_agendadas/
└── configuracion/
```

El acceso está controlado por las reglas de Firestore (`rules/audit.rules`):

```js
match /apps/auditoria/owners/{ownerId}/{document=**} {
  allow read, write: if isAuth()
    && (
      uid() == ownerId ||                          // el admin accede a sus propios datos
      request.auth.token.ownerId == ownerId        // el operario accede vía custom claim
    );
}
```

### Roles

- **admin**: su `ownerId` es su propio `uid`. Crea y gestiona todo.
- **operario**: su `ownerId` viene del custom claim `ownerId` seteado en Firebase Auth cuando fue creado.
- **superdev**: acceso total a cualquier owner (ver `docs/modulos/superdev.md`).

### Resolución del ownerId activo

`AuthContext.jsx` expone `getEffectiveOwnerId()` que resuelve:
1. Si es superdev con un owner seleccionado → devuelve el owner impersonado
2. Si es admin → devuelve `user.uid`
3. Si es operario → devuelve `token.ownerId` del custom claim

## Archivos clave

- `rules/audit.rules` — reglas de seguridad Firestore
- `rules/base.rules` — helpers (`isAuth`, `uid`, `ownerIs`)
- `src/components/context/AuthContext.jsx` — resolución del ownerId activo
- `src/core/firestore/firestoreRoutes.core.ts` — definición centralizada de rutas

## Notas importantes

- No existe modelo "legacy". No hay colecciones fuera de `apps/auditoria/owners/{ownerId}/`.
- `AuthContext.jsx` tiene un UID hardcodeado para el feature de impersonación del superdev. Es código de debug, no afecta producción pero debería limpiarse.
- La jerarquía es: superdev → admin (owner) → operarios del owner.
