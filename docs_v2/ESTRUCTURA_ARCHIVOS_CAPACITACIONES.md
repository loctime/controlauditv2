# 📁 Estructura Escalable de Archivos de Capacitaciones

## 🎯 Objetivo

Evolucionar la estructura de almacenamiento de archivos de capacitaciones de:
```
/controlaudit/capacitaciones/seguridad/
```

A una estructura escalable:
```
/controlaudit/capacitaciones/{categoria}/{capacitacionId}/
```

Con soporte completo para archivos **legacy** (sin metadata completa) que deben tratarse como "archivos adjuntos" simples.

---

## 🔄 Compatibilidad con Archivos Legacy

### ⚠️ Principio Fundamental

**Los archivos legacy NO tienen metadata completa de capacitación. El sistema debe:**
- ✅ **NO romper** al encontrarlos
- ✅ **NO asumir** estructura nueva
- ✅ **Tratar** legacy como solo "archivos adjuntos"

### 🔍 Detección de Archivos Legacy

```typescript
/**
 * Detecta si un archivo es legacy (sin metadata completa de capacitación)
 */
function esArchivoLegacy(archivo: any): boolean {
  const customFields = archivo.metadata?.customFields;
  
  // Archivo legacy si NO tiene estos campos obligatorios:
  const tieneContextType = customFields?.contextType === 'capacitacion';
  const tieneCategoria = !!customFields?.categoria;
  const tieneTipoArchivo = ['evidencia', 'material', 'certificado'].includes(
    customFields?.tipoArchivo
  );
  
  // Si tiene auditId pero NO tiene estructura nueva, es legacy
  const tieneAuditId = !!customFields?.auditId;
  const tieneEstructuraNueva = tieneContextType && tieneCategoria && tieneTipoArchivo;
  
  return tieneAuditId && !tieneEstructuraNueva;
}
```

### 📦 Manejo Seguro de Archivos Legacy

```typescript
/**
 * Normaliza archivo para uso seguro (legacy o nuevo)
 */
function normalizarArchivoCapacitacion(archivo: any) {
  const esLegacy = esArchivoLegacy(archivo);
  
  if (esLegacy) {
    // Archivo legacy: tratar como adjunto simple
    return {
      id: archivo.id || archivo.fileId,
      shareToken: archivo.shareToken || archivo.metadata?.shareToken,
      nombre: archivo.name || archivo.nombre || 'Archivo adjunto',
      tipo: archivo.mime || archivo.type || 'application/octet-stream',
      size: archivo.size || 0,
      createdAt: archivo.createdAt || archivo.uploadedAt,
      
      // Flags de legacy
      _legacy: true,
      _tipoArchivo: 'adjunto', // Tipo genérico para legacy
      _metadataCompleta: false,
      
      // Metadata mínima disponible (si existe)
      auditId: archivo.metadata?.customFields?.auditId || null,
      companyId: archivo.metadata?.customFields?.companyId || null,
    };
  }
  
  // Archivo nuevo: usar metadata completa
  const customFields = archivo.metadata?.customFields || {};
  return {
    id: archivo.id || archivo.fileId,
    shareToken: archivo.shareToken || archivo.metadata?.shareToken,
    nombre: archivo.name || archivo.nombre,
    tipo: archivo.mime || archivo.type,
    size: archivo.size,
    createdAt: archivo.createdAt || customFields.uploadedAt,
    
    // Metadata completa
    _legacy: false,
    _tipoArchivo: customFields.tipoArchivo,
    _metadataCompleta: true,
    
    // Campos de capacitación
    capacitacionId: customFields.capacitacionId,
    categoria: customFields.categoria,
    tipoArchivo: customFields.tipoArchivo,
    companyId: customFields.companyId,
    sucursalId: customFields.sucursalId,
    tipoCapacitacion: customFields.tipoCapacitacion,
    nombreCapacitacion: customFields.nombreCapacitacion,
    fechaCapacitacion: customFields.fechaCapacitacion,
    registroAsistenciaId: customFields.registroAsistenciaId,
    empleadoIds: customFields.empleadoIds || [],
  };
}
```

---

## 📂 Estructura de Carpetas

### Estructura Nueva (Escalable)

```
ControlAudit/
└── Capacitaciones/
    └── {categoria}/              # Ej: "seguridad", "salud", "operaciones"
        └── {capacitacionId}/     # Carpeta única por capacitación
```

**Nota:** Las subcarpetas por tipo (`evidencias/`, `materiales/`, `certificados/`) son **opcionales** y solo organizativas. La metadata es la fuente de verdad.

