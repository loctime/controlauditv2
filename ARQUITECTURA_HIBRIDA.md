# 🏗️ Arquitectura Híbrida - Implementación Completada

## 📋 Resumen

Se implementó una **arquitectura híbrida** que combina:
- **AuthContext** con listeners reactivos para datos críticos
- **Service Layer** para datos bajo demanda

## ✅ Cambios Implementados

### 1. **AuthContext Optimizado** (`src/components/context/AuthContext.jsx`)

#### **Eliminado:**
- ❌ While loop bloqueante en `handleOnline`
- ❌ Carga manual duplicada de empresas
- ❌ Funciones `loadUserSucursales()` y `loadUserFormularios()` con reintentos
- ❌ Logs de debugging excesivos

#### **Agregado:**
- ✅ Listeners reactivos (onSnapshot) para empresas, sucursales y formularios
- ✅ Actualización automática en tiempo real
- ✅ Manejo de límite de Firestore (10 elementos en queries 'in')
- ✅ Fallback a caché offline en listeners
- ✅ Funciones de compatibilidad para `getUserSucursales()` y `getUserFormularios()`

### 2. **Listeners Reactivos Implementados**

```javascript
// ✅ Empresas - Listener reactivo
useEffect(() => {
  const unsubscribe = empresaService.subscribeToUserEmpresas(
    userProfile, role, setUserEmpresas, setLoadingEmpresas
  );
  return unsubscribe;
}, [userProfile?.uid, role, userProfile?.clienteAdminId]);

// ✅ Sucursales - Listener reactivo
useEffect(() => {
  // Listener con onSnapshot que actualiza automáticamente
  // Maneja +10 empresas dividiendo en chunks
}, [userProfile?.uid, role, userEmpresas]);

// ✅ Formularios - Listener reactivo  
useEffect(() => {
  // Listener con onSnapshot según rol (supermax, max, operario)
}, [userProfile?.uid, role, userProfile?.clienteAdminId]);
```

### 3. **Services Creados** (Capa de Lógica de Negocio)

#### **empleadoService.js**
```javascript
✅ getEmpleadosByEmpresa(empresaId)
✅ getEmpleadosBySucursal(sucursalId)
✅ getEmpleadosBySucursales(sucursalesIds)
✅ getEmpleadoById(empleadoId)
✅ crearEmpleado(empleadoData, user)
✅ updateEmpleado(empleadoId, updateData, user)
✅ deleteEmpleado(empleadoId, user)
```

#### **capacitacionService.js**
```javascript
✅ getCapacitacionesByEmpresa(empresaId)
✅ getCapacitacionesBySucursal(sucursalId)
✅ getCapacitacionesBySucursales(sucursalesIds)
✅ getCapacitacionById(capacitacionId)
✅ crearCapacitacion(capacitacionData, user)
✅ updateCapacitacion(capacitacionId, updateData, user)
✅ deleteCapacitacion(capacitacionId, user)
✅ completarCapacitacion(capacitacionId, user)
```

#### **accidenteService.js**
```javascript
✅ getAccidentesByEmpresa(empresaId)
✅ getAccidentesBySucursal(sucursalId)
✅ getAccidentesBySucursales(sucursalesIds)
✅ getAccidenteById(accidenteId)
✅ crearAccidente(accidenteData, user)
✅ updateAccidente(accidenteId, updateData, user)
✅ cerrarAccidente(accidenteId, user, notas)
✅ deleteAccidente(accidenteId, user)
✅ getEstadisticasAccidentes(empresaId)
```

## 📊 Arquitectura Final

```
┌─────────────────────────────────────────────────────────┐
│                   AUTHCONTEXT                           │
│         (Estado Global + Listeners Reactivos)           │
├─────────────────────────────────────────────────────────┤
│ ✅ Empresas      → Listener onSnapshot (tiempo real)    │
│ ✅ Sucursales    → Listener onSnapshot (tiempo real)    │
│ ✅ Formularios   → Listener onSnapshot (tiempo real)    │
│ ✅ Auditorías    → Carga manual (no cambian tanto)      │
│ ✅ userProfile   → Hook personalizado useUserProfile    │
│ ✅ role/permisos → Hook personalizado useUserProfile    │
└─────────────────────────────────────────────────────────┘
                           ↓
                 Datos siempre disponibles
                 Se actualizan automáticamente
                 Disponibles en toda la app

┌─────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                         │
│            (Lógica de Negocio Reutilizable)             │
├─────────────────────────────────────────────────────────┤
│ ✅ empleadoService.js      → Consulta bajo demanda      │
│ ✅ capacitacionService.js  → Consulta bajo demanda      │
│ ✅ accidenteService.js     → Consulta bajo demanda      │
│ ✅ empresaService.js       → Ya existía                 │
│ ✅ auditoriaService.js     → Ya existía                 │
└─────────────────────────────────────────────────────────┘
                           ↓
                 Se llaman desde componentes
                 Reutilizables en toda la app
                 No mantienen estado propio
```

