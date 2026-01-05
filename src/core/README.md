# Core - Modelo Owner-Centric

## ¿Qué es el Core?

El **Core** es el nuevo modelo owner-centric del sistema de auditoría. Representa una arquitectura limpia y aislada del código legacy, diseñada para ser la base de todas las features futuras.

## ¿Qué problema resuelve?

El sistema legacy usa una estructura **user-centric** donde cada usuario tiene sus propias colecciones:
```
apps/auditoria/users/{userId}/empresas
apps/auditoria/users/{userId}/sucursales
...
```

Este modelo tiene limitaciones:
- No permite compartir datos entre usuarios fácilmente
- No hay un concepto claro de "propietario" o "organización"
- La asignación de empresas a usuarios es compleja
- No escala bien para organizaciones con múltiples administradores

El nuevo modelo **owner-centric** resuelve esto:
```
apps/auditoria/owners/{ownerId}/empresas
apps/auditoria/owners/{ownerId}/usuarios
```

Donde:
- El **owner** es el propietario principal (administrador raíz)
- Los **usuarios** pertenecen al owner y tienen empresas asignadas
- Las **empresas** pertenecen al owner y pueden ser asignadas a usuarios

## ¿Por qué NO se mezcla con legacy?

**Regla estricta**: El código del Core NO debe:
- Importar servicios legacy
- Usar lógica legacy (clienteAdminId, migratedFromUid, etc.)
- Hacer dual-write (escribir en ambos modelos)
- Modificar datos legacy
- Depender de componentes legacy

**Razones**:
1. **Aislamiento**: Permite desarrollar y probar el nuevo modelo sin afectar producción
2. **Claridad**: El código nuevo es limpio y sin deuda técnica
3. **Migración gradual**: Se puede migrar feature por feature cuando esté listo
4. **Rollback seguro**: Si algo falla, el legacy sigue funcionando

## Regla de desarrollo

**TODO feature nuevo va en el Core.**

Cuando necesites implementar una nueva funcionalidad:
1. Verifica si existe en el Core
2. Si no existe, créala en el Core usando el modelo owner-centric
3. NO crees features nuevas en el código legacy
4. Usa `firestoreRoutes.core.ts` como SINGLE SOURCE OF TRUTH para rutas

## Estructura

```
src/core/
 ├─ README.md                    # Este archivo
 ├─ models/                      # Tipos e interfaces TypeScript
 │   ├─ Owner.ts
 │   ├─ Empresa.ts
 │   └─ User.ts
 ├─ firestore/
 │   └─ firestoreRoutes.core.ts  # Rutas Firestore (SINGLE SOURCE OF TRUTH)
 ├─ services/                     # Lógica de negocio
 │   ├─ ownerUserService.ts       # Gestión de usuarios
 │   ├─ ownerEmpresaService.ts   # Gestión de empresas
 │   └─ ownerContextService.ts   # Resolución de contexto
 └─ permissions/                  # Sistema de permisos
     └─ empresaPermissions.ts    # Permisos de empresas
```

## Uso básico

### Crear un usuario
```typescript
import { createUser } from '@/core/services/ownerUserService';

const user = await createUser('owner-id', {
  id: 'user-id',
  role: 'operario',
  empresasAsignadas: ['empresa-1', 'empresa-2']
});
```

### Crear una empresa
```typescript
import { createEmpresa } from '@/core/services/ownerEmpresaService';

const empresa = await createEmpresa('owner-id', {
  id: 'empresa-id',
  nombre: 'Mi Empresa'
});
```

### Resolver contexto del usuario
```typescript
import { resolveUserContext } from '@/core/services/ownerContextService';
import { auth } from '@/firebaseControlFile';

const context = await resolveUserContext(auth.currentUser);
if (context) {
  console.log('Empresas permitidas:', context.empresasPermitidas);
}
```

### Verificar permisos
```typescript
import { canViewEmpresa } from '@/core/permissions/empresaPermissions';

if (canViewEmpresa(context, 'empresa-id')) {
  // Usuario puede ver esta empresa
}
```

## Principios de diseño

1. **Simplicidad**: Código claro y explícito, sin magia
2. **Responsabilidad única**: Cada servicio tiene una responsabilidad clara
3. **Sin efectos secundarios**: Las funciones de permisos son puras
4. **TypeScript**: Tipado estricto para prevenir errores
5. **Sin TODOs**: Código completo y funcional desde el inicio