### Estructura Legacy (Existente)

```
ControlAudit/
└── Capacitaciones/
    └── seguridad/                # Sin subcarpetas por capacitación
```

Los archivos legacy permanecen en su ubicación original y se tratan como adjuntos simples.

---

## 📋 Metadata para ControlFile

### Metadata Nueva (Completa)

```typescript
interface CapacitacionFileMetadata {
  source: 'navbar';
  customFields: {
    // ═══════════════════════════════════════════════════
    // CAMPOS OBLIGATORIOS
    // ═══════════════════════════════════════════════════
    appName: 'ControlAudit';
    contextType: 'capacitacion';
    capacitacionId: string;
    categoria: string;  // Normalizado: lowercase, sin espacios
    tipoArchivo: 'evidencia' | 'material' | 'certificado';
    companyId: string;
    fechaArchivo: string;  // ISO string
    uploadedBy: string;  // userId
    uploadedAt: string;  // ISO string
    
    // ═══════════════════════════════════════════════════
    // CAMPOS OPCIONALES (Recomendados)
    // ═══════════════════════════════════════════════════
    sucursalId?: string;
    tipoCapacitacion?: 'charla' | 'entrenamiento' | 'capacitacion';
    nombreCapacitacion?: string;
    fechaCapacitacion?: string;  // ISO string
    registroAsistenciaId?: string;
    empleadoIds?: string[];
  };
}
```

### Metadata Legacy (Mínima)

Los archivos legacy pueden tener solo:
```typescript
{
  source: 'navbar',
  customFields: {
    appName: 'ControlAudit',
    auditId: string,  // ID de capacitación (legacy)
    companyId: string,
    fecha: string
    // Sin contextType, categoria, tipoArchivo, etc.
  }
}
```

---

## 🔧 Implementación

### 1. Función para Asegurar Carpeta de Capacitación

```typescript
/**
 * Asegura la estructura de carpetas para una capacitación
 * Maneja tanto estructura nueva como legacy
 */
async function ensureCapacitacionFolder(
  capacitacionId: string,
  categoria: string,
  tipoArchivo?: 'evidencia' | 'material' | 'certificado'
): Promise<string | null> {
  try {
    // 1. Carpeta principal ControlAudit
    const mainFolderId = await ensureTaskbarFolder('ControlAudit');
    if (!mainFolderId) {
      throw new Error('No se pudo crear carpeta principal ControlAudit');
    }
    
    // 2. Carpeta Capacitaciones
    const capacitacionesFolderId = await ensureSubFolder(
      'Capacitaciones',
      mainFolderId
    );
    if (!capacitacionesFolderId) {
      throw new Error('No se pudo crear carpeta Capacitaciones');
    }
    
    // 3. Normalizar categoría
    const categoriaNormalizada = categoria.toLowerCase().trim();
    
    // 4. Carpeta por categoría
    const categoriaFolderId = await ensureSubFolder(
      categoriaNormalizada,
      capacitacionesFolderId
    );
    if (!categoriaFolderId) {
      throw new Error(`No se pudo crear carpeta categoría: ${categoria}`);
    }
    
    // 5. Carpeta por capacitacionId (única por capacitación)
    const capacitacionFolderId = await ensureSubFolder(
      capacitacionId,
      categoriaFolderId
    );
    if (!capacitacionFolderId) {
      throw new Error(`No se pudo crear carpeta capacitación: ${capacitacionId}`);
    }
    
    return capacitacionFolderId;
  } catch (error) {
    console.error('Error al asegurar carpeta de capacitación:', error);
    return null;
  }
}
```

### 2. Función de Subida con Metadata Completa

