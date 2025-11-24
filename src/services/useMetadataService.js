// Servicio centralizado para metadatos de reportes y empresas
// Siempre usar estos helpers para leer/escribir metadatos

/**
 * Extrae el ID de empresa de un reporte, soportando formatos antiguos y nuevos
 */
export function getEmpresaIdFromReporte(reporte) {
  if (!reporte) return undefined;
  if (reporte.empresaId) return reporte.empresaId;
  if (reporte.empresa && typeof reporte.empresa === 'object' && reporte.empresa.id) return reporte.empresa.id;
  if (typeof reporte.empresa === 'string') return reporte.empresa;
  if (reporte.empresaNombre) return reporte.empresaNombre; // fallback
  return undefined;
}

/**
 * Extrae el nombre de empresa de un reporte
 */
export function getEmpresaNombreFromReporte(reporte) {
  if (!reporte) return undefined;
  if (reporte.empresaNombre) return reporte.empresaNombre;
  if (reporte.empresa && typeof reporte.empresa === 'object' && reporte.empresa.nombre) return reporte.empresa.nombre;
  if (typeof reporte.empresa === 'string') return reporte.empresa;
  return undefined;
}

/**
 * Normaliza el campo empresa en un reporte, usando la lista de empresas si es necesario
 */
export function normalizeReporteEmpresa(reporte, empresas = []) {
  const empresaId = getEmpresaIdFromReporte(reporte);
  let empresaObj = empresas.find(e => e.id === empresaId);
  if (!empresaObj && reporte.empresa && typeof reporte.empresa === 'object') {
    empresaObj = reporte.empresa;
  }
  if (!empresaObj && getEmpresaNombreFromReporte(reporte)) {
    empresaObj = { id: empresaId, nombre: getEmpresaNombreFromReporte(reporte) };
  }
  return empresaObj || null;
}

/**
 * Prepara los datos de reporte para guardado, asegurando metadatos consistentes
 */
export function buildReporteMetadata({ empresa, sucursal, formulario, datosReporte, auditoriaAgendadaId, ...rest }) {
  if (!empresa || !empresa.id || !empresa.nombre) {
    console.error('[MetadataService] Empresa inválida al guardar reporte', empresa);
    throw new Error('Empresa inválida');
  }
  if (!formulario || !formulario.id || !formulario.nombre) {
    console.error('[MetadataService] Formulario inválido al guardar reporte', formulario);
    throw new Error('Formulario inválido');
  }
  
  // Expandir campos de datosReporte al nivel superior si existe
  const camposAdicionales = datosReporte ? {
    tareaObservada: datosReporte.tareaObservada || '',
    lugarSector: datosReporte.lugarSector || '',
    equiposInvolucrados: datosReporte.equiposInvolucrados || '',
    supervisor: datosReporte.supervisor || '',
    numeroTrabajadores: datosReporte.numeroTrabajadores || '',
    nombreInspector: datosReporte.nombreInspector || '',
    nombreResponsable: datosReporte.nombreResponsable || ''
  } : {};
  
  return {
    ...rest,
    ...camposAdicionales,
    // Incluir auditoriaAgendadaId si existe (para vincular con auditorías agendadas)
    auditoriaAgendadaId: auditoriaAgendadaId || null, // Expandir campos adicionales al nivel superior
    empresa: { id: empresa.id, nombre: empresa.nombre },
    empresaId: empresa.id,
    empresaNombre: empresa.nombre,
    sucursal: sucursal || '',
    formulario: { id: formulario.id, nombre: formulario.nombre },
    formularioId: formulario.id,
    formularioNombre: formulario.nombre,
  };
}

// Puedes agregar más helpers según crezcan los modelos 