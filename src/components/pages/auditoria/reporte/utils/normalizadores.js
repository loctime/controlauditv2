import logger from '@/utils/logger';
// Utilidades de normalización para reportes de auditoría
// Funciones extraídas de ReporteDetallePro.jsx para mejorar mantenibilidad
import { convertirShareTokenAUrl } from '@/utils/imageUtils';
// Normaliza respuestas a `respuestas[seccionIndex][preguntaIndex]`
// Soporta:
// - array 2D clásico: [[...],[...]]
// - array de objetos { seccion, valores: [...] }
// - map Firestore: { "seccion_0_pregunta_0": "...", ... }
export const normalizarRespuestas = (res, secciones = []) => {
  const seccionesArr = Array.isArray(secciones) ? secciones : [];

  const crearMatrizVacia = () => {
    if (seccionesArr.length === 0) return [];
    return seccionesArr.map(s => {
      const preguntas = Array.isArray(s?.preguntas) ? s.preguntas : [];
      return preguntas.map(() => '');
    });
  };

  if (!res) return crearMatrizVacia();

  // Caso: map Firestore con claves `seccion_{i}_pregunta_{j}`
  if (typeof res === 'object' && !Array.isArray(res)) {
    const regex = /^seccion_(\d+)_pregunta_(\d+)$/;
    const keys = Object.keys(res || {});

    // Base alineada a `secciones` si existe
    let matriz = crearMatrizVacia();

    // Si `secciones` vino vacío o no tenemos base, inferimos desde el map
    if (matriz.length === 0) {
      let maxS = -1;
      const maxP = new Map(); // sIdx -> maxPIdx

      keys.forEach((k) => {
        const m = k.match(regex);
        if (!m) return;
        const sIdx = parseInt(m[1], 10);
        const pIdx = parseInt(m[2], 10);
        maxS = Math.max(maxS, sIdx);
        maxP.set(sIdx, Math.max(maxP.get(sIdx) ?? -1, pIdx));
      });

      const numSecciones = maxS + 1;
      matriz = Array.from({ length: numSecciones }, (_, sIdx) => {
        const maxPreg = maxP.get(sIdx) ?? -1;
        const len = maxPreg + 1;
        return Array.from({ length: len }, () => '');
      });
    }

    // Cargar valores (sin romper dimensiones)
    keys.forEach((k) => {
      const m = k.match(regex);
      if (!m) return;
      const sIdx = parseInt(m[1], 10);
      const pIdx = parseInt(m[2], 10);
      const valor = res[k];

      if (!matriz[sIdx]) return;
      if (pIdx < 0) return;

      if (pIdx >= matriz[sIdx].length) {
        matriz[sIdx] = [...matriz[sIdx], ...Array.from({ length: pIdx - matriz[sIdx].length + 1 }, () => '')];
      }

      matriz[sIdx][pIdx] = typeof valor === 'string' ? valor : (valor?.valor ?? '');
    });

    return matriz;
  }

  // Caso: array de objetos {seccion, valores}
  if (Array.isArray(res) && res.length > 0 && res[0] && typeof res[0] === 'object' && Array.isArray(res[0].valores)) {
    return res.map(obj => Array.isArray(obj.valores) ? obj.valores : []);
  }

  // Caso: array anidado clásico
  if (Array.isArray(res)) {
    return res.map(arr => {
      if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
        arr = Object.values(arr);
      }
      return Array.isArray(arr)
        ? arr.map(val =>
            typeof val === "string"
              ? val
              : (val && typeof val === "object" && val.valor)
                ? val.valor
                : ""
          )
        : [];
    });
  }

  // Fallback: nada compatible
  return crearMatrizVacia();
};

// Normaliza empresa
export const normalizarEmpresa = (empresa) => {
  logger.debug('[normalizarEmpresa] entrada:', empresa);
  
  if (empresa && typeof empresa === "object" && empresa.nombre) {
    logger.debug('[normalizarEmpresa] objeto con nombre:', empresa);
    return empresa;
  }
  
  if (typeof empresa === "string" && empresa.trim()) {
    logger.debug('[normalizarEmpresa] string válido:', empresa);
    return { nombre: empresa.trim() };
  }
  
  logger.debug('[normalizarEmpresa] fallback a vacío');
  return { nombre: "Empresa no disponible" };
};

