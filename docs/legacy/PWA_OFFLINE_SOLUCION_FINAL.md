# ✅ PWA Offline - Solución Final

> **📌 Nota sobre terminología:** En este documento, "formularios" se refiere a los **datos** (colección de Firestore), no a rutas. La ruta donde se gestionan los formularios es `/editar`. La ruta `/formulario` es para crear formularios (no necesario offline).

## 🚨 Problema Raíz Identificado

El PWA **NO podía funcionar offline** por **2 problemas críticos**:

### **1. Service Worker DESHABILITADO**
```javascript
// index.html líneas 29-56 (ANTES)
// ❌ Eliminaba TODOS los service workers
await registration.unregister();
// ❌ Borraba TODOS los caches
await caches.delete(cacheName);
```

**Sin Service Worker:**
- ❌ No puede servir recursos offline (HTML, JS, CSS)
- ❌ No intercepta peticiones de red
- ❌ Muestra página de "sin conexión" del navegador

### **2. Cache de datos se guardaba VACÍO**
```javascript
// AuthContext (ANTES)
// Listeners se activaban (asíncronos)
onSnapshot(...) // No bloqueante

// Cache se guardaba INMEDIATAMENTE
await saveCompleteUserCache() // ❌ userEmpresas = []
```

---

## ✅ Soluciones Implementadas

### **1. Service Worker HABILITADO**

**index.html actualizado:**
```javascript
// ✅ Registra Service Worker correctamente
const registration = await navigator.serviceWorker.register('/sw.js');
console.log('✅ Service Worker registrado');
```

**Qué hace el Service Worker:**
- ✅ Cachea recursos estáticos (HTML, JS, CSS, imágenes)
- ✅ Permite que la app cargue offline
- ✅ Intercepta peticiones y sirve desde cache
- ✅ Se actualiza automáticamente cuando hay nueva versión

### **2. Cache de datos CON contenido completo**

**AuthContext - Sistema Híbrido:**
```javascript
// Al login:

// 1. Carga manual BLOQUEANTE (espera datos)
await loadUserEmpresas(uid, profile, role);
await loadUserAuditorias(uid);

// 2. Espera 1.5 seg y carga más datos
setTimeout(async () => {
  await loadUserSucursales(uid);
  await loadUserFormularios(uid);
  
  // 3. AHORA SÍ guarda cache (con datos completos)
  await saveCompleteUserCache(profile);
  console.log('✅ Cache guardado con datos completos');
}, 1500);

// 4. Listeners reactivos (en paralelo, para tiempo real)
useEffect(() => onSnapshot(...))
```

---

## 🔧 Arquitectura PWA Offline Completa

```
┌──────────────────────────────────────────────┐
│  PWA WEB - Dos capas de cache                │
├──────────────────────────────────────────────┤
│  CAPA 1: Service Worker (sw.js)             │
│  ✅ Cachea: HTML, JS, CSS, imágenes          │
│  ✅ Permite: App cargue sin conexión         │
│  ✅ Estrategia: Network First + Cache        │
├──────────────────────────────────────────────┤
│  CAPA 2: IndexedDB                           │
│  ✅ Cachea: Empresas, Sucursales, Forms      │
│  ✅ Permite: Auditorías funcionen offline    │
│  ✅ Guardado: loadUserFromCache()            │
└──────────────────────────────────────────────┘
```

---

## 🔄 Flujo Offline Completo

### **Primera vez ONLINE:**
```
1. Login con internet
2. Service Worker se registra
3. SW cachea recursos estáticos
4. AuthContext carga datos (await)
5. saveCompleteUserCache() guarda en IndexedDB
6. ✅ Todo listo para offline
```

### **Segunda vez OFFLINE:**
```
1. Usuario offline, abre PWA
2. Service Worker sirve HTML/JS/CSS desde cache
3. App inicia, ejecuta AuthContext
4. onAuthStateChanged NO conecta con Firebase
5. Detecta localStorage.getItem("isLogged") = true
6. loadUserFromCache() lee de IndexedDB
7. setUserEmpresas/Sucursales/Formularios con datos cache
8. setLoading(false) después de 2.5 seg máximo
9. ✅ App funciona offline con datos
```

