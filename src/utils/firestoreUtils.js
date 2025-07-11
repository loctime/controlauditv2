// Utilidades para manejar datos de Firestore

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
 */
export const registrarLogOperario = async (userId, accion, detalles = {}) => {
  try {
    await addDoc(collection(db, 'logs_operarios'), {
      userId,
      accion,
      detalles,
      fecha: Timestamp.now()
    });
    // eslint-disable-next-line no-console
    console.log(`[LOG OPERARIO] ${userId} - ${accion}`, detalles);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al registrar log de operario:', error);
  }
}; 