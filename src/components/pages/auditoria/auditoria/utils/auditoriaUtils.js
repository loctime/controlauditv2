/**
 * Utilidades para la gestión de auditorías
 * Funciones de validación, progreso y navegación
 */

/**
 * Valida si todas las preguntas han sido contestadas
 * @param {Array} respuestas - Array de respuestas por sección
 * @returns {boolean} - true si todas las preguntas están contestadas
 */
export const todasLasPreguntasContestadas = (respuestas) => {
  return respuestas.every(seccionRespuestas => 
    seccionRespuestas.every(respuesta => respuesta !== '')
  );
};

/**
 * Calcula el progreso de la auditoría
 * @param {Object} params - Parámetros de la auditoría
 * @returns {number} - Porcentaje de progreso (0-100)
 */
export const calcularProgreso = ({
  empresaSeleccionada,
  formularioSeleccionadoId,
  secciones,
  respuestas,
  firmasCompletadas = true // Las firmas son opcionales
}) => {
  let progreso = 0;
  if (empresaSeleccionada) progreso += 25;
  if (formularioSeleccionadoId) progreso += 25;
  if (secciones.length > 0) progreso += 25;
  if (todasLasPreguntasContestadas(respuestas)) progreso += 25;
  return progreso;
};

/**
 * Obtiene el estado de un paso específico
 * @param {number} step - Número del paso
 * @param {Object} params - Parámetros de la auditoría
 * @returns {string} - Estado del paso: 'completed', 'active', 'disabled'
 */
export const getStepStatus = (step, {
  empresaSeleccionada,
  formularioSeleccionadoId,
  secciones,
  respuestas
}) => {
  switch (step) {
    case 0: 
      return empresaSeleccionada ? 'completed' : 'active';
    case 1: 
      return formularioSeleccionadoId ? 'completed' : (empresaSeleccionada ? 'active' : 'disabled');
    case 2: 
      return secciones.length > 0 ? 'completed' : (formularioSeleccionadoId ? 'active' : 'disabled');
    case 3: 
      return todasLasPreguntasContestadas(respuestas) ? 'completed' : (secciones.length > 0 ? 'active' : 'disabled');
    case 4: 
      return true ? 'completed' : (todasLasPreguntasContestadas(respuestas) ? 'active' : 'disabled');
    default: 
      return 'disabled';
  }
};

/**
 * Verifica si un paso está completo
 * @param {number} step - Número del paso
 * @param {Object} params - Parámetros de la auditoría
 * @returns {boolean} - true si el paso está completo
 */
export const pasoCompleto = (step, {
  empresaSeleccionada,
  formularioSeleccionadoId,
  respuestas
}) => {
  switch (step) {
    case 0: 
      return !!empresaSeleccionada;
    case 1: 
      return !!formularioSeleccionadoId;
    case 2: 
      return todasLasPreguntasContestadas(respuestas);
    case 3: 
      return true; // Las firmas son opcionales
    default: 
      return false;
  }
};

/**
 * Obtiene el tipo de ubicación basado en la empresa y sucursal
 * @param {Object} empresaSeleccionada - Empresa seleccionada
 * @param {string} sucursalSeleccionada - Sucursal seleccionada
 * @param {Array} sucursales - Lista de sucursales
 * @returns {string} - Tipo de ubicación
 */
export const obtenerTipoUbicacion = (empresaSeleccionada, sucursalSeleccionada, sucursales) => {
  if (!empresaSeleccionada) return "";
  
  if (sucursales.length === 0) {
    return "Casa Central";
  }
  
  if (sucursalSeleccionada && sucursalSeleccionada !== "Sin sucursal específica") {
    return `Sucursal: ${sucursalSeleccionada}`;
  }
  
  return "Casa Central";
};

/**
 * Valida los datos de la auditoría antes de generar el reporte
 * @param {Object} params - Parámetros de la auditoría
 * @returns {Array} - Array de errores encontrados
 */
export const validarAuditoria = ({
  respuestas,
  firmaAuditor,
  empresaSeleccionada,
  formularioSeleccionadoId
}) => {
  const errores = [];
  
  if (!empresaSeleccionada) {
    errores.push("Debe seleccionar una empresa.");
  }
  
  if (!formularioSeleccionadoId) {
    errores.push("Debe seleccionar un formulario.");
  }
  
  if (!todasLasPreguntasContestadas(respuestas)) {
    errores.push("Por favor, responda todas las preguntas antes de generar el reporte.");
  }
  
  if (!firmaAuditor) {
    errores.push("Por favor, complete la firma del auditor antes de generar el reporte.");
  }
  
  return errores;
};

/**
 * Configura las secciones, respuestas, comentarios e imágenes cuando se selecciona un formulario
 * @param {string} formularioSeleccionadoId - ID del formulario seleccionado
 * @param {Array} formularios - Lista de formularios disponibles
 * @returns {Object} - Objeto con secciones, respuestas, comentarios e imágenes configurados
 */
export const configurarFormulario = (formularioSeleccionadoId, formularios) => {
  const formularioSeleccionado = formularios.find((formulario) => formulario.id === formularioSeleccionadoId);
  
  if (!formularioSeleccionado || !formularioSeleccionado.secciones) {
    return {
      secciones: [],
      respuestas: [],
      comentarios: [],
      imagenes: []
    };
  }

  const seccionesArray = Array.isArray(formularioSeleccionado.secciones)
    ? formularioSeleccionado.secciones
    : Object.values(formularioSeleccionado.secciones);

  return {
    secciones: seccionesArray,
    respuestas: seccionesArray.map(seccion => Array(seccion.preguntas.length).fill('')),
    comentarios: seccionesArray.map(seccion => Array(seccion.preguntas.length).fill('')),
    imagenes: seccionesArray.map(seccion => Array(seccion.preguntas.length).fill(null))
  };
};

/**
 * Filtra las sucursales por empresa
 * @param {Array} sucursales - Lista de todas las sucursales
 * @param {Object} empresaSeleccionada - Empresa seleccionada
 * @returns {Array} - Sucursales filtradas por empresa
 */
export const filtrarSucursalesPorEmpresa = (sucursales, empresaSeleccionada) => {
  if (!empresaSeleccionada) return [];
  
  return sucursales.filter(sucursal => 
    sucursal.empresa === empresaSeleccionada.nombre || 
    sucursal.empresaId === empresaSeleccionada.id
  );
};

/**
 * Verifica si las firmas están completadas
 * @param {string} firmaAuditor - URL de la firma del auditor
 * @param {string} firmaResponsable - URL de la firma del responsable
 * @returns {boolean} - true si las firmas están completadas
 */
export const verificarFirmasCompletadas = (firmaAuditor, firmaResponsable) => {
  // Las firmas son opcionales - siempre considerar como completadas
  return true;
};

/**
 * Genera un hash simple para detectar cambios en la auditoría
 * @param {Object} datos - Datos de la auditoría
 * @returns {string} - Hash en base64
 */
export const generarHashAuditoria = (datos) => {
  const datosHash = {
    empresa: datos.empresa?.id,
    sucursal: datos.sucursal,
    formulario: datos.formulario,
    respuestas: JSON.stringify(datos.respuestas),
    comentarios: JSON.stringify(datos.comentarios),
    imagenes: datos.imagenes.length // Solo contamos cantidad, no contenido
  };
  return btoa(JSON.stringify(datosHash));
};