// Normaliza formulario
export const normalizarFormulario = (formulario, nombreForm) => {
  logger.debug('[normalizarFormulario] formulario:', formulario, 'nombreForm:', nombreForm);
  
  if (formulario && typeof formulario === "object" && formulario.nombre) {
    logger.debug('[normalizarFormulario] objeto con nombre:', formulario);
    return formulario;
  }
  
  if (nombreForm && nombreForm.trim()) {
    logger.debug('[normalizarFormulario] usando nombreForm:', nombreForm);
    return { nombre: nombreForm.trim() };
  }
  
  if (typeof formulario === "string" && formulario.trim()) {
    logger.debug('[normalizarFormulario] string válido:', formulario);
    return { nombre: formulario.trim() };
  }
  
  logger.debug('[normalizarFormulario] fallback a vacío');
  return { nombre: "Formulario no disponible" };
};

// Helper global importado desde imageUtils.js

// Normaliza imagenes: array de objetos {seccion, valores: [ ... ]} a array de arrays de urls
export const normalizarImagenes = (imagenesFirestore, secciones) => {
  logger.debug('[normalizarImagenes] imagenesFirestore:', imagenesFirestore);
  logger.debug('[normalizarImagenes] secciones:', secciones);
  
  if (!Array.isArray(imagenesFirestore)) {
    logger.debug('[normalizarImagenes] imagenesFirestore no es array, retornando array vacío');
    return secciones.map(() => []);
  }
  
  // Si es array de objetos {seccion, valores}
  if (imagenesFirestore.length > 0 && imagenesFirestore[0] && typeof imagenesFirestore[0] === 'object' && Array.isArray(imagenesFirestore[0].valores)) {
    logger.debug('[normalizarImagenes] Procesando formato de objetos por sección');
    const resultado = secciones.map((_, idx) => {
      const imgSec = imagenesFirestore.find(img => img.seccion === idx);
      logger.debug(`[normalizarImagenes] Sección ${idx}, imgSec:`, imgSec);
      
      if (!imgSec || !Array.isArray(imgSec.valores)) {
        logger.debug(`[normalizarImagenes] Sección ${idx} no tiene valores válidos`);
        return [];
      }
      
      const imagenesSeccion = imgSec.valores.map(val => {
        logger.debug(`[normalizarImagenes] Procesando valor:`, val);
        
        // ✅ PRIORIDAD 1: Si es un objeto con shareToken, construir URL persistente
        if (val && typeof val === "object" && val.shareToken) {
          const url = `https://files.controldoc.app/api/shares/${val.shareToken}/image`;
          logger.debug(`[normalizarImagenes] Encontrado shareToken en objeto, URL: ${url}`);
          return url;
        }
        
        // ⚠️ COMPATIBILIDAD: Si es un objeto con URL válida (datos antiguos)
        if (val && typeof val === "object" && val.url && typeof val.url === 'string') {
          logger.debug(`[normalizarImagenes] Encontrada URL en objeto: ${val.url}`);
          return val.url;
        } 
        
        // ✅ NUEVO: Si es string, verificar si es shareToken o URL
        if (typeof val === "string") {
          const urlConvertida = convertirShareTokenAUrl(val);
          if (urlConvertida) {
            logger.debug(`[normalizarImagenes] String convertido a URL: ${urlConvertida}`);
            return urlConvertida;
          }
        } 
        
        // Si es "[object Object]", es una imagen corrupta
        else if (typeof val === "string" && val === '[object Object]') {
          logger.warn(`[normalizarImagenes] Imagen corrupta "[object Object]" detectada`);
          return "";
        } 
        
        // Cualquier otro caso
        else {
          logger.debug(`[normalizarImagenes] Valor no válido:`, val);
          return "";
        }
      });
      
      logger.debug(`[normalizarImagenes] Imágenes de sección ${idx}:`, imagenesSeccion);
      return imagenesSeccion;
    });
    
    logger.debug('[normalizarImagenes] Resultado final:', resultado);
    return resultado;
  }
  
  // Si es array de arrays (formato clásico)
  if (Array.isArray(imagenesFirestore[0])) {
    logger.debug('[normalizarImagenes] Procesando formato de arrays anidados');
    const resultado = imagenesFirestore.map((seccionImagenes, idx) => {
      logger.debug(`[normalizarImagenes] Procesando sección ${idx}:`, seccionImagenes);
      if (!Array.isArray(seccionImagenes)) return [];
      
      return seccionImagenes.map(img => {
        // ✅ PRIORIDAD 1: shareToken en objeto
        if (img && typeof img === "object" && img.shareToken) {
          return `https://files.controldoc.app/api/shares/${img.shareToken}/image`;
        }
        // ⚠️ COMPATIBILIDAD: URL en objeto (datos antiguos)
        if (img && typeof img === "object" && img.url && typeof img.url === 'string') {
          return img.url;
        }
        // ✅ NUEVO: Si es string, convertir shareToken a URL
        if (typeof img === "string") {
          const urlConvertida = convertirShareTokenAUrl(img);
          if (urlConvertida) return urlConvertida;
        }
        return "";
      });
    });
    
    logger.debug('[normalizarImagenes] Resultado final (formato clásico):', resultado);
    return resultado;
  }
  
  // Si es un objeto plano con claves numéricas
  if (imagenesFirestore.length > 0 && typeof imagenesFirestore[0] === 'object' && !Array.isArray(imagenesFirestore[0])) {
    logger.debug('[normalizarImagenes] Procesando formato de objeto plano');
    const resultado = secciones.map((_, idx) => {
      const seccionImagenes = imagenesFirestore[idx];
      logger.debug(`[normalizarImagenes] Sección ${idx} del objeto plano:`, seccionImagenes);
      
      if (!seccionImagenes) return [];
      
      if (Array.isArray(seccionImagenes)) {
        return seccionImagenes.map(img => {
          // ✅ PRIORIDAD 1: shareToken
          if (img && typeof img === "object" && img.shareToken) {
            return `https://files.controldoc.app/api/shares/${img.shareToken}/image`;
          }
          // ⚠️ COMPATIBILIDAD: URL (datos antiguos)
          if (img && typeof img === "object" && img.url && typeof img.url === 'string') {
            return img.url;
          } else if (typeof img === "string" && img.trim() !== '' && img !== '[object Object]') {
            return img;
          } else {
            return "";
          }
        });
      } else if (typeof seccionImagenes === 'object') {
        // Si es un objeto con propiedades numéricas
        const imagenes = [];
        Object.keys(seccionImagenes).forEach(key => {
          const img = seccionImagenes[key];
          // ✅ PRIORIDAD 1: shareToken
          if (img && typeof img === "object" && img.shareToken) {
            imagenes.push(`https://files.controldoc.app/api/shares/${img.shareToken}/image`);
          }
          // ⚠️ COMPATIBILIDAD: URL en objeto (datos antiguos)
          else if (img && typeof img === "object" && img.url && typeof img.url === 'string') {
            imagenes.push(img.url);
          }
          // ✅ NUEVO: Si es string, convertir shareToken a URL
          else if (typeof img === "string") {
            const urlConvertida = convertirShareTokenAUrl(img);
            if (urlConvertida) imagenes.push(urlConvertida);
          }
        });
        return imagenes;
      }
      
      return [];
    });
    
    logger.debug('[normalizarImagenes] Resultado final (objeto plano):', resultado);
    return resultado;
  }
  
  // Fallback clásico
  logger.debug('[normalizarImagenes] Usando fallback, retornando arrays vacíos');
  return secciones.map(() => []);
};

