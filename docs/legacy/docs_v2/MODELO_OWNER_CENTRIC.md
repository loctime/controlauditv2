# Modelo Owner-Centric - ControlAudit

## Visión General

ControlAudit utiliza un modelo **owner-centric** donde todos los datos están organizados bajo el nodo del propietario (`ownerId`). Este modelo elimina la complejidad del modelo legacy y garantiza una separación clara de datos por cliente.

## Estructura de Datos

```
apps/auditoria/owners/{ownerId}/
├── usuarios/{userId}          # Usuarios del owner (admins y operarios)
├── empresas/{empresaId}       # Empresas del owner
├── sucursales/{sucursalId}    # Sucursales del owner
├── formularios/{formularioId} # Formularios del owner
├── reportes/{reporteId}       # Reportes del owner
└── configuracion/{configId}   # Configuración del owner
```

### Principios Fundamentales

1. **Un solo modelo**: No existe modelo legacy. Todo está bajo `apps/auditoria/owners/{ownerId}/`
2. **ownerId como autoridad**: El path define la autoridad. Si `ownerId` en la ruta coincide con `request.auth.uid` (o `request.auth.token.ownerId` para operarios), hay acceso.
3. **Custom claims como fuente de verdad**: Para operarios, `ownerId` proviene exclusivamente de `request.auth.token.ownerId` (custom claims de Firebase Auth).

## Autenticación y Roles

### Roles Válidos

- **`admin`**: Propietario del sistema. Su `ownerId` es su propio `uid`.
- **`operario`**: Usuario interno asignado a un owner. Su `ownerId` viene del token (custom claims).

### Custom Claims

Los custom claims de Firebase Auth son la **única fuente de verdad** para:
- `role`: Rol del usuario (`admin` o `operario`)
- `ownerId`: ID del owner (solo para operarios)

#### Backend: Creación de Operarios

Cuando se crea un operario desde el backend (`/api/admin/create-user`):

```javascript
// 1. Crear usuario en Firebase Auth
const userRecord = await admin.auth().createUser({ email, password });

// 2. Setear custom claims
await admin.auth().setCustomUserClaims(userRecord.uid, {
  role: 'operario',
  ownerId: ownerId // UID del admin que crea el operario
});

// 3. Crear documento en Firestore
const ownerUserRef = admin.firestore()
  .collection('apps')
  .doc('auditoria')
  .collection('owners')
  .doc(ownerId)
  .collection('usuarios')
  .doc(userRecord.uid);

await ownerUserRef.set({
  uid: userRecord.uid,
  email: email,
  displayName: nombre,
  role: 'operario',
  ownerId: ownerId,
  appId: 'auditoria',
  status: 'active',
  createdAt: new Date(),
  empresasAsignadas: []
});
```

### Frontend: Lectura de Perfil

#### useUserProfile Hook

El hook `useUserProfile` es la **única fuente de verdad** para el perfil del usuario. `AuthContext` nunca setea `userProfile` directamente.

```javascript
// useUserProfile.js
const createOrGetUserProfile = async (firebaseUser, ownerIdFromToken) => {
  // 1. Limpiar estado previo
  setUserProfile(null);
  setRole(null);
  
  // 2. Leer desde owner-centric
  const userRef = doc(db, "apps", "auditoria", "owners", ownerIdFromToken, "usuarios", firebaseUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null; // Usuario no encontrado
  }
  
  // 3. Construir perfil y setear estado
  const cleanProfile = { /* ... */ };
  setUserProfile(cleanProfile);
  setRole(cleanProfile.role);
  
  return cleanProfile;
};
```

#### AuthContext: Flujo de Inicialización

```javascript
// 1. Obtener token con refresh forzado
const token = await auth.currentUser.getIdTokenResult(true);
const tokenRole = token.claims.role;
const tokenOwnerId = token.claims.ownerId; // Solo para operarios

// 2. Llamar a createOrGetUserProfile según role
let profile = null;
if (tokenRole === 'admin') {
  profile = await createOrGetUserProfile(firebaseUser, firebaseUser.uid);
} else if (tokenRole === 'operario' && tokenOwnerId) {
  profile = await createOrGetUserProfile(firebaseUser, tokenOwnerId);
}

// 3. Validar que userProfile se sincronizó
if (!userProfile) {
  await new Promise(resolve => setTimeout(resolve, 100));
  if (!userProfile) {
    console.error('userProfile no sincronizado');
    return;
  }
}

// 4. Cargar datos secundarios (empresas, sucursales, etc.)
// authReady se establece automáticamente cuando user, userProfile y role están listos
```