```typescript
/**
 * Sube archivo de capacitación con metadata completa
 * Solo para archivos nuevos (no legacy)
 */
async function uploadCapacitacionFile({
  file,
  capacitacionId,
  categoria,
  tipoArchivo,
  companyId,
  sucursalId,
  tipoCapacitacion,
  nombreCapacitacion,
  fechaCapacitacion,
  registroAsistenciaId,
  empleadoIds
}: {
  file: File;
  capacitacionId: string;
  categoria: string;
  tipoArchivo: 'evidencia' | 'material' | 'certificado';
  companyId: string;
  sucursalId?: string;
  tipoCapacitacion?: 'charla' | 'entrenamiento' | 'capacitacion';
  nombreCapacitacion?: string;
  fechaCapacitacion?: string;
  registroAsistenciaId?: string;
  empleadoIds?: string[];
}): Promise<{ fileId: string; shareToken: string; metadata: any }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  
  // 1. Validar tipo de archivo
  validarTipoArchivo(tipoArchivo, file);
  
  // 2. Normalizar categoría
  const categoriaNormalizada = categoria.toLowerCase().trim();
  
  // 3. Asegurar estructura de carpetas
  const parentFolderId = await ensureCapacitacionFolder(
    capacitacionId,
    categoriaNormalizada,
    tipoArchivo
  );
  
  if (!parentFolderId) {
    throw new Error('No se pudo crear estructura de carpetas');
  }
  
  // 4. Preparar metadata completa
  const metadata = {
    source: 'navbar',
    customFields: {
      // Obligatorios
      appName: 'ControlAudit',
      contextType: 'capacitacion',
      capacitacionId,
      categoria: categoriaNormalizada,
      tipoArchivo,
      companyId,
      fechaArchivo: new Date().toISOString(),
      uploadedBy: user.uid,
      uploadedAt: new Date().toISOString(),
      
      // Opcionales pero recomendados
      ...(sucursalId && { sucursalId }),
      ...(tipoCapacitacion && { tipoCapacitacion }),
      ...(nombreCapacitacion && { nombreCapacitacion }),
      ...(fechaCapacitacion && { fechaCapacitacion }),
      ...(registroAsistenciaId && { registroAsistenciaId }),
      ...(empleadoIds && empleadoIds.length > 0 && { empleadoIds })
    }
  };
  
  // 5. Subir usando servicio existente con metadata extendida
  // ⚠️ NOTA: Necesitaríamos extender uploadEvidence o crear función específica
  // que use getPresignedUrl directamente con metadata personalizada
  
  const result = await uploadEvidence({
    file,
    auditId: capacitacionId, // Compatibilidad con sistema existente
    companyId,
    parentId: parentFolderId,
    fecha: new Date()
  });
  
  // 6. Actualizar metadata del archivo en ControlFile
  // Esto requeriría una función adicional para actualizar metadata después de la subida
  
  return {
    fileId: result.fileId,
    shareToken: result.shareToken,
    metadata
  };
}
```

### 3. Función para Obtener Archivos (Legacy + Nuevos)

```typescript
/**
 * Obtiene archivos de una capacitación
 * Maneja tanto archivos legacy como nuevos de forma segura
 */
async function obtenerArchivosCapacitacion(
  capacitacionId: string,
  userId: string
): Promise<Array<{
  id: string;
  shareToken: string;
  nombre: string;
  tipo: string;
  size: number;
  createdAt: any;
  _legacy: boolean;
  _tipoArchivo: string;
  [key: string]: any;
}>> {
  try {
    // Query 1: Archivos nuevos (con metadata completa)
    const queryNuevos = query(
      collection(db, 'files'),
      where('metadata.customFields.capacitacionId', '==', capacitacionId),
      where('metadata.customFields.contextType', '==', 'capacitacion'),
      where('userId', '==', userId),
      where('deletedAt', '==', null)
    );
    
    const nuevosSnapshot = await getDocs(queryNuevos);
    const archivosNuevos = nuevosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Query 2: Archivos legacy (solo con auditId, sin estructura nueva)
    const queryLegacy = query(
      collection(db, 'files'),
      where('metadata.customFields.auditId', '==', capacitacionId),
      where('metadata.customFields.appName', '==', 'ControlAudit'),
      where('userId', '==', userId),
      where('deletedAt', '==', null)
    );
    
    const legacySnapshot = await getDocs(queryLegacy);
    const archivosLegacy = legacySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(archivo => esArchivoLegacy(archivo)); // Filtrar solo legacy
    
    // Combinar y normalizar
    const todosArchivos = [
      ...archivosNuevos.map(normalizarArchivoCapacitacion),
      ...archivosLegacy.map(normalizarArchivoCapacitacion)
    ];
    
    return todosArchivos;
  } catch (error) {
    console.error('Error al obtener archivos de capacitación:', error);
    return [];
  }
}
```

### 4. Visualización Segura de Archivos