// Normaliza comentarios: array de objetos {seccion, valores: [ ... ]} a array de arrays de strings
export const normalizarComentarios = (comentariosFirestore, secciones) => {
  if (!Array.isArray(comentariosFirestore)) return [];
  // Si es array de objetos {seccion, valores}
  if (comentariosFirestore.length > 0 && comentariosFirestore[0] && typeof comentariosFirestore[0] === 'object' && Array.isArray(comentariosFirestore[0].valores)) {
    return secciones.map((_, idx) => {
      const comSec = comentariosFirestore.find(com => com.seccion === idx);
      if (!comSec || !Array.isArray(comSec.valores)) return [];
      return comSec.valores.map(val => typeof val === "string" ? val : "");
    });
  }
  // Fallback clásico
  return secciones.map((_, idx) => []);
};

// Normaliza fecha desde diferentes formatos de Firestore
export const normalizarFecha = (reporte) => {
  logger.debug('[normalizarFecha] reporte.fecha:', reporte.fecha);
  logger.debug('[normalizarFecha] reporte.fechaGuardado:', reporte.fechaGuardado);
  logger.debug('[normalizarFecha] reporte.timestamp:', reporte.timestamp);
  logger.debug('[normalizarFecha] reporte.fechaCreacion:', reporte.fechaCreacion);
  logger.debug('[normalizarFecha] reporte.fechaActualizacion:', reporte.fechaActualizacion);
  
  // Intentar con reporte.fecha (Timestamp de Firestore)
  if (reporte.fecha && reporte.fecha.seconds) {
    const fechaTimestamp = new Date(reporte.fecha.seconds * 1000);
    logger.debug('[normalizarFecha] usando reporte.fecha:', fechaTimestamp);
    return fechaTimestamp.toLocaleDateString('es-ES');
  }
  
  // Intentar con reporte.fechaGuardado (string ISO)
  if (reporte.fechaGuardado) {
    try {
      const fechaGuardado = new Date(reporte.fechaGuardado);
      if (!isNaN(fechaGuardado.getTime())) {
        logger.debug('[normalizarFecha] usando reporte.fechaGuardado:', fechaGuardado);
        return fechaGuardado.toLocaleDateString('es-ES');
      }
    } catch (error) {
      logger.error('[normalizarFecha] error parseando fechaGuardado:', error);
    }
  }
  
  // Intentar con reporte.timestamp
  if (reporte.timestamp && reporte.timestamp.seconds) {
    const fechaTimestamp = new Date(reporte.timestamp.seconds * 1000);
    logger.debug('[normalizarFecha] usando reporte.timestamp:', fechaTimestamp);
    return fechaTimestamp.toLocaleDateString('es-ES');
  }
  
  // Intentar con reporte.fechaCreacion
  if (reporte.fechaCreacion) {
    try {
      const fechaCreacion = new Date(reporte.fechaCreacion);
      if (!isNaN(fechaCreacion.getTime())) {
        logger.debug('[normalizarFecha] usando reporte.fechaCreacion:', fechaCreacion);
        return fechaCreacion.toLocaleDateString('es-ES');
      }
    } catch (error) {
      logger.error('[normalizarFecha] error parseando fechaCreacion:', error);
    }
  }
  
  // Intentar con reporte.fechaActualizacion
  if (reporte.fechaActualizacion) {
    try {
      const fechaActualizacion = new Date(reporte.fechaActualizacion);
      if (!isNaN(fechaActualizacion.getTime())) {
        logger.debug('[normalizarFecha] usando reporte.fechaActualizacion:', fechaActualizacion);
        return fechaActualizacion.toLocaleDateString('es-ES');
      }
    } catch (error) {
      logger.error('[normalizarFecha] error parseando fechaActualizacion:', error);
    }
  }
  
  logger.debug('[normalizarFecha] fallback a fecha actual');
  return new Date().toLocaleDateString('es-ES');
};

