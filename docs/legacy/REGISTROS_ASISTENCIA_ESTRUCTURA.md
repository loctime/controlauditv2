# Estructura de Registros de Asistencia

## Modelo de Datos

### Colección: `registrosAsistencia`

**Path multi-tenant:** `apps/auditoria/users/{userId}/registrosAsistencia`

**Estructura del documento:**
```javascript
{
  id: "auto-generated",
  capacitacionId: "cap-001",           // Referencia a la capacitación
  empleadoIds: ["emp-001", "emp-002"], // IDs de empleados que asistieron
  imagenIds: ["img-001", "img-002"],   // IDs de imágenes asociadas (para queries eficientes)
  imagenes: [                           // ⚠️ SOLO metadata liviana permitida
    {
      id: "img-001",                    // Requerido: id o fileId
      shareToken: "abc123...",          // Requerido: token de ControlFile
      nombre: "foto1.jpg",              // Opcional: nombre del archivo
      createdAt: Timestamp              // Opcional: fecha de creación
    }
  ],
  // ⚠️ CONTRATO: imagenes NO debe contener:
  // - Blobs, Files, base64, data URLs, buffers
  // - URLs completas (usar shareToken en su lugar)
  // - Cualquier dato pesado (>1KB por imagen)
  fecha: Timestamp,                     // Fecha del registro
  creadoPor: "user-uid",               // Usuario que creó el registro
  createdAt: Timestamp,                 // Timestamp de creación
  appId: "auditoria"                    // Identificador de app (multi-tenant)
}
```

### Colección: `capacitaciones` (Actualizada)

**Path multi-tenant:** `apps/auditoria/users/{userId}/capacitaciones`

**Estructura del documento (simplificada):**
```javascript
{
  id: "auto-generated",
  empresaId: "emp-001",
  sucursalId: "suc-001",
  nombre: "Prevención de Riesgos Laborales",
  descripcion: "...",
  tipo: "charla",
  fechaRealizada: Timestamp,
  instructor: "Carlos Gómez",
  estado: "activa", // "activa" | "completada"
  
  // ⚠️ DEPRECADO: Se mantiene solo para compatibilidad legacy
  // Los empleados se calculan dinámicamente desde registrosAsistencia
  empleados: [...], // Solo lectura legacy
  
  createdAt: Timestamp,
  appId: "auditoria"
}
```

## Índices Requeridos

### Para `registrosAsistencia`

1. **Índice por capacitación y fecha:**
   - Collection: `registrosAsistencia`
   - Fields:
     - `capacitacionId` (Ascending)
     - `fecha` (Descending)

2. **Índice por empleado y fecha (OPTIMIZADO):**
   - Collection: `registrosAsistencia`
   - Fields:
     - `empleadoIds` (Array contains)
     - `fecha` (Descending)
   - ✅ Firestore soporta `array-contains` con `orderBy` cuando el índice está configurado correctamente
   - Usado por: `getRegistrosByEmpleado()` para queries eficientes

3. **Índice por fecha:**
   - Collection: `registrosAsistencia`
   - Fields:
     - `fecha` (Descending)

## Queries Comunes

### Obtener todos los registros de una capacitación
```javascript
const registrosRef = auditUserCollection(userId, 'registrosAsistencia');
const q = query(
  registrosRef,
  where('capacitacionId', '==', capacitacionId),
  orderBy('fecha', 'desc')
);
```

### Obtener registros de un empleado
```javascript
// Opción 1: Query simple (requiere escanear todos los registros)
const registrosRef = auditUserCollection(userId, 'registrosAsistencia');
const snapshot = await getDocs(registrosRef);
const registrosEmpleado = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(reg => reg.empleadoIds.includes(empleadoId));

// Opción 2: Usar subcolección (más eficiente para muchos registros)
// registrosAsistencia/{registroId}/empleados/{empleadoId}
```

### Calcular empleados únicos de una capacitación
```javascript
const registros = await getRegistrosByCapacitacion(userId, capacitacionId);
const empleadoIdsUnicos = new Set();
registros.forEach(reg => {
  reg.empleadoIds.forEach(id => empleadoIdsUnicos.add(id));
});
return Array.from(empleadoIdsUnicos);
```

## Migración de Datos

Los datos existentes en `capacitacion.registroAsistencia` deben migrarse a la nueva colección.

Ver script: `scripts/migrate-registros-asistencia.js`

## Compatibilidad Legacy

- El campo `capacitacion.empleados` se mantiene para lectura legacy
- Los nuevos registros NO actualizan `capacitacion.empleados`
- Se calcula dinámicamente desde `registrosAsistencia` cuando se necesita
