# Estructura de Firestore - Sistema de Empleados y Capacitaciones

## Colecciones Nuevas

### 1. `empleados`

Almacena información de empleados por sucursal.

**Estructura:**
```javascript
{
  id: "auto-generated",
  empresaId: "17dixBvPWs93vPdn33B3",
  sucursalId: "sucursal-001",
  nombre: "Juan Pérez",
  dni: "12345678",
  cargo: "Operario",
  area: "Producción",
  tipo: "operativo", // "operativo" | "administrativo"
  fechaIngreso: Timestamp,
  estado: "activo", // "activo" | "inactivo"
  fechaInicioReposo: Timestamp, // (Opcional) Se agrega cuando el empleado está en reposo por accidente
  createdAt: Timestamp,
  createdBy: "admin-uid"
}
```

**Notas importantes:**
- El campo `fechaInicioReposo` se agrega automáticamente cuando un empleado es reportado en un accidente con días de reposo
- Cuando `estado` cambia a "inactivo" por reposo, el administrador debe activarlo manualmente cuando regrese

**Índices requeridos:**
- Compuesto: `(empresaId ASC, sucursalId ASC, estado ASC)`
- Compuesto: `(sucursalId ASC, estado ASC)`

### 2. `capacitaciones`

Almacena capacitaciones realizadas por sucursal.

**Estructura:**
```javascript
{
  id: "auto-generated",
  empresaId: "17dixBvPWs93vPdn33B3",
  sucursalId: "sucursal-001",
  nombre: "Prevención de Riesgos Laborales",
  descripcion: "Capacitación obligatoria anual",
  tipo: "charla", // "charla" | "entrenamiento" | "capacitacion"
  fechaRealizada: Timestamp,
  instructor: "Carlos Gómez",
  estado: "activa", // "activa" | "completada"
  empleados: [
    {
      empleadoId: "emp-001",
      empleadoNombre: "Juan Pérez",
      asistio: true,
      fecha: Timestamp
    }
  ],
  createdAt: Timestamp,
  createdBy: "admin-uid"
}
```

**Índices requeridos:**
- Compuesto: `(empresaId ASC, sucursalId ASC, estado ASC)`
- Compuesto: `(sucursalId ASC, estado ASC)`
- Compuesto: `(sucursalId ASC, fechaRealizada DESC)`

### 3. `accidentes`

Almacena registro de accidentes e incidentes por sucursal. Sistema actualizado con soporte para múltiples empleados involucrados.

**Estructura:**
```javascript
{
  id: "auto-generated",
  empresaId: "17dixBvPWs93vPdn33B3",
  sucursalId: "sucursal-001",
  tipo: "accidente", // "accidente" | "incidente"
  fechaHora: Timestamp,
  descripcion: "Descripción detallada del evento",
  
  // Para ACCIDENTES: empleados involucrados con información de días de reposo
  empleadosInvolucrados: [
    {
      empleadoId: "emp-001",
      empleadoNombre: "Juan Pérez",
      conReposo: true, // Si el empleado tendrá días de reposo
      fechaInicioReposo: Timestamp // Fecha de inicio del reposo (si conReposo = true)
    }
  ],
  
  // Para INCIDENTES: testigos del evento
  testigos: [
    {
      empleadoId: "emp-002",
      empleadoNombre: "María García"
    }
  ],
  
  imagenes: ["url1", "url2"], // URLs de imágenes en Firebase Storage
  estado: "abierto", // "abierto" | "cerrado"
  createdAt: Timestamp,
  reportadoPor: "admin-uid"
}
```

**Notas importantes:**
- Los accidentes usan el campo `empleadosInvolucrados` con información de días de reposo
- Los incidentes usan el campo `testigos` sin información de reposo
- Cuando un empleado tiene `conReposo: true`, su estado en la colección `empleados` se actualiza a "inactivo"
- Al cerrar un caso de accidente, los empleados con reposo se reactivan automáticamente a "activo"
- Las imágenes se almacenan en Firebase Storage en `accidentes/{accidenteId}/`

**Índices requeridos:**
- Compuesto: `(empresaId ASC, sucursalId ASC, fechaHora DESC)`
- Compuesto: `(sucursalId ASC, fechaHora DESC)`
- Compuesto: `(sucursalId ASC, tipo ASC, fechaHora DESC)`
- Compuesto: `(empresaId ASC, tipo ASC, estado ASC)`

## Queries Comunes

### Empleados
```javascript
// Obtener empleados activos de una sucursal
const empleadosRef = collection(db, 'empleados');
const q = query(
  empleadosRef,
  where('sucursalId', '==', sucursalId),
  where('estado', '==', 'activo'),
  orderBy('nombre', 'asc')
);
```

### Capacitaciones
```javascript
// Obtener capacitaciones activas de una sucursal
const capacitacionesRef = collection(db, 'capacitaciones');
const q = query(
  capacitacionesRef,
  where('sucursalId', '==', sucursalId),
  where('estado', '==', 'activa'),
  orderBy('fechaRealizada', 'desc')
);
```

### Accidentes
```javascript
// Obtener accidentes de una sucursal en un período
const accidentesRef = collection(db, 'accidentes');
const q = query(
  accidentesRef,
  where('sucursalId', '==', sucursalId),
  where('fechaHora', '>=', startDate),
  where('fechaHora', '<=', endDate),
  orderBy('fechaHora', 'desc')
);
```

## Creación de Índices en Firebase Console

1. Ir a Firebase Console > Firestore Database > Indexes
2. Crear los siguientes índices compuestos:

**empleados:**
- Collection ID: `empleados`
- Fields: `empresaId` (Ascending), `sucursalId` (Ascending), `estado` (Ascending)

**capacitaciones:**
- Collection ID: `capacitaciones`
- Fields: `empresaId` (Ascending), `sucursalId` (Ascending), `estado` (Ascending)

- Collection ID: `capacitaciones`
- Fields: `sucursalId` (Ascending), `fechaRealizada` (Descending)

**accidentes:**
- Collection ID: `accidentes`
- Fields: `empresaId` (Ascending), `sucursalId` (Ascending), `fechaHora` (Descending)

- Collection ID: `accidentes`
- Fields: `sucursalId` (Ascending), `tipo` (Ascending), `fechaHora` (Descending)