// Normaliza empresa usando todos los campos disponibles del reporte
export const normalizarEmpresaCompleta = (reporte) => {
  logger.debug('[normalizarEmpresa] reporte.empresa:', reporte.empresa);
  logger.debug('[normalizarEmpresa] reporte.empresaId:', reporte.empresaId);
  logger.debug('[normalizarEmpresa] reporte.empresaNombre:', reporte.empresaNombre);
  
  // Si tenemos objeto completo
  if (reporte.empresa && typeof reporte.empresa === "object" && reporte.empresa.nombre) {
    return reporte.empresa;
  }
  
  // Si tenemos ID y nombre separados
  if (reporte.empresaId && reporte.empresaNombre) {
    return { id: reporte.empresaId, nombre: reporte.empresaNombre };
  }
  
  // Si solo tenemos nombre
  if (reporte.empresaNombre) {
    return { id: reporte.empresaId || 'unknown', nombre: reporte.empresaNombre };
  }
  
  // Si tenemos string
  if (typeof reporte.empresa === "string" && reporte.empresa.trim()) {
    return { id: reporte.empresaId || 'unknown', nombre: reporte.empresa.trim() };
  }
  
  return { id: 'unknown', nombre: "Empresa no disponible" };
};

// Normaliza clasificaciones: array de objetos {seccion, valores: [ ... ]} a array de arrays de objetos { condicion: boolean, actitud: boolean }
export const normalizarClasificaciones = (clasificacionesFirestore, secciones) => {
  logger.debug('🔍 [normalizarClasificaciones] clasificacionesFirestore:', clasificacionesFirestore);
  logger.debug('🔍 [normalizarClasificaciones] Tipo:', typeof clasificacionesFirestore, Array.isArray(clasificacionesFirestore));
  logger.debug('🔍 [normalizarClasificaciones] secciones:', secciones);
  
  if (!clasificacionesFirestore || (Array.isArray(clasificacionesFirestore) && clasificacionesFirestore.length === 0)) {
    logger.debug('[normalizarClasificaciones] No hay clasificaciones o array vacío, retornando arrays con valores por defecto');
    return secciones.map((seccion) => 
      Array(seccion?.preguntas?.length || 0).fill({ condicion: false, actitud: false })
    );
  }
  
  if (!Array.isArray(clasificacionesFirestore)) {
    // Si es objeto (caso Firestore), convertir a array
    if (clasificacionesFirestore && typeof clasificacionesFirestore === 'object') {
      // Verificar si es un objeto con claves numéricas (formato Firestore)
      const keys = Object.keys(clasificacionesFirestore);
      if (keys.length > 0 && !isNaN(keys[0])) {
        // Es un objeto indexado numéricamente, convertir a array
        clasificacionesFirestore = Object.keys(clasificacionesFirestore)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => clasificacionesFirestore[key]);
      } else {
        clasificacionesFirestore = Object.values(clasificacionesFirestore);
      }
    } else {
      return secciones.map((seccion) => 
        Array(seccion?.preguntas?.length || 0).fill({ condicion: false, actitud: false })
      );
    }
  }
  
  // Si es array de objetos {seccion, valores}
  if (clasificacionesFirestore.length > 0 && clasificacionesFirestore[0] && typeof clasificacionesFirestore[0] === 'object' && clasificacionesFirestore[0].seccion !== undefined && Array.isArray(clasificacionesFirestore[0].valores)) {
    logger.debug('[normalizarClasificaciones] Procesando formato de objetos por sección');
    return secciones.map((_, idx) => {
      const clasSec = clasificacionesFirestore.find(clas => clas.seccion === idx || clas.seccion === idx.toString());
      if (!clasSec || !Array.isArray(clasSec.valores)) {
        return Array(secciones[idx]?.preguntas?.length || 0).fill({ condicion: false, actitud: false });
      }
      return clasSec.valores.map(val => {
        if (val && typeof val === 'object') {
          return {
            condicion: val.condicion === true || val.condicion === 'true' || val.condicion === 1,
            actitud: val.actitud === true || val.actitud === 'true' || val.actitud === 1
          };
        }
        return { condicion: false, actitud: false };
      });
    });
  }
  
  // Si es array de arrays (formato clásico)
  if (clasificacionesFirestore.length > 0 && Array.isArray(clasificacionesFirestore[0])) {
    logger.debug('[normalizarClasificaciones] Procesando formato de arrays anidados');
    return clasificacionesFirestore.map((seccionClasificaciones) => {
      if (!Array.isArray(seccionClasificaciones)) {
        return [];
      }
      return seccionClasificaciones.map(clas => {
        if (clas && typeof clas === 'object') {
          return {
            condicion: clas.condicion === true || clas.condicion === 'true' || clas.condicion === 1,
            actitud: clas.actitud === true || clas.actitud === 'true' || clas.actitud === 1
          };
        }
        return { condicion: false, actitud: false };
      });
    });
  }
  
  // Fallback: retornar arrays vacíos con valores por defecto
  logger.debug('[normalizarClasificaciones] Usando fallback');
  return secciones.map((seccion) => 
    Array(seccion?.preguntas?.length || 0).fill({ condicion: false, actitud: false })
  );
};