### authReady: Estado de Autenticación Completa

`authReady` se deriva automáticamente del estado. **Nunca se setea manualmente**.

```javascript
useEffect(() => {
  const isReady = !!(
    user &&
    userProfile &&
    userProfile.uid &&
    role &&
    typeof role === 'string' &&
    role.length > 0
  );
  
  if (isReady !== authReady) {
    setAuthReady(isReady);
  }
}, [user, userProfile, role, authReady]);
```

**Regla crítica**: `authReady` solo es `true` cuando:
- `user` existe
- `userProfile` existe y tiene `uid`
- `role` existe y es un string no vacío

## Reglas de Firestore

### Estructura de Reglas

```javascript
// Helper: Verificar autenticación
function isAuth() {
  return request.auth != null;
}

// Helper: Obtener UID del usuario autenticado
function uid() {
  return request.auth.uid;
}

// Empresas del owner
match /apps/auditoria/owners/{ownerId}/empresas/{empresaId} {
  // Owner puede leer/escribir sus propias empresas
  allow read, create, update, delete: if isAuth() && ownerId == uid();
  
  // Operario puede leer empresas asignadas
  allow read: if isAuth()
    && request.auth.token.role == 'operario'
    && request.auth.token.ownerId == ownerId
    && resource.data.operarios[uid()] == true;
}

// Usuarios del owner
match /apps/auditoria/owners/{ownerId}/usuarios/{userId} {
  // Owner puede leer/escribir todos sus usuarios
  allow read, create, update, delete: if isAuth() && ownerId == uid();
  
  // Operario puede leer su propio documento
  allow read: if isAuth()
    && request.auth.token.role == 'operario'
    && userId == uid()
    && request.auth.token.ownerId == ownerId;
  
  // Operario NO puede crear/actualizar/eliminar usuarios
  allow create, update, delete: if false;
}
```

### Principios de Seguridad

1. **Path-based authorization**: El `ownerId` en la ruta debe coincidir con `request.auth.uid` (owner) o `request.auth.token.ownerId` (operario).
2. **Custom claims como fuente de verdad**: Para operarios, `ownerId` siempre viene del token, nunca se infiere desde Firestore.
3. **Sin validación de contenido**: Las reglas validan por path, no por campos del documento (como `appId`, `activo`, etc.).

## Servicios

### ownerUserService.ts

```typescript
// Leer usuarios del owner
async getUsers(ownerId: string): Promise<User[]> {
  const usersRef = collection(db, "apps", "auditoria", "owners", ownerId, "usuarios");
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

// Crear usuario (solo owner-centric)
async createUser(userData: User, currentUserUid: string): Promise<void> {
  const userRef = doc(db, "apps", "auditoria", "owners", currentUserUid, "usuarios", userData.uid);
  await setDoc(userRef, {
    ownerId: currentUserUid,
    appId: 'auditoria',
    role: userData.role,
    empresasAsignadas: userData.empresasAsignadas || [],
    activo: userData.activo !== undefined ? userData.activo : true,
    createdAt: new Date()
  });
}
```

### empresaService.js

```javascript
// Obtener empresas según role
async getUserEmpresas({ userId, role, userProfile }) {
  if (role === 'operario') {
    // Operario: usar ownerId del token (viene en userProfile)
    const ownerId = userProfile?.ownerId;
    return await this.getEmpresasForOperario(userId, ownerId);
  } else {
    // Admin: su UID es su ownerId
    const ownerId = userId;
    return await this.getEmpresasForOwner(ownerId);
  }
}
```

## Modo Offline

### Principios

1. **Cache solo para datos secundarios**: En modo offline, el cache se usa solo para empresas, sucursales, formularios y auditorías.
2. **NO cachear userProfile**: El perfil del usuario nunca se carga desde cache. Requiere Firestore + token válido.
3. **Sin sesión completa offline**: Si no hay Firestore + token válido, no hay sesión lógica completa. El modo offline solo es visual.

