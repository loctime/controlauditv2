# Modelo de Contexto de Evento - Iteración 1

## Objetivo

Implementar un modelo unificado de organización y subida de archivos basado en "contexto de evento", reemplazando la lógica específica por módulo con un sistema centralizado.

## Arquitectura

### Concepto Principal

Los archivos NO se organizan por módulo (capacitaciones, accidentes, incidentes), sino que pertenecen a un **contexto de evento** definido por:

- `contextType`: Tipo de contexto (`capacitacion`, `accidente`, `incidente`, `salud`)
- `contextEventId`: ID del evento específico
- `companyId`: ID de la empresa
- `tipoArchivo`: Tipo de archivo (definido por contexto)
- `sucursalId`: Opcional según contexto

### Estructura de Carpetas

```
ControlAudit/
└── Archivos/
    └── {contextType}/
        └── {contextEventId}/
            └── {companyId}/           (opcional según contexto)
                └── {sucursalId}/      (opcional según contexto)
                    └── {tipoArchivo}/
```

## Componentes Implementados

### 1. Tipos TypeScript (`src/types/fileContext.ts`)

Define los tipos básicos:
- `ContextType`: Union type de contextos válidos
- `FileContext`: Interfaz del contexto de archivo
- `FileUploadParams`: Parámetros de subida
- `FileUploadResult`: Resultado de subida

### 2. Resolver de Carpetas (`src/services/contextFolderResolver.ts`)

Función principal: `resolveContextFolder(context: FileContext)`

- Resuelve la estructura completa de carpetas según el contexto
- Valida campos requeridos según configuración
- Cachea resoluciones en memoria
- Retorna `parentId` de la carpeta final

**Configuración por contexto:**

```typescript
const CONTEXT_CONFIG = {
  capacitacion: {
    requiresCompanyId: true,
    requiresSucursalId: true,
    requiresTipoArchivo: true,
    validTiposArchivo: ['evidencia', 'material', 'certificado']
  },
  accidente: {
    requiresCompanyId: true,
    requiresSucursalId: false,
    requiresTipoArchivo: true,
    validTiposArchivo: ['evidencia', 'informe', 'fotografia']
  },
  // ... otros contextos
};
```

### 3. Servicio Unificado de Subida (`src/services/unifiedFileUploadService.ts`)

Función principal: `uploadFileWithContext(params: FileUploadParams)`

**Flujo:**
1. Validación básica inline (tipos, campos requeridos)
2. Resolver carpeta destino usando `resolveContextFolder()`
3. Construir metadata plana (no anidada)
4. Llamar a `uploadEvidence()` con metadata extendida
5. Retornar resultado con `fileId` y `shareToken`

### 4. Metadata Plana

La metadata se guarda de forma plana (no anidada) en Firestore:

```typescript
{
  metadata: {
    source: 'navbar',
    appName: 'ControlAudit',
    contextType: 'capacitacion',
    contextEventId: string,
    companyId: string,
    tipoArchivo: string,
    uploadedBy: string,
    uploadedAt: string,
    fecha: string,
    // Opcionales según contexto
    sucursalId?: string,
    capacitacionTipoId?: string,
    empleadoIds?: string[]
  }
}
```

**Ventajas:**
- Queries más simples en Firestore
- Debugging más fácil
- Compatible con índices simples

### 5. Modificación de `uploadEvidence()`

Se extendió `uploadEvidence()` en `controlFileB2Service.ts` para aceptar `metadata` plana como parámetro opcional:

- Si `metadata` está presente: usar directamente (nuevo modelo)
- Si no: construir metadata anidada como antes (compatibilidad legacy)

### 6. Migración de Servicios Existentes

#### Capacitaciones (`capacitacionImageService.js`)

- Función `uploadImageNew()`: Usa `uploadFileWithContext()`
- Función `uploadImage()`: Wrapper que llama a `uploadImageNew()` con fallback legacy
- Mantiene compatibilidad total con código existente

#### Accidentes (`accidenteService.js`)

- Función `subirImagenesNew()`: Usa `uploadFileWithContext()`
- Función `subirImagenes()`: Wrapper que llama a `subirImagenesNew()` con fallback legacy
- Mantiene compatibilidad total con código existente

### 7. Inicialización (`controlFileInit.js`)

Se agregó creación de carpeta `Archivos` en la inicialización:
- Carpeta `Archivos` creada automáticamente
- Carpetas legacy (`Accidentes`, `Capacitaciones`) mantenidas para compatibilidad

## Validación (Iteración 1)

Solo validaciones básicas:
- `contextType` válido
- `contextEventId` no vacío
- `tipoArchivo` permitido según contexto
- Campos requeridos según configuración

**NO se valida aún:**
- Existencia en Firestore (postergado a Iteración 2)
- Permisos complejos (postergado a Iteración 2)

## Compatibilidad Legacy

- Funciones existentes siguen funcionando
- Wrappers legacy garantizan compatibilidad total
- Código nuevo y legacy coexisten
- NO se fuerza migración masiva inicial

## Uso

### Ejemplo: Subir archivo de capacitación

```typescript
import { uploadFileWithContext } from './services/unifiedFileUploadService';

const result = await uploadFileWithContext({
  file: myFile,
  context: {
    contextType: 'capacitacion',
    contextEventId: 'cap-123',
    companyId: 'emp-456',
    sucursalId: 'suc-789',
    tipoArchivo: 'evidencia',
    capacitacionTipoId: 'uso-de-matafuegos'
  },
  fecha: new Date(),
  uploadedBy: userId
});

console.log('File ID:', result.fileId);
console.log('Share Token:', result.shareToken);
```

### Ejemplo: Subir archivo de accidente

```typescript
const result = await uploadFileWithContext({
  file: myFile,
  context: {
    contextType: 'accidente',
    contextEventId: 'acc-123',
    companyId: 'emp-456',
    tipoArchivo: 'evidencia'
    // sucursalId no requerido para accidentes
  },
  fecha: new Date()
});
```

## Próximos Pasos (Iteración 2)

- Validador completo con existencia en Firestore
- Queries avanzadas por contexto
- Índices compuestos en Firestore
- Migración de archivos legacy existentes
- Reportes cruzados
- Validación de permisos complejos

## Archivos Creados/Modificados

### Nuevos:
- `src/types/fileContext.ts`
- `src/services/contextFolderResolver.ts`
- `src/services/unifiedFileUploadService.ts`

### Modificados:
- `src/services/controlFileB2Service.ts` - Extendido para metadata plana
- `src/services/capacitacionImageService.js` - Wrapper con nuevo sistema
- `src/services/accidenteService.js` - Wrapper con nuevo sistema
- `src/services/controlFileInit.js` - Agregada carpeta `Archivos`