// Normaliza formulario usando todos los campos disponibles del reporte
export const normalizarFormularioCompleto = (reporte) => {
  logger.debug('[normalizarFormulario] reporte.formulario:', reporte.formulario);
  logger.debug('[normalizarFormulario] reporte.formularioId:', reporte.formularioId);
  logger.debug('[normalizarFormulario] reporte.formularioNombre:', reporte.formularioNombre);
  logger.debug('[normalizarFormulario] reporte.nombreForm:', reporte.nombreForm);
  
  // Si tenemos objeto completo
  if (reporte.formulario && typeof reporte.formulario === "object" && reporte.formulario.nombre) {
    return reporte.formulario;
  }
  
  // Si tenemos ID y nombre separados
  if (reporte.formularioId && reporte.formularioNombre) {
    return { id: reporte.formularioId, nombre: reporte.formularioNombre };
  }
  
  // Si tenemos nombreForm
  if (reporte.nombreForm && reporte.nombreForm.trim()) {
    return { id: reporte.formularioId || 'unknown', nombre: reporte.nombreForm.trim() };
  }
  
  // Si tenemos formularioNombre
  if (reporte.formularioNombre && reporte.formularioNombre.trim()) {
    return { id: reporte.formularioId || 'unknown', nombre: reporte.formularioNombre.trim() };
  }
  
  // Si tenemos string
  if (typeof reporte.formulario === "string" && reporte.formulario.trim()) {
    return { id: reporte.formularioId || 'unknown', nombre: reporte.formulario.trim() };
  }
  
  return { id: 'unknown', nombre: "Formulario no disponible" };
};