### Implementación

```javascript
// En AuthContext - flujo offline
if (wasLoggedIn && enableOffline && loadUserFromCache) {
  const cachedUser = await loadUserFromCache();
  
  // Solo cargar datos secundarios, NO userProfile
  if (cachedUser.empresas?.length > 0) {
    setUserEmpresas(cachedUser.empresas);
  }
  // ... otros datos secundarios
  
  // NO hacer: setUserProfile(cachedProfile) ❌
}
```

## Reglas de Desarrollo

### ❌ NO Hacer

1. **NO crear perfiles manualmente en AuthContext**
   ```javascript
   // ❌ INCORRECTO
   profile = {
     uid: firebaseUser.uid,
     role: 'admin',
     // ...
   };
   setUserProfile(profile);
   ```

2. **NO setear authReady manualmente**
   ```javascript
   // ❌ INCORRECTO
   setAuthReady(true);
   ```

3. **NO inferir ownerId desde Firestore para operarios**
   ```javascript
   // ❌ INCORRECTO
   const ownerId = userProfile.ownerId; // Solo si viene del token
   ```

4. **NO usar rutas legacy**
   ```javascript
   // ❌ INCORRECTO
   const userRef = doc(db, "apps", "auditoria", "users", userId);
   ```

### ✅ Hacer

1. **Siempre usar createOrGetUserProfile**
   ```javascript
   // ✅ CORRECTO
   const profile = await createOrGetUserProfile(firebaseUser, ownerId);
   ```

2. **Dejar que authReady se derive automáticamente**
   ```javascript
   // ✅ CORRECTO - se deriva del estado
   // No hacer nada, el useEffect lo maneja
   ```

3. **ownerId siempre del token para operarios**
   ```javascript
   // ✅ CORRECTO
   const token = await auth.currentUser.getIdTokenResult(true);
   const ownerId = token.claims.ownerId; // Para operarios
   ```

4. **Usar rutas owner-centric**
   ```javascript
   // ✅ CORRECTO
   const userRef = doc(db, "apps", "auditoria", "owners", ownerId, "usuarios", userId);
   ```

## Migración desde Legacy

### Estado Actual

- ✅ Modelo legacy eliminado completamente
- ✅ Solo modelo owner-centric
- ✅ Custom claims implementados
- ✅ useUserProfile como única fuente de verdad
- ✅ authReady derivado automáticamente

### No Requerido

- ❌ No hay migración automática de datos
- ❌ No hay compatibilidad legacy
- ❌ No hay flags de migración

## Resolución de Problemas

### Operario sin ownerId en token

**Síntoma**: `createOrGetUserProfile` retorna `null` para operario.

**Causa**: Custom claims no seteados o token no refrescado.

**Solución**:
1. Verificar que el backend setee custom claims al crear operario
2. Forzar refresh del token: `getIdTokenResult(true)`
3. Verificar que el operario tenga documento en `apps/auditoria/owners/{ownerId}/usuarios/{userId}`

### authReady nunca se activa

**Síntoma**: `authReady` permanece en `false`.

**Causa**: `userProfile` o `role` no están sincronizados.

**Solución**:
1. Verificar que `createOrGetUserProfile` retorne un perfil válido
2. Verificar que `useUserProfile` setee `userProfile` y `role`
3. Verificar que el `useEffect` de `authReady` esté activo

### Perfil colgado (stale state)

**Síntoma**: Se muestra perfil de usuario anterior después de logout/login.

**Causa**: Estado no limpiado antes de leer nuevo perfil.

**Solución**: Ya implementado - `createOrGetUserProfile` limpia estado previo:
```javascript
setUserProfile(null);
setRole(null);
// Luego lee Firestore
```

## Referencias

- `src/hooks/useUserProfile.js`: Hook principal para gestión de perfil
- `src/components/context/AuthContext.jsx`: Contexto de autenticación
- `backend/index.js`: API backend para creación de usuarios
- `firestore.rules`: Reglas de seguridad de Firestore
- `src/core/services/ownerUserService.ts`: Servicio para gestión de usuarios
- `src/services/empresaService.js`: Servicio para gestión de empresas
