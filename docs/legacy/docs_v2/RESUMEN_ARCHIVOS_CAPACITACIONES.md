# 📋 Resumen: Manejo Seguro de Archivos de Capacitaciones

## ✅ Implementación Completada

### 📁 Archivos Creados/Modificados

1. **`docs_v2/ESTRUCTURA_ARCHIVOS_CAPACITACIONES.md`**
   - Documentación completa de la estructura propuesta
   - Especificación de metadata para archivos nuevos
   - Manejo seguro de archivos legacy
   - Ejemplos de queries y uso

2. **`src/utils/capacitacionFileUtils.js`** ⭐ NUEVO
   - Funciones de detección de archivos legacy
   - Normalización segura de archivos
   - Utilidades para UI y reportes
   - Manejo de shareTokens

3. **`src/services/capacitacionImageService.js`** ⭐ ACTUALIZADO
   - Nuevas funciones para obtener archivos (nuevos + legacy)
   - Separación segura de archivos por tipo
   - Compatibilidad hacia atrás garantizada

---

## 🔑 Características Principales

### ✅ Compatibilidad con Legacy

**Principio fundamental:**
- ✅ **NO romper** el sistema al encontrar archivos legacy
- ✅ **NO asumir** estructura nueva en archivos legacy
- ✅ **Tratar** legacy como solo "archivos adjuntos"

### 🔍 Detección Automática

```javascript
import { esArchivoLegacy, normalizarArchivoCapacitacion } from '../utils/capacitacionFileUtils';

// Detectar si es legacy
const esLegacy = esArchivoLegacy(archivo);

// Normalizar de forma segura
const archivoNormalizado = normalizarArchivoCapacitacion(archivo);
```

### 📦 Estructura de Archivos Normalizados

**Archivos Nuevos:**
```javascript
{
  id: "file-123",
  shareToken: "abc123...",
  nombre: "evidencia.jpg",
  tipoArchivo: "evidencia", // 'evidencia' | 'material' | 'certificado'
  categoria: "seguridad",
  capacitacionId: "cap-001",
  _legacy: false,
  _metadataCompleta: true,
  // ... más campos
}
```

**Archivos Legacy:**
```javascript
{
  id: "file-456",
  shareToken: "xyz789...",
  nombre: "archivo-adjunto.pdf",
  tipoArchivo: null,
  categoria: null,
  capacitacionId: "cap-001", // Usa auditId como fallback
  _legacy: true,
  _tipoArchivo: "adjunto", // Tipo genérico
  _metadataCompleta: false,
  // Solo campos básicos disponibles
}
```

---

## 🚀 Uso en Componentes

### Ejemplo: Obtener Archivos de Capacitación

```javascript
import capacitacionImageService from '../services/capacitacionImageService';

// Obtener todos los archivos (nuevos + legacy)
const archivos = await capacitacionImageService.getArchivosCapacitacion(
  capacitacionId,
  userId
);

// Separar por tipo
import { separarArchivosPorTipo } from '../utils/capacitacionFileUtils';
const { nuevos, legacy } = separarArchivosPorTipo(archivos);
```

### Ejemplo: Mostrar en UI

```javascript
import { 
  obtenerTipoArchivoLegible,
  obtenerColorTipoArchivo,
  convertirShareTokenAUrl
} from '../utils/capacitacionFileUtils';

{archivos.map(archivo => (
  <Paper>
    <Chip 
      label={obtenerTipoArchivoLegible(archivo)}
      color={obtenerColorTipoArchivo(archivo)}
    />
    {archivo._legacy && (
      <Chip label="Legacy" size="small" color="default" />
    )}
    <img src={convertirShareTokenAUrl(archivo.shareToken)} />
  </Paper>
))}
```

---

## 📊 Queries Disponibles

### Obtener Todos los Archivos
```javascript
const archivos = await capacitacionImageService.getArchivosCapacitacion(
  capacitacionId,
  userId
);
```

### Solo Archivos Nuevos
```javascript
const nuevos = await capacitacionImageService.getArchivosNuevos(
  capacitacionId,
  userId
);
```

### Solo Archivos Legacy
```javascript
const legacy = await capacitacionImageService.getArchivosLegacy(
  capacitacionId,
  userId
);
```

### Filtrar por Tipo (Solo Nuevos)
```javascript
import { filtrarPorTipoArchivo } from '../utils/capacitacionFileUtils';

const evidencias = filtrarPorTipoArchivo(archivos, 'evidencia');
const materiales = filtrarPorTipoArchivo(archivos, 'material');
const certificados = filtrarPorTipoArchivo(archivos, 'certificado');
```

---

## ⚠️ Reglas de Seguridad

### ✅ Permitido

1. **Leer archivos legacy** como adjuntos simples
2. **Mostrar archivos legacy** sin metadata completa
3. **Coexistencia** de archivos legacy y nuevos
4. **Filtrar archivos nuevos** por tipo, categoría, etc.

### ❌ Prohibido

1. **Asumir metadata** en archivos legacy
2. **Filtrar legacy** por campos que no existen
3. **Romper el sistema** si encuentra legacy
4. **Migrar automáticamente** sin consentimiento

---

## 🔄 Migración Futura (Opcional)

Cuando se decida migrar archivos legacy a la nueva estructura:

1. **No automático**: Requiere consentimiento explícito
2. **Batch processing**: Procesar en lotes pequeños
3. **Validación**: Verificar metadata antes de migrar
4. **Rollback**: Capacidad de revertir cambios

**Ejemplo de migración (futuro):**
```javascript
// ⚠️ NO IMPLEMENTADO - Solo ejemplo conceptual
async function migrarArchivoLegacy(archivoLegacy, capacitacionData) {
  // 1. Validar datos de capacitación
  // 2. Crear metadata completa
  // 3. Mover a nueva estructura de carpetas
  // 4. Actualizar metadata en ControlFile
  // 5. Marcar como migrado
}
```

---

## 📝 Próximos Pasos Recomendados

1. **Actualizar componentes existentes** para usar nuevas funciones
2. **Agregar indicadores visuales** para archivos legacy
3. **Implementar estructura nueva** en subidas futuras
4. **Documentar proceso de migración** (cuando sea necesario)

---

## 🎯 Resumen Ejecutivo

✅ **Sistema robusto** que maneja archivos legacy sin romper
✅ **Detección automática** de archivos legacy vs nuevos
✅ **Normalización segura** para uso en UI y reportes
✅ **Compatibilidad garantizada** hacia atrás
✅ **Preparado para escalar** con estructura nueva

**Los archivos legacy se tratan como "archivos adjuntos" simples y el sistema funciona correctamente con ambos tipos.**
