/**
 * Utilidades para manejo seguro de archivos de capacitaciones
 * Soporta archivos nuevos (con metadata completa) y legacy (sin metadata completa)
 * 
 * PRINCIPIO: Los archivos legacy se tratan como "archivos adjuntos" simples
 * - NO romper el sistema
 * - NO asumir estructura nueva
 * - Tratar legacy como solo archivos adjuntos
 */

/**
 * Detecta si un archivo es legacy (sin metadata completa de capacitación)
 * 
 * @param {Object} archivo - Archivo de ControlFile
 * @returns {boolean} true si es archivo legacy
 */
export function esArchivoLegacy(archivo) {
  if (!archivo || !archivo.metadata) {
    return false;
  }

  const customFields = archivo.metadata.customFields || {};
  
  // Archivo nuevo tiene estos campos obligatorios (nuevo modelo):
  const tieneContextType = customFields.contextType === 'capacitacion';
  const tieneCapacitacionTipoId = !!customFields.capacitacionTipoId;
  const tieneCapacitacionEventoId = !!(customFields.capacitacionEventoId || customFields.capacitacionId);
  const tieneTipoArchivo = ['evidencia', 'material', 'certificado'].includes(
    customFields.tipoArchivo
  );
  
  // Estructura nueva completa (nuevo modelo)
  const tieneEstructuraNueva = tieneContextType && tieneCapacitacionTipoId && tieneCapacitacionEventoId && tieneTipoArchivo;
  
  // Si tiene auditId pero NO tiene estructura nueva, es legacy
  const tieneAuditId = !!customFields.auditId;
  const esDeControlAudit = customFields.appName === 'ControlAudit';
  
  // Es legacy si:
  // 1. Es de ControlAudit
  // 2. Tiene auditId (probablemente capacitación)
  // 3. NO tiene estructura nueva completa
  return esDeControlAudit && tieneAuditId && !tieneEstructuraNueva;
}

/**
 * Normaliza archivo para uso seguro (legacy o nuevo)
 * 
 * @param {Object} archivo - Archivo de ControlFile (raw)
 * @returns {Object} Archivo normalizado con flags de legacy
 */
export function normalizarArchivoCapacitacion(archivo) {
  if (!archivo) {
    return null;
  }

  const esLegacy = esArchivoLegacy(archivo);
  const customFields = archivo.metadata?.customFields || {};
  
  // Estructura base común
  const archivoBase = {
    id: archivo.id || archivo.fileId,
    shareToken: archivo.shareToken || customFields.shareToken,
    nombre: archivo.name || archivo.nombre || 'Archivo adjunto',
    tipo: archivo.mime || archivo.type || 'application/octet-stream',
    size: archivo.size || 0,
    createdAt: archivo.createdAt || customFields.uploadedAt || customFields.fecha,
    
    // Metadata de ControlFile
    fileId: archivo.id || archivo.fileId,
    parentId: archivo.parentId,
    userId: archivo.userId,
  };
  
  if (esLegacy) {
    // Archivo legacy: tratar como adjunto simple
    return {
      ...archivoBase,
      
      // Flags de legacy
      _legacy: true,
      _tipoArchivo: 'adjunto', // Tipo genérico para legacy
      _metadataCompleta: false,
      
      // Metadata mínima disponible (si existe)
      auditId: customFields.auditId || null,
      companyId: customFields.companyId || null,
      fecha: customFields.fecha || null,
      
      // Campos de capacitación NO disponibles en legacy
      capacitacionTipoId: null,
      capacitacionEventoId: customFields.auditId || null, // Usar auditId como fallback
      tipoArchivo: null,
      sucursalId: null,
      tipoCapacitacion: null,
      nombreCapacitacion: null,
      fechaCapacitacion: null,
      registroAsistenciaId: null,
      empleadoIds: [],
      
      // Compatibilidad legacy (deprecated)
      capacitacionId: customFields.auditId || null,
      categoria: null, // Eliminado del modelo
    };
  }
  
  // Archivo nuevo: usar metadata completa
  return {
    ...archivoBase,
    
    // Flags de nuevo
    _legacy: false,
    _tipoArchivo: customFields.tipoArchivo,
    _metadataCompleta: true,
    
    // Campos de capacitación (metadata completa - nuevo modelo)
    capacitacionTipoId: customFields.capacitacionTipoId || null,
    capacitacionEventoId: customFields.capacitacionEventoId || customFields.capacitacionId || null, // Compatibilidad con campo antiguo
    tipoArchivo: customFields.tipoArchivo,
    companyId: customFields.companyId,
    sucursalId: customFields.sucursalId || null,
    tipoCapacitacion: customFields.tipoCapacitacion || null,
    nombreCapacitacion: customFields.nombreCapacitacion || null,
    fechaCapacitacion: customFields.fechaCapacitacion || null,
    registroAsistenciaId: customFields.registroAsistenciaId || null,
    empleadoIds: customFields.empleadoIds || [],
    
    // Metadata adicional
    uploadedBy: customFields.uploadedBy,
    uploadedAt: customFields.uploadedAt,
    fechaArchivo: customFields.fechaArchivo,
    
    // Compatibilidad legacy (deprecated)
    capacitacionId: customFields.capacitacionEventoId || customFields.capacitacionId || null,
    categoria: null, // Eliminado del modelo nuevo
  };
}

