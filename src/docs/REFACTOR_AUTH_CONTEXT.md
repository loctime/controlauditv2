# Refactorización del AuthContext

## Problema Original
El archivo `AuthContext.jsx` tenía 925 líneas, lo que lo hacía difícil de mantener y entender.

## Solución Implementada
Se dividió en módulos especializados para mejorar la mantenibilidad y organización del código.

## Nueva Estructura

### 1. Hooks Personalizados

#### `src/hooks/useUserProfile.js`
- **Responsabilidad**: Gestión del perfil de usuario y verificación de bloqueos
- **Funciones**:
  - `createOrGetUserProfile()`: Crear o obtener perfil
  - `updateUserProfile()`: Actualizar perfil
  - Verificación automática de bloqueos por estado de pago

#### `src/hooks/useUserManagement.js`
- **Responsabilidad**: Gestión de usuarios y operarios
- **Funciones**:
  - `crearOperario()`: Crear nuevos operarios
  - `editarPermisosOperario()`: Editar permisos
  - `asignarUsuarioAClienteAdmin()`: Asignar usuarios
  - `getUsuariosDeClienteAdmin()`: Obtener usuarios
  - `getFormulariosDeClienteAdmin()`: Obtener formularios

### 2. Servicios Especializados

#### `src/services/empresaService.js`
- **Responsabilidad**: Todas las operaciones relacionadas con empresas
- **Funciones**:
  - `getUserEmpresas()`: Obtener empresas del usuario
  - `subscribeToUserEmpresas()`: Listener reactivo
  - `crearEmpresa()`: Crear nueva empresa
  - `updateEmpresa()`: Actualizar empresa
  - `verificarYCorregirEmpresas()`: Verificar integridad
  - `canViewEmpresa()`: Verificar permisos de vista

#### `src/services/auditoriaService.js`
- **Responsabilidad**: Todas las operaciones relacionadas con auditorías
- **Funciones**:
  - `getUserAuditorias()`: Obtener auditorías del usuario
  - `getAuditoriasCompartidas()`: Obtener auditorías compartidas
  - `compartirAuditoria()`: Compartir auditoría
  - `canViewAuditoria()`: Verificar permisos de vista

### 3. AuthContext Refactorizado

#### `src/components/context/AuthContext.jsx` (Reducido a ~260 líneas)
- **Responsabilidad**: Coordinación y estado global
- **Funciones**:
  - Manejo de autenticación Firebase
  - Coordinación entre hooks y servicios
  - Funciones wrapper para compatibilidad
  - Estado global del contexto

## Beneficios de la Refactorización

### ✅ Mantenibilidad
- Código más fácil de entender y modificar
- Responsabilidades claramente separadas
- Menos acoplamiento entre funciones

### ✅ Reutilización
- Hooks y servicios pueden usarse independientemente
- Lógica de negocio separada de la UI
- Fácil testing unitario

### ✅ Escalabilidad
- Fácil agregar nuevas funcionalidades
- Estructura modular permite crecimiento
- Separación clara de responsabilidades

### ✅ Performance
- Carga lazy de funcionalidades
- Mejor tree-shaking
- Menos re-renders innecesarios

## Uso de los Nuevos Módulos

### En Componentes
```jsx
// Usar el contexto como antes
const { userProfile, crearEmpresa, updateUserProfile } = useAuth();

// O usar hooks específicos directamente
const { userProfile, role, permisos } = useUserProfile(user);
const { crearOperario } = useUserManagement(user, userProfile);
```

### En Servicios
```javascript
// Usar servicios directamente
import { empresaService } from '../services/empresaService';
import { auditoriaService } from '../services/auditoriaService';

const empresas = await empresaService.getUserEmpresas(userId, role);
const auditorias = await auditoriaService.getUserAuditorias(userId, role);
```

## Migración
- **Sin cambios necesarios** en componentes existentes
- La API del contexto se mantiene igual
- Funciones wrapper aseguran compatibilidad
- Migración gradual posible

## Próximos Pasos
1. Migrar componentes para usar hooks específicos
2. Agregar tests unitarios para cada módulo
3. Documentar APIs de cada servicio
4. Considerar lazy loading para servicios grandes
