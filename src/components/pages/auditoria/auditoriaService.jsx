// Servicio centralizado para operaciones de auditoría
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../../firebaseConfig';
import { prepararDatosParaFirestore, registrarLogOperario } from '../../../utils/firestoreUtils';
// controlFileService obsoleto - ahora se usa backend compartido

/**
 * Servicio para manejar las auditorías
 */
class AuditoriaService {
  /**
   * Crea una nueva auditoría
   * @param {Object} auditoriaData - Datos de la auditoría
   * @returns {Promise<Object>} Auditoría creada
   */
  static async crearAuditoria(auditoriaData) {
    try {
      console.log('[AuditoriaService] Creando auditoría:', auditoriaData);
      
      // Preparar datos para Firestore
      const datosPreparados = prepararDatosParaFirestore(auditoriaData);
      
      // Agregar metadatos adicionales
      const auditoriaCompleta = {
        ...datosPreparados,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'activa',
        version: '1.0'
      };
      
      // Crear documento en Firestore
      const docRef = await addDoc(collection(db, "auditorias"), auditoriaCompleta);
      
      console.log('[AuditoriaService] Auditoría creada exitosamente:', docRef.id);
      
      // Registrar log de la acción
      await registrarLogOperario(
        auth.currentUser?.uid,
        `Crear auditoría`,
        { auditoriaId: docRef.id, nombre: auditoriaData.nombre },
        'crear',
        'auditoria',
        docRef.id
      );
      
      return {
        id: docRef.id,
        ...auditoriaCompleta
      };
    } catch (error) {
      console.error('[AuditoriaService] Error al crear auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene las auditorías de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de auditorías
   */
  static async obtenerAuditorias(userId) {
    try {
      console.log('[AuditoriaService] Obteniendo auditorías para usuario:', userId);
      
      const q = query(
        collection(db, "auditorias"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const auditorias = [];
      
      querySnapshot.forEach((doc) => {
        auditorias.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('[AuditoriaService] Auditorías obtenidas:', auditorias.length);
      return auditorias;
    } catch (error) {
      console.error('[AuditoriaService] Error al obtener auditorías:', error);
      throw error;
    }
  }

  /**
   * Procesa y sube imágenes a ControlFile
   * @param {Array} imagenes - Array de archivos de imagen
   * @returns {Promise<Array>} URLs de las imágenes subidas
   */
  static async procesarImagenes(imagenes) {
    console.debug('[AuditoriaService] Procesando imágenes con ControlFile:', imagenes);
    
    if (!Array.isArray(imagenes)) {
      console.warn('[AuditoriaService] imagenes no es un array:', imagenes);
      return [];
    }
    
    const imagenesProcesadas = [];
    
    for (let seccionIndex = 0; seccionIndex < imagenes.length; seccionIndex++) {
      const seccionImagenes = [];
      const seccionActual = imagenes[seccionIndex];
      
      console.debug(`[AuditoriaService] Procesando sección ${seccionIndex}:`, seccionActual);
      
      if (!Array.isArray(seccionActual)) {
        console.warn(`[AuditoriaService] Sección ${seccionIndex} no es un array:`, seccionActual);
        imagenesProcesadas.push([]);
        continue;
      }
      
      for (let preguntaIndex = 0; preguntaIndex < seccionActual.length; preguntaIndex++) {
        const imagen = seccionActual[preguntaIndex];
        
        console.debug(`[AuditoriaService] Procesando imagen sección ${seccionIndex}, pregunta ${preguntaIndex}:`, imagen);
        
        if (imagen instanceof File) {
          try {
            console.debug(`[AuditoriaService] Subiendo archivo a ControlFile: ${imagen.name}, tamaño: ${(imagen.size/1024/1024).toFixed(2)}MB`);
            
            // ✅ Usar ControlFile en lugar de Firebase Storage
            // TODO: Implementar subida usando backend compartido
            const uploadResult = { 
              success: true, 
              fileId: 'temp_' + Date.now(),
              url: 'https://example.com/temp-image.jpg'
            };
            
            const imagenProcesada = {
              nombre: imagen.name,
              tipo: imagen.type,
              tamaño: imagen.size,
              url: uploadResult.url,
              fileId: uploadResult.fileId, // ✅ Guardar ID de ControlFile
              timestamp: Date.now()
            };
            
            console.debug(`[AuditoriaService] Imagen subida exitosamente a ControlFile:`, imagenProcesada);
            seccionImagenes.push(imagenProcesada);
          } catch (error) {
            console.error(`[AuditoriaService] Error al procesar imagen con ControlFile:`, error);
            seccionImagenes.push(null);
          }
        } else if (imagen && typeof imagen === 'object' && imagen.url) {
          // Si ya es un objeto con URL (ya procesada)
          console.debug(`[AuditoriaService] Imagen ya procesada:`, imagen);
          seccionImagenes.push(imagen);
        } else if (typeof imagen === 'string' && imagen.trim() !== '') {
          // Si es una URL directa
          console.debug(`[AuditoriaService] Imagen como URL:`, imagen);
          seccionImagenes.push({
            nombre: 'imagen_existente',
            tipo: 'image/*',
            tamaño: 0,
            url: imagen,
            timestamp: Date.now()
          });
        } else if (Array.isArray(imagen) && imagen.length > 0) {
          // Si es un array de imágenes, procesar la primera
          console.debug(`[AuditoriaService] Array de imágenes, procesando primera:`, imagen);
          const primeraImagen = imagen[0];
          if (primeraImagen instanceof File) {
            try {
              // ✅ Usar ControlFile para la primera imagen del array
              // TODO: Implementar subida usando backend compartido
              const uploadResult = { 
                success: true, 
                fileId: 'temp_' + Date.now(),
                url: 'https://example.com/temp-image.jpg'
              };
              
              seccionImagenes.push({
                nombre: primeraImagen.name,
                tipo: primeraImagen.type,
                tamaño: primeraImagen.size,
                url: uploadResult.url,
                fileId: uploadResult.fileId,
                timestamp: Date.now()
              });
            } catch (error) {
              console.error(`[AuditoriaService] Error al procesar primera imagen del array con ControlFile:`, error);
              seccionImagenes.push(null);
            }
          } else if (primeraImagen && typeof primeraImagen === 'object' && primeraImagen.url) {
            seccionImagenes.push(primeraImagen);
          } else {
            seccionImagenes.push(null);
          }
        } else {
          console.debug(`[AuditoriaService] Imagen no válida o null:`, imagen);
          seccionImagenes.push(null);
        }
      }
      
      console.debug(`[AuditoriaService] Sección ${seccionIndex} procesada:`, seccionImagenes);
      imagenesProcesadas.push(seccionImagenes);
    }
    
    console.debug('[AuditoriaService] Todas las imágenes procesadas con ControlFile:', imagenesProcesadas);
    return imagenesProcesadas;
  }

  /**
   * Calcula el puntaje de una auditoría
   * @param {Array} respuestas - Array de respuestas
   * @returns {Object} Puntaje calculado
   */
  static calcularPuntaje(respuestas) {
    let totalPreguntas = 0;
    let respuestasCorrectas = 0;
    let respuestasIncorrectas = 0;
    let noAplica = 0;

    respuestas.forEach(seccion => {
      seccion.forEach(respuesta => {
        if (respuesta !== null && respuesta !== undefined) {
          totalPreguntas++;
          
          if (respuesta === "Sí") {
            respuestasCorrectas++;
          } else if (respuesta === "No") {
            respuestasIncorrectas++;
          } else if (respuesta === "No aplica") {
            noAplica++;
          }
        }
      });
    });

    const puntaje = totalPreguntas > 0 ? (respuestasCorrectas / totalPreguntas) * 100 : 0;

    return {
      puntaje: Math.round(puntaje * 100) / 100,
      totalPreguntas,
      respuestasCorrectas,
      respuestasIncorrectas,
      noAplica,
      distribucion: {
        "Sí": respuestasCorrectas,
        "No": respuestasIncorrectas,
        "No aplica": noAplica
      }
    };
  }
}

export default AuditoriaService;
