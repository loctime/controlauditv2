// Utilidades para manejar datos de Firestore

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseControlFile';

/**
 * Convierte arrays anidados a objetos planos para Firestore
 * @param {Array} arraysAnidados - Array de arrays (ej: respuestas, comentarios, imágenes)
 * @returns {Object} Objeto plano con claves formateadas
 */
export const convertirArraysAObjetos = (arraysAnidados) => {
  const objetoPlano = {};
  
  arraysAnidados.forEach((seccionArray, seccionIndex) => {
    seccionArray.forEach((item, preguntaIndex) => {
      const clave = `seccion_${seccionIndex}_pregunta_${preguntaIndex}`;
      objetoPlano[clave] = item;
    });
  });
  
  return objetoPlano;
};

/**
 * Reconstruye arrays anidados desde objetos planos de Firestore
 * @param {Object} datosPlanos - Objeto plano de Firestore
 * @param {Object} metadata - Metadatos con información de estructura
 * @returns {Array} Array de arrays reconstruido
 */
export const reconstruirArraysAnidados = (datosPlanos, metadata) => {
  const arraysReconstruidos = [];
  
  for (let seccionIndex = 0; seccionIndex < metadata.numSecciones; seccionIndex++) {
    const seccionArray = [];
    const numPreguntas = metadata.numPreguntasPorSeccion[seccionIndex];
    
    for (let preguntaIndex = 0; preguntaIndex < numPreguntas; preguntaIndex++) {
      const clave = `seccion_${seccionIndex}_pregunta_${preguntaIndex}`;
      seccionArray.push(datosPlanos[clave] || '');
    }
    
    arraysReconstruidos.push(seccionArray);
  }
  
  return arraysReconstruidos;
};

/**
 * Genera metadatos para la estructura de datos
 * @param {Array} secciones - Array de secciones del formulario
 * @returns {Object} Metadatos con información de estructura
 */
export const generarMetadata = (secciones) => {
  return {
    numSecciones: secciones.length,
    numPreguntasPorSeccion: secciones.map(seccion => seccion.preguntas?.length || 0)
  };
};

/**
 * Prepara datos de auditoría para guardar en Firestore
 * @param {Object} datos - Datos de la auditoría
 * @returns {Object} Datos preparados para Firestore
 */
export const prepararDatosParaFirestore = (datos) => {
  const { respuestas, comentarios, imagenes, secciones, ...otrosDatos } = datos;
  
  return {
    ...otrosDatos,
    respuestas: convertirArraysAObjetos(respuestas),
    comentarios: convertirArraysAObjetos(comentarios),
    imagenes: convertirArraysAObjetos(imagenes),
    secciones: secciones,
    metadata: generarMetadata(secciones)
  };
};

/**
 * Reconstruye datos de auditoría desde Firestore
 * @param {Object} datosFirestore - Datos obtenidos de Firestore
 * @returns {Object} Datos reconstruidos con arrays anidados
 */
export const reconstruirDatosDesdeFirestore = (datosFirestore) => {
  const { respuestas, comentarios, imagenes, metadata, ...otrosDatos } = datosFirestore;
  
  return {
    ...otrosDatos,
    respuestas: reconstruirArraysAnidados(respuestas, metadata),
    comentarios: reconstruirArraysAnidados(comentarios, metadata),
    imagenes: reconstruirArraysAnidados(imagenes, metadata)
  };
}; 

/**
 * Registra una acción de operario en la colección 'logs_operarios'.
 * @param {string} userId - ID del operario
 * @param {string} accion - Acción realizada
 * @param {object} detalles - Detalles adicionales
 * @param {object} metadata - Metadatos adicionales (opcional)
 */
export const registrarLogOperario = async (userId, accion, detalles = {}, metadata = {}) => {
  try {
    // Obtener información del navegador
    const userAgent = navigator.userAgent;
    const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                   userAgent.includes('Firefox') ? 'Firefox' : 
                   userAgent.includes('Safari') ? 'Safari' : 
                   userAgent.includes('Edge') ? 'Edge' : 'Desconocido';
    
    // Obtener información de la página
    const currentUrl = window.location.href;
    const referrer = document.referrer;
    
    // Crear objeto de log mejorado
    const logData = {
      userId,
      accion,
      detalles,
      fecha: Timestamp.now(),
      // Información del sistema
      userAgent,
      browser,
      currentUrl,
      referrer,
      // Metadatos adicionales
      ...metadata,
      // Información de sesión
      sessionId: sessionStorage.getItem('sessionId') || 'no-session',
      timestamp: Date.now()
    };

    await addDoc(collection(db, 'logs_operarios'), logData);
    
    // Log en consola para debugging
    console.log(`[LOG OPERARIO] ${userId} - ${accion}`, {
      detalles,
      browser,
      url: currentUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar log de operario:', error);
  }
};

/**
 * Registra una acción del sistema con información completa
 * @param {string} userId - ID del usuario
 * @param {string} accion - Acción realizada
 * @param {object} detalles - Detalles de la acción
 * @param {string} tipo - Tipo de acción (crear, editar, eliminar, ver, etc.)
 * @param {string} entidad - Entidad afectada (usuario, empresa, auditoria, etc.)
 * @param {string} entidadId - ID de la entidad (opcional)
 */
export const registrarAccionSistema = async (userId, accion, detalles = {}, tipo = 'general', entidad = null, entidadId = null) => {
  try {
    const metadata = {
      tipo,
      entidad,
      entidadId,
      severidad: tipo === 'eliminar' ? 'alta' : tipo === 'crear' ? 'media' : 'baja'
    };
    
    await registrarLogOperario(userId, accion, detalles, metadata);
  } catch (error) {
    console.error('Error al registrar acción del sistema:', error);
  }
};

/**
 * Normaliza datos de sucursal para unificar campos legacy
 * Unifica campos de fecha y estado activo sin modificar Firestore
 * Preserva TODOS los campos originales
 * @param {Object} doc - Documento de sucursal desde Firestore
 * @returns {Object} Sucursal normalizada con campos unificados
 */
export const normalizeSucursal = (doc) => {
  const data = typeof doc === 'object' && doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  
  return {
    ...data,
    id,
    fechaCreacion: data.fechaCreacion ?? data.createdAt ?? null,
    activa: data.activa ?? true
  };
};

/**
 * Normaliza datos de empleado para unificar campos legacy
 * Unifica campos de fecha y estado activo sin modificar Firestore
 * Preserva TODOS los campos originales
 * @param {Object} doc - Documento de empleado desde Firestore
 * @returns {Object} Empleado normalizado con campos unificados
 */
export const normalizeEmpleado = (doc) => {
  const data = typeof doc === 'object' && doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  
  return {
    ...data,
    id,
    fechaCreacion: data.fechaCreacion ?? data.createdAt ?? null,
    activa: data.activa ?? true
  };
}; 