const parseLegacyShareToken = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (!value.startsWith('http://') && !value.startsWith('https://')) return value;
  const match = value.match(/\/shares\/([^/]+)/i);
  return match?.[1] || null;
};

const toFileRef = (value) => {
  if (!value) return null;
  if (value.fileId || value.shareToken) {
    return {
      fileDocId: value.fileDocId || value.id || null,
      fileId: value.fileId || value.shareToken,
      shareToken: value.shareToken || null,
      name: value.name || value.nombre || 'archivo',
      mimeType: value.mimeType || value.tipo || 'application/octet-stream',
      size: value.size || value.tamano || value['tamaño'] || 0,
      status: value.status || 'active',
      questionRef: value.questionRef || null
    };
  }

  if (typeof value === 'string') {
    const shareToken = parseLegacyShareToken(value);
    if (!shareToken) return null;
    return {
      fileDocId: null,
      fileId: shareToken,
      shareToken,
      name: 'archivo_legacy',
      mimeType: 'application/octet-stream',
      size: 0,
      status: 'active',
      questionRef: null
    };
  }

  return null;
};

const hasFilesInMatrix = (matrix = []) =>
  matrix.some((seccion) => Array.isArray(seccion) && seccion.some((pregunta) => Array.isArray(pregunta) && pregunta.length > 0));

