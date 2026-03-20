# Sistema de Permisos

## Qué hace

Controla qué acciones puede hacer cada operario dentro del sistema. Los admins tienen todos los permisos por defecto. Los operarios tienen permisos deshabilitados por defecto, y el admin puede habilitarlos individualmente.

## Cómo funciona

Los permisos se almacenan en Firestore junto al perfil del usuario y se leen al cargar la sesión. En el código se accede a ellos mediante un hook o un componente guard.

### Permisos disponibles

```js
// src/components/pages/admin/hooks/usePermissions.js
{
  puedeCrearEmpresas: false,
  puedeCrearSucursales: false,
  puedeCrearAuditorias: false,
  puedeAgendarAuditorias: false,
  puedeCompartirFormularios: false,
  puedeAgregarUsuarios: false,
  puedeEliminarAuditoria: false
}
```

Los admins tienen todos en `true` por defecto. Los superdev siempre tienen acceso total, sin importar los permisos.

### Hook de uso

```jsx
// Verificar un permiso en lógica
const tienePermiso = usePermiso('puedeCompartirFormularios');
if (!tienePermiso) return;
```

### Componente guard

```jsx
// Proteger elementos de UI
<Permiso permiso="puedeCrearEmpresas">
  <Button>Nueva empresa</Button>
</Permiso>
```

El componente simplemente no renderiza sus hijos si el usuario no tiene el permiso.

## Archivos clave

- `src/components/hooks/usePermiso.js` — hook para verificar un permiso
- `src/components/common/Permiso.jsx` — componente guard de UI
- `src/components/pages/admin/hooks/usePermissions.js` — lógica y defaults
- `src/config/admin.js` — defaults de roles

## Notas importantes

- El permiso `puedeCompartirAuditorias` fue eliminado y reemplazado por `puedeCompartirFormularios`. No existe en ningún lugar del código actual.
- El superdev bypasea todos los permisos: `return permissions[key] || role === 'superdev'`.
- Los permisos son por operario, no por empresa ni sucursal. No hay permisos granulares por entidad.