```typescript
/**
 * Componente para mostrar archivos de capacitación
 * Maneja legacy y nuevos de forma transparente
 */
function ListaArchivosCapacitacion({ capacitacionId, userId }) {
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cargarArchivos = async () => {
      setLoading(true);
      try {
        const archivosData = await obtenerArchivosCapacitacion(
          capacitacionId,
          userId
        );
        setArchivos(archivosData);
      } catch (error) {
        console.error('Error cargando archivos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarArchivos();
  }, [capacitacionId, userId]);
  
  if (loading) return <CircularProgress />;
  
  return (
    <Stack spacing={2}>
      {archivos.map((archivo) => (
        <Paper key={archivo.id} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1">
                {archivo.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {archivo._legacy ? (
                  <>
                    <Chip label="Archivo adjunto" size="small" color="default" />
                    {' • '}
                    Archivo legacy
                  </>
                ) : (
                  <>
                    <Chip 
                      label={archivo.tipoArchivo} 
                      size="small" 
                      color={
                        archivo.tipoArchivo === 'evidencia' ? 'primary' :
                        archivo.tipoArchivo === 'certificado' ? 'success' : 'info'
                      } 
                    />
                    {' • '}
                    {archivo.categoria}
                  </>
                )}
              </Typography>
            </Box>
            
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => descargarArchivo(archivo.shareToken)}
            >
              Descargar
            </Button>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}
```

---

## 🔍 Tipos de Archivos

### Tipos Definidos

```typescript
type TipoArchivoCapacitacion = 'evidencia' | 'material' | 'certificado';

const TIPOS_ARCHIVO = {
  evidencia: {
    descripcion: 'Fotografías y documentos que evidencian la realización',
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    requerido: true
  },
  material: {
    descripcion: 'Material didáctico utilizado en la capacitación',
    mimeTypes: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    maxSize: 100 * 1024 * 1024, // 100MB
    requerido: false
  },
  certificado: {
    descripcion: 'Certificados de asistencia o aprobación',
    mimeTypes: ['application/pdf', 'image/*'],
    maxSize: 10 * 1024 * 1024, // 10MB
    requerido: false
  }
};
```

### Tipo Legacy

Los archivos legacy se tratan como:
```typescript
{
  tipoArchivo: 'adjunto',  // Tipo genérico
  _legacy: true,
  _metadataCompleta: false
}
```

---

## 📊 Queries para Reportes

### Query 1: Evidencias de una Capacitación

```typescript
const queryEvidencias = query(
  collection(db, 'files'),
  where('metadata.customFields.capacitacionId', '==', capacitacionId),
  where('metadata.customFields.tipoArchivo', '==', 'evidencia'),
  where('metadata.customFields.contextType', '==', 'capacitacion'),
  where('deletedAt', '==', null)
);
```

### Query 2: Archivos por Categoría

```typescript
const queryPorCategoria = query(
  collection(db, 'files'),
  where('metadata.customFields.categoria', '==', 'seguridad'),
  where('metadata.customFields.contextType', '==', 'capacitacion'),
  where('metadata.customFields.companyId', '==', companyId),
  where('deletedAt', '==', null)
);
```

### Query 3: Archivos Legacy (Solo para Auditoría)

```typescript
// ⚠️ Solo para reportes de migración, NO para uso normal
const queryLegacy = query(
  collection(db, 'files'),
  where('metadata.customFields.appName', '==', 'ControlAudit'),
  where('metadata.customFields.auditId', '!=', null),
  where('metadata.customFields.contextType', '!=', 'capacitacion'), // Sin estructura nueva
  where('deletedAt', '==', null)
);
```

---

## 🚨 Reglas de Seguridad

### ✅ Permitido

1. **Leer archivos legacy** como adjuntos simples
2. **Mostrar archivos legacy** sin metadata completa
3. **Subir archivos nuevos** con metadata completa
4. **Coexistencia** de archivos legacy y nuevos

### ❌ Prohibido

1. **Asumir metadata** en archivos legacy
2. **Filtrar por campos** que no existen en legacy
3. **Romper el sistema** si encuentra archivos legacy
4. **Migrar automáticamente** archivos legacy sin consentimiento

---

## 📝 Resumen

### Archivos Nuevos
- ✅ Metadata completa con `contextType: 'capacitacion'`
- ✅ Estructura de carpetas: `/{categoria}/{capacitacionId}/`
- ✅ Tipos definidos: `evidencia`, `material`, `certificado`
- ✅ Queries eficientes para reportes

### Archivos Legacy
- ✅ Tratados como "archivos adjuntos" simples
- ✅ Sin metadata completa (solo `auditId`, `companyId`)
- ✅ Ubicación original preservada
- ✅ Sistema NO rompe al encontrarlos
- ✅ Visualización básica sin campos avanzados

### Compatibilidad
- ✅ Coexistencia segura de ambos tipos
- ✅ Detección automática de legacy
- ✅ Normalización transparente para UI
- ✅ Queries separadas para cada tipo