const toFilesByQuestionLookup = (filesByQuestion = []) => {
  const byDocId = new Map();
  const byFileId = new Map();

  const seccionesValues =
    filesByQuestion[0] && typeof filesByQuestion[0] === 'object' && Array.isArray(filesByQuestion[0].valores)
      ? filesByQuestion.map((item) => item.valores || [])
      : filesByQuestion;

  seccionesValues.forEach((seccionValues, seccionIndex) => {
    if (!Array.isArray(seccionValues)) return;
    seccionValues.forEach((cell, preguntaIndex) => {
      const list = Array.isArray(cell) ? cell : cell ? [cell] : [];
      list.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const location = { seccionIndex, preguntaIndex };
        if (item.fileDocId) byDocId.set(String(item.fileDocId), location);
        if (item.fileId) byFileId.set(String(item.fileId), location);
      });
    });
  });

  return { byDocId, byFileId };
};

const resolveQuestionLocation = (fileRef, lookup) => {
  if (!fileRef) return null;

  const questionRef = fileRef.questionRef;
  if (
    questionRef &&
    Number.isInteger(questionRef.seccionIndex) &&
    Number.isInteger(questionRef.preguntaIndex)
  ) {
    return {
      seccionIndex: questionRef.seccionIndex,
      preguntaIndex: questionRef.preguntaIndex
    };
  }

  if (fileRef.fileDocId && lookup.byDocId.has(String(fileRef.fileDocId))) {
    return lookup.byDocId.get(String(fileRef.fileDocId));
  }

  if (fileRef.fileId && lookup.byFileId.has(String(fileRef.fileId))) {
    return lookup.byFileId.get(String(fileRef.fileId));
  }

  return null;
};

export const normalizarArchivosPorPregunta = (reporte, secciones = [], canonicalFiles = []) => {
  const output = secciones.map((seccion) =>
    Array((seccion?.preguntas || []).length)
      .fill(null)
      .map(() => [])
  );

  const filesByQuestion = Array.isArray(reporte?.filesByQuestion) ? reporte.filesByQuestion : [];
  const lookup = toFilesByQuestionLookup(filesByQuestion);

  if (Array.isArray(canonicalFiles) && canonicalFiles.length > 0) {
    canonicalFiles
      .filter((item) => item && item.status !== 'deleted')
      .forEach((item) => {
        const normalized = toFileRef({ ...item, fileDocId: item.id || item.fileDocId || null });
        if (!normalized) return;

        const location = resolveQuestionLocation(normalized, lookup);
        if (!location) return;

        const { seccionIndex, preguntaIndex } = location;
        if (!output[seccionIndex] || !Array.isArray(output[seccionIndex][preguntaIndex])) return;
        output[seccionIndex][preguntaIndex].push(normalized);
      });

    if (hasFilesInMatrix(output)) {
      return output;
    }
  }

  if (filesByQuestion.length > 0) {
    const seccionesValues =
      filesByQuestion[0] && typeof filesByQuestion[0] === 'object' && Array.isArray(filesByQuestion[0].valores)
        ? filesByQuestion.map((item) => item.valores || [])
        : filesByQuestion;

    seccionesValues.forEach((seccionValues, seccionIndex) => {
      if (!Array.isArray(seccionValues) || !output[seccionIndex]) return;
      seccionValues.forEach((cell, preguntaIndex) => {
        const asList = Array.isArray(cell) ? cell : cell ? [cell] : [];
        output[seccionIndex][preguntaIndex] = asList.map(toFileRef).filter((item) => item && item.status !== 'deleted');
      });
    });

    if (hasFilesInMatrix(output)) {
      return output;
    }
  }

  // Fallback legacy: compatibilidad con auditorias historicas que solo tienen imagenes.
  const legacy = normalizarImagenes(reporte?.imagenes || [], secciones);
  legacy.forEach((seccionValues, seccionIndex) => {
    if (!Array.isArray(seccionValues) || !output[seccionIndex]) return;
    seccionValues.forEach((value, preguntaIndex) => {
      const ref = toFileRef(value);
      output[seccionIndex][preguntaIndex] = ref ? [ref] : [];
    });
  });

  return output;
};