/**
 * Filtra archivos por tipo (solo archivos nuevos, legacy se excluyen)
 * 
 * @param {Array} archivos - Array de archivos normalizados
 * @param {string} tipoArchivo - 'evidencia' | 'material' | 'certificado'
 * @returns {Array} Archivos filtrados
 */
export function filtrarPorTipoArchivo(archivos, tipoArchivo) {
  if (!Array.isArray(archivos)) {
    return [];
  }
  
  return archivos.filter(archivo => {
    // Archivos legacy no se filtran por tipo (son 'adjunto')
    if (archivo._legacy) {
      return false;
    }
    
    return archivo.tipoArchivo === tipoArchivo;
  });
}

/**
 * Separa archivos en nuevos y legacy
 * 
 * @param {Array} archivos - Array de archivos normalizados
 * @returns {Object} { nuevos: [], legacy: [] }
 */
export function separarArchivosPorTipo(archivos) {
  if (!Array.isArray(archivos)) {
    return { nuevos: [], legacy: [] };
  }
  
  return archivos.reduce(
    (acc, archivo) => {
      if (archivo._legacy) {
        acc.legacy.push(archivo);
      } else {
        acc.nuevos.push(archivo);
      }
      return acc;
    },
    { nuevos: [], legacy: [] }
  );
}

/**
 * Obtiene el tipo de archivo para mostrar en UI
 * 
 * @param {Object} archivo - Archivo normalizado
 * @returns {string} Tipo de archivo legible
 */
export function obtenerTipoArchivoLegible(archivo) {
  if (!archivo) {
    return 'Desconocido';
  }
  
  if (archivo._legacy) {
    return 'Archivo adjunto';
  }
  
  const tipos = {
    evidencia: 'Evidencia',
    material: 'Material',
    certificado: 'Certificado',
  };
  
  return tipos[archivo.tipoArchivo] || 'Archivo';
}

/**
 * Obtiene el color del chip según tipo de archivo
 * 
 * @param {Object} archivo - Archivo normalizado
 * @returns {string} Color para Material-UI Chip
 */
export function obtenerColorTipoArchivo(archivo) {
  if (!archivo || archivo._legacy) {
    return 'default';
  }
  
  const colores = {
    evidencia: 'primary',
    material: 'info',
    certificado: 'success',
  };
  
  return colores[archivo.tipoArchivo] || 'default';
}

/**
 * Valida que un archivo tenga la estructura mínima necesaria
 * 
 * @param {Object} archivo - Archivo normalizado
 * @returns {boolean} true si es válido
 */
export function esArchivoValido(archivo) {
  if (!archivo) {
    return false;
  }
  
  // Debe tener al menos ID y shareToken
  const tieneId = !!(archivo.id || archivo.fileId);
  const tieneShareToken = !!archivo.shareToken;
  
  return tieneId && tieneShareToken;
}

/**
 * Convierte shareToken a URL de visualización
 * 
 * @param {string} shareToken - Token del archivo
 * @returns {string} URL de visualización
 */
export function convertirShareTokenAUrl(shareToken) {
  if (!shareToken || typeof shareToken !== 'string') {
    return null;
  }
  
  // Si ya es una URL, retornarla
  if (shareToken.startsWith('http')) {
    return shareToken;
  }
  
  // Convertir shareToken a URL de ControlFile
  return `https://files.controldoc.app/api/shares/${shareToken}/image`;
}

/**
 * Convierte shareToken a URL de descarga
 * 
 * @param {string} shareToken - Token del archivo
 * @returns {string} URL de descarga
 */
export function convertirShareTokenAUrlDescarga(shareToken) {
  if (!shareToken || typeof shareToken !== 'string') {
    return null;
  }
  
  // Si ya es una URL, retornarla
  if (shareToken.startsWith('http')) {
    return shareToken;
  }
  
  // Convertir shareToken a URL de descarga de ControlFile
  return `https://files.controldoc.app/api/shares/${shareToken}/download`;
}

/**
 * Obtiene metadata legible para mostrar en UI
 * 
 * @param {Object} archivo - Archivo normalizado
 * @returns {Object} Metadata legible
 */
export function obtenerMetadataLegible(archivo) {
  if (!archivo) {
    return {
      tipo: 'Desconocido',
      capacitacionTipoId: 'N/A',
      fecha: 'N/A',
      metadataCompleta: false,
    };
  }
  
  if (archivo._legacy) {
    return {
      tipo: 'Archivo adjunto',
      capacitacionTipoId: 'N/A',
      fecha: archivo.fecha || archivo.createdAt || 'N/A',
      metadataCompleta: false,
      esLegacy: true,
    };
  }
  
  return {
    tipo: obtenerTipoArchivoLegible(archivo),
    capacitacionTipoId: archivo.capacitacionTipoId || 'N/A',
    capacitacionEventoId: archivo.capacitacionEventoId || archivo.capacitacionId || 'N/A',
    fecha: archivo.fechaCapacitacion || archivo.fechaArchivo || archivo.createdAt || 'N/A',
    metadataCompleta: true,
    esLegacy: false,
    tipoCapacitacion: archivo.tipoCapacitacion || null,
    nombreCapacitacion: archivo.nombreCapacitacion || null,
    companyId: archivo.companyId || null,
    sucursalId: archivo.sucursalId || null,
  };
}
