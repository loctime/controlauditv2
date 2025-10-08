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
  createdAt: Timestamp,
  createdBy: "admin-uid"
}
```

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

Almacena registro de accidentes e incidentes por sucursal.

**Estructura:**
```javascript
{
  id: "auto-generated",
  empresaId: "17dixBvPWs93vPdn33B3",
  sucursalId: "sucursal-001",
  tipo: "accidente", // "accidente" | "incidente"
  gravedad: "leve", // "leve" | "moderado" | "grave"
  fechaHora: Timestamp,
  lugar: "Sector de producción - Línea 2",
  empleadoId: "emp-001",
  empleadoNombre: "Juan Pérez",
  descripcion: "Corte en mano derecha al manipular herramienta",
  diasPerdidos: 3,
  estado: "cerrado", // "abierto" | "cerrado"
  createdAt: Timestamp,
  reportadoPor: "admin-uid"
}
```

**Índices requeridos:**
- Compuesto: `(empresaId ASC, sucursalId ASC, fechaHora DESC)`
- Compuesto: `(sucursalId ASC, fechaHora DESC)`
- Compuesto: `(sucursalId ASC, tipo ASC, fechaHora DESC)`

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

