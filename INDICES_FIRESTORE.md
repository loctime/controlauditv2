# Índices de Firestore Necesarios

## Instrucciones para Crear Índices

Los índices compuestos son necesarios para que las consultas funcionen correctamente. Sigue estos pasos:

1. Abre la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `auditoria-f9fc4`
3. Ve a **Firestore Database** → **Indexes**
4. Clic en **Create Index**
5. Crea cada uno de los siguientes índices

---

## Índices para `empleados`

### Índice 1: Consulta por sucursal y estado
- **Collection ID:** `empleados`
- **Fields to index:**
  1. `sucursalId` - Ascending
  2. `estado` - Ascending
  3. `nombre` - Ascending

### Índice 2: Consulta por empresa y sucursal
- **Collection ID:** `empleados`
- **Fields to index:**
  1. `empresaId` - Ascending
  2. `sucursalId` - Ascending
  3. `estado` - Ascending

---

## Índices para `capacitaciones`

### Índice 3: Consulta por sucursal y estado
- **Collection ID:** `capacitaciones`
- **Fields to index:**
  1. `sucursalId` - Ascending
  2. `estado` - Ascending
  3. `fechaRealizada` - Descending

### Índice 4: Consulta por sucursal ordenada por fecha
- **Collection ID:** `capacitaciones`
- **Fields to index:**
  1. `sucursalId` - Ascending
  2. `fechaRealizada` - Descending

### Índice 5: Consulta por empresa y sucursal
- **Collection ID:** `capacitaciones`
- **Fields to index:**
  1. `empresaId` - Ascending
  2. `sucursalId` - Ascending
  3. `estado` - Ascending

---

## Índices para `accidentes`

### Índice 6: Consulta por sucursal ordenada por fecha
- **Collection ID:** `accidentes`
- **Fields to index:**
  1. `sucursalId` - Ascending
  2. `fechaHora` - Descending

### Índice 7: Consulta por sucursal, tipo y fecha
- **Collection ID:** `accidentes`
- **Fields to index:**
  1. `sucursalId` - Ascending
  2. `tipo` - Ascending
  3. `fechaHora` - Descending

### Índice 8: Consulta por empresa y sucursal
- **Collection ID:** `accidentes`
- **Fields to index:**
  1. `empresaId` - Ascending
  2. `sucursalId` - Ascending
  3. `fechaHora` - Descending

---

## Índices YA EXISTENTES (que necesitan crear si fallan)

### Para `formularios`
Si ves este error:
```
The query requires an index for collection formularios
```

Crea este índice:
- **Collection ID:** `formularios`
- **Fields to index:**
  1. `clienteAdminId` - Ascending
  2. `timestamp` - Descending

**O haz clic en el enlace del error:**
https://console.firebase.google.com/v1/r/project/auditoria-f9fc4/firestore/indexes?create_composite=ClNwcm9qZWN0cy9hdWRpdG9yaWEtZjlmYzQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2Zvcm11bGFyaW9zL2luZGV4ZXMvXxABGhIKDmNsaWVudGVBZG1pbklkEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg

### Para `logs_operarios`
Si ves este error:
```
The query requires an index for collection logs_operarios
```

Crea este índice:
- **Collection ID:** `logs_operarios`
- **Fields to index:**
  1. `detalles.empresaId` - Ascending
  2. `fecha` - Descending

**O haz clic en el enlace del error:**
https://console.firebase.google.com/v1/r/project/auditoria-f9fc4/firestore/indexes?create_composite=ClZwcm9qZWN0cy9hdWRpdG9yaWEtZjlmYzQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2xvZ3Nfb3BlcmFyaW9zL2luZGV4ZXMvXxABGhYKEmRldGFsbGVzLmVtcHJlc2FJZBABGgkKBWZlY2hhEAIaDAoIX19uYW1lX18QAg

---

## Verificación

Una vez creados los índices:

1. Espera 1-2 minutos a que se completen
2. Recarga el dashboard
3. Verifica que no aparezcan errores de índices en la consola
4. Los datos deberían cargarse correctamente

## Nota Importante

⚠️ **Los índices pueden tardar varios minutos en crearse**, especialmente si ya tienes datos en esas colecciones. No te preocupes si el estado dice "Building" durante un tiempo.

Firebase te enviará un email cuando estén listos.