---

## 📊 Diferencia Service Worker vs Capacitor

| Característica | Service Worker | Capacitor |
|----------------|---------------|-----------|
| **Tecnología** | Web estándar | Plugin nativo |
| **Dónde funciona** | PWA web (navegador) | App móvil (APK) |
| **Qué cachea** | Recursos estáticos | - |
| **Necesario para** | PWA offline | App Android/iOS |
| **Tu caso** | ✅ **LO NECESITAS** | ❌ No lo usas |

---

## ✅ Estado Final

### **PWA Web (lo que usas):**
- ✅ Service Worker: Habilitado
- ✅ IndexedDB: Funcionando
- ✅ Offline: Funciona completo
- ✅ Tiempo real: Listeners activos

### **Capacitor (no lo usas):**
- ⚠️ Se compila en background (npm run dev)
- ⚠️ Puedes ignorar los logs de Capacitor
- ⚠️ Puedes eliminar si no usas APK

---

## 🧪 Cómo Probar PWA Offline

1. **Abre Chrome**: http://localhost:5173
2. **Instala PWA**: Click en ícono de instalación
3. **Haz login**: Espera ~3 segundos
4. **Verifica cache**:
   - F12 → Application → Service Workers (debe estar activo)
   - Application → IndexedDB → controlaudit_offline_v1 (debe tener datos)
5. **Simula offline**: F12 → Network → Offline
6. **Recarga**: Ctrl+R
7. **✅ Debería funcionar** con empresas, sucursales, formularios

---

## 📌 Logs Esperados

**Online (primera vez):**
```
✅ Service Worker registrado: http://localhost:5173/
✅ Cache guardado con datos completos
```

**Offline (segunda vez):**
```
✅ Datos cargados desde cache offline: { empresas: 5, sucursales: 12, formularios: 8 }
⏱️ Timeout alcanzado, finalizando loaders
```

---

## 🔧 Solución Específica para Edge PWA

### **Problema Identificado:**
Edge PWA requería inicialización adicional de IndexedDB y hooks cuando entraba offline directamente sin pasar por `/auditoria` primero, causando error React #306.

### **Solución Implementada:**

**1. Inicialización Automática en AuthContext:**
```javascript
// Cuando Edge PWA entra offline, inicializa datos offline automáticamente
if (isEdge && isPWA) {
  await initializeOfflineData(cachedProfile, setUserEmpresas, setUserSucursales, setUserFormularios);
}
```

**2. Navegación Automática a `/auditoria` en Home:**
```javascript
// En Edge PWA, después de cargar datos, navega brevemente a /auditoria
// Esto monta el componente y ejecuta useAuditoriaData que inicializa IndexedDB
if (isEdge) {
  navigate('/auditoria');
  await new Promise(resolve => setTimeout(resolve, 1500));
  navigate(returnPath); // Vuelve a Home
}
```

**3. Control de Frecuencia:**
- Se ejecuta automáticamente **una vez por día** (24 horas)
- El usuario puede activarlo manualmente con el botón "Recargar" cuando quiera
- Se guarda timestamp en `localStorage` para controlar la frecuencia

### **Archivos Clave:**
- `src/utils/initializeOfflineData.js` - Función utilitaria para inicializar datos offline
- `src/components/context/AuthContext.jsx` - Inicialización automática cuando Edge entra offline
- `src/components/pages/home/Home.jsx` - Navegación automática a `/auditoria` para Edge PWA

---

## 🚀 Próximos Pasos

Si quieres **eliminar Capacitor completamente**:
1. Cambiar `package.json` → `"dev": "concurrently \"vite\" \"cd backend && npm run dev\""`
2. Eliminar carpeta `android/`
3. Desinstalar dependencias de Capacitor

**Pero NO es urgente** - No afecta el PWA web para nada.