## 🎯 Ventajas de esta Arquitectura

### **Listeners Reactivos (AuthContext)**
✅ Datos críticos siempre actualizados en tiempo real
✅ No necesitas recargar manualmente
✅ Sincronización automática entre pestañas
✅ Mejor UX: cambios instantáneos
✅ Menos código en componentes

### **Service Layer**
✅ Lógica centralizada y reutilizable
✅ Fácil de testear
✅ Mantiene componentes simples
✅ Código DRY (Don't Repeat Yourself)
✅ Registro de acciones consistente

## 📝 Cómo Usar

### **Datos del AuthContext** (Siempre disponibles)
```javascript
import { useAuth } from '../../context/AuthContext';

function MiComponente() {
  const { 
    userEmpresas,      // ← Ya disponibles, se actualizan automáticamente
    userSucursales,    // ← Ya disponibles, se actualizan automáticamente
    userFormularios,   // ← Ya disponibles, se actualizan automáticamente
    loadingEmpresas,   // ← Para mostrar loaders
    loadingSucursales,
    loadingFormularios
  } = useAuth();
  
  // No necesitas llamar a getUserEmpresas(), ya están ahí!
  return <div>{userEmpresas.map(...)}</div>;
}
```

### **Datos del Service Layer** (Bajo demanda)
```javascript
import { empleadoService } from '../../../services/empleadoService';
import { capacitacionService } from '../../../services/capacitacionService';

function EmpleadosTab({ empresaId }) {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const cargarEmpleados = async () => {
      setLoading(true);
      const data = await empleadoService.getEmpleadosByEmpresa(empresaId);
      setEmpleados(data);
      setLoading(false);
    };
    
    cargarEmpleados();
  }, [empresaId]);
  
  return <div>{empleados.map(...)}</div>;
}
```

## 🔄 Flujo de Datos al Hacer Login (Sistema Híbrido)

```
1. Usuario hace login
   ↓
2. onAuthStateChanged detecta cambio
   ↓
3. Se crea/obtiene userProfile
   ↓
4. setUserProfile(profile) ← Disponible inmediatamente
   ↓
5. CARGA MANUAL (bloqueante - para cache inicial):
   - await loadUserEmpresas() → Espera ~1-2 seg
   - await loadUserAuditorias()
   - await loadAuditoriasCompartidas()
   ↓
6. setTimeout 1.5 seg → ESPERA que empresas estén listas
   ↓
7. CARGA MANUAL (bloqueante - para cache inicial):
   - await loadUserSucursales() → Espera ~1-2 seg
   - await loadUserFormularios()
   ↓
8. await saveCompleteUserCache() ← Cache CON datos completos
   ↓
9. EN PARALELO: Listeners reactivos ya activos:
   - empresaService.subscribeToUserEmpresas() → Actualizaciones tiempo real
   - Listener de sucursales → Actualizaciones tiempo real
   - Listener de formularios → Actualizaciones tiempo real
   ↓
10. ✅ App funciona OFFLINE + actualizaciones en TIEMPO REAL
```

## ✅ PWA Offline Funcionando Correctamente

Los listeners reactivos incluyen:
- ✅ **Fallback automático al cache IndexedDB** en caso de error
- ✅ Compatible con `offlineDatabase.js` y `completeOfflineCache.js`
- ✅ Los datos se guardan al login vía `saveCompleteUserCache()`
- ✅ **Funciona sin conexión** si ya se cargó antes

### Flujo Offline:
```
1. Usuario va offline
   ↓
2. onSnapshot falla (no hay conexión)
   ↓
3. Error handler detecta el fallo
   ↓
4. loadUserFromCache() carga desde IndexedDB
   ↓
5. ✅ App funciona con datos en cache
```

### Error Handlers con Fallback:
```javascript
// Empresas
async (error) => {
  const cachedData = await loadUserFromCache();
  if (cachedData?.empresas) setUserEmpresas(cachedData.empresas);
}

// Sucursales
async (error) => {
  const cachedData = await loadUserFromCache();
  if (cachedData?.sucursales) setUserSucursales(cachedData.sucursales);
}

// Formularios
async (error) => {
  const cachedData = await loadUserFromCache();
  if (cachedData?.formularios) setUserFormularios(cachedData.formularios);
}
```

## 🚀 Mejoras Futuras Sugeridas

1. **Considerar agregar listeners para auditorías** si se necesitan actualizaciones en tiempo real
2. **Implementar paginación** en services si hay muchos registros
3. **Agregar cache en services** con TTL (Time To Live)
4. **Implementar optimistic updates** para mejor UX

## 📌 Notas Importantes

- Los listeners reactivos se **desuscriben automáticamente** cuando el componente se desmonta
- Las funciones `getUserSucursales()` y `getUserFormularios()` ahora son **compatibilidad** y retornan los datos del estado
- Solo se mantienen **logs críticos** (errores)
- El while loop bloqueante fue **eliminado** completamente

