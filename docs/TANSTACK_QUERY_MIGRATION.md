# Migración a TanStack Query - Capacitaciones y Accidentes

## 📋 Resumen

Migración incremental de **solo** Capacitaciones y Accidentes a TanStack Query, sin tocar AuthContext ni otras entidades.

## 🔑 QueryKeys Elegidas

### Capacitaciones
```javascript
['capacitaciones', userId, empresaId?, sucursalId?]
```

**Ejemplos:**
- Sin filtros: `['capacitaciones', 'user123']`
- Por empresa: `['capacitaciones', 'user123', 'empresa456']`
- Por sucursal: `['capacitaciones', 'user123', 'empresa456', 'sucursal789']`

**Razón:** Cache independiente por combinación de filtros. Si cambias de empresa, obtienes cache diferente.

### Planes Anuales
```javascript
['planes-anuales', userId, empresaId?, sucursalId?]
```

**Misma estructura que capacitaciones** pero separada para cache independiente.

### Accidentes
```javascript
['accidentes', userId, empresaId?, sucursalId?, tipo?, estado?]
```

**Ejemplos:**
- Sin filtros: `['accidentes', 'user123']`
- Con todos los filtros: `['accidentes', 'user123', 'empresa456', 'sucursal789', 'accidente', 'abierto']`

**Razón:** Cache granular por cada combinación de filtros. Cambiar cualquier filtro genera nueva query cacheada.

## 📦 Instalación Requerida

```bash
npm install @tanstack/react-query
```

## 🔧 Configuración Necesaria

### 1. Actualizar `main.jsx`

```javascript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './hooks/queries/queryClientConfig';

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

## 🔄 Cambios en Componentes

### Capacitaciones.jsx

**ANTES:**
```javascript
import { useCapacitacionesData } from './hooks/useCapacitacionesData';

const { capacitaciones, planesAnuales, loading, recargarDatos } = useCapacitacionesData(
  selectedEmpresa,
  selectedSucursal,
  sucursalesDisponibles,
  empresasCargadas
);
```

**DESPUÉS:**
```javascript
import { useCapacitacionesQuery } from '../../../hooks/queries/useCapacitacionesQuery';

// Usar loadingEmpresas del AuthContext para indicar si empresas ya terminaron de cargar
const { loadingEmpresas } = useAuth();

const { capacitaciones, planesAnuales, loading, recargarDatos } = useCapacitacionesQuery(
  selectedEmpresa,
  selectedSucursal,
  sucursalesDisponibles,
  !loadingEmpresas // empresasReady: true cuando ya terminó de cargar (incluso si hay 0 empresas)
);
```

### Accidentes.jsx

**ANTES:**
```javascript
import { useAccidentesData } from './hooks/useAccidentesData';

const { accidentes, loading, recargarAccidentes } = useAccidentesData(
  selectedEmpresa,
  selectedSucursal,
  filterTipo,
  filterEstado,
  empresasCargadas,
  userProfile
);
```

**DESPUÉS:**
```javascript
import { useAccidentesQuery } from '../../../hooks/queries/useAccidentesQuery';

// Usar loadingEmpresas del AuthContext para indicar si empresas ya terminaron de cargar
const { loadingEmpresas } = useAuth();

const { accidentes, loading, recargarAccidentes } = useAccidentesQuery(
  selectedEmpresa,
  selectedSucursal,
  filterTipo,
  filterEstado,
  !loadingEmpresas, // empresasReady: true cuando ya terminó de cargar (incluso si hay 0 empresas)
  userProfile
);
```

## ✅ Ventajas de esta Migración

1. **Cache automático:** TanStack Query cachea resultados automáticamente
2. **Sin parpadeos:** `staleTime` evita refetch innecesarios
3. **Loading states mejorados:** `isLoading` vs `isFetching` separados
4. **Refetch inteligente:** Solo refetch cuando los datos están "stale"
5. **Error handling:** Manejo de errores centralizado

## ⚠️ Consideraciones

1. **No afecta offline actual:** Los hooks no usan persistQueryClient aún
2. **No rompe navegación:** Las queryKeys son estables
3. **Compatible con filtros existentes:** Misma interfaz que hooks anteriores
4. **No duplica estado:** No se crea estado en contextos existentes

## 🔧 Correcciones Aplicadas

### QueryKeys con `undefined` en lugar de `filter(Boolean)`
- **Problema:** `filter(Boolean)` elimina valores falsy válidos como `0`, `''`, `false`
- **Solución:** Usar `?? undefined` para mantener posición semántica en la queryKey
- **Beneficio:** TanStack Query maneja `undefined` perfectamente y evita bugs futuros

### Dependencia `empresasReady` en lugar de `empresasCargadas`
- **Problema:** `empresasCargadas` como array puede bloquear queries si el usuario tiene 0 empresas
- **Solución:** Usar `!loadingEmpresas` del AuthContext (boolean explícito)
- **Beneficio:** Queries corren correctamente incluso si el usuario tiene 0 empresas

## 🚀 Próximos Pasos (Futuro)

- Agregar `persistQueryClient` para offline
- Migrar listeners reactivos con `useQuery` + `onSnapshot`
- Considerar migrar otras entidades si esta funciona bien
