// Servicio centralizado para operaciones de auditoría
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../../firebaseConfig';
import { prepararDatosParaFirestore, registrarLogOperario } from '../../../utils/firestoreUtils';
import { uploadFile, createControlAuditSubfolder, getOrCreateControlAuditRootFolder } from '../../../lib/controlfile-upload';

/**
 * Servicio para manejar las auditorías con integración completa a ControlFile
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
      
      // ✅ CREAR CARPETA EN CONTROLFILE PARA ESTA AUDITORÍA
      try {
        const carpetaAuditoria = await this.crearCarpetaAuditoria(docRef.id, auditoriaData);
        console.log('[AuditoriaService] Carpeta de auditoría creada en ControlFile:', carpetaAuditoria);
        
        // Actualizar la auditoría con la información de la carpeta
        await updateDoc(doc(db, "auditorias", docRef.id), {
          controlFileFolderId: carpetaAuditoria.folderId,
          controlFileFolderPath: carpetaAuditoria.path
        });
        
      } catch (error) {
        console.warn('[AuditoriaService] No se pudo crear carpeta en ControlFile:', error);
        // No fallar la auditoría si falla ControlFile
      }
      
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
        ...auditoriaCompleta,
        controlFileFolderId: carpetaAuditoria?.folderId
      };
    } catch (error) {
      console.error('[AuditoriaService] Error al crear auditoría:', error);
      throw error;
    }
  }

  /**
   * Crea una carpeta específica para una auditoría en ControlFile
   * @param {string} auditoriaId - ID de la auditoría
   * @param {Object} auditoriaData - Datos de la auditoría
   * @returns {Promise<Object>} Información de la carpeta creada
   */
  static async crearCarpetaAuditoria(auditoriaId, auditoriaData) {
    try {
      console.log('[AuditoriaService] Creando carpeta para auditoría en ControlFile:', auditoriaId);
      
      // Generar nombre descriptivo para la carpeta
      const fecha = new Date().toISOString().split('T')[0];
      const nombreEmpresa = auditoriaData.empresa?.nombre || 'Empresa';
      const nombreFormulario = auditoriaData.formulario?.nombre || 'Formulario';
      
      const nombreCarpeta = `Auditoría_${fecha}_${nombreEmpresa}_${nombreFormulario}`.replace(/[^a-zA-Z0-9_\-\s]/g, '');
      
      // Crear subcarpeta dentro de ControlAudit
      const carpetaAuditoria = await createControlAuditSubfolder(nombreCarpeta);
      
      console.log('[AuditoriaService] Carpeta de auditoría creada:', carpetaAuditoria);
      
      return carpetaAuditoria;
      
    } catch (error) {
      console.error('[AuditoriaService] Error creando carpeta de auditoría:', error);
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
   * ✅ NUEVA FUNCIÓN: Sube una imagen específica de auditoría a ControlFile
   * @param {File} imagen - Archivo de imagen
   * @param {string} auditoriaId - ID de la auditoría
   * @param {number} seccionIndex - Índice de la sección
   * @param {number} preguntaIndex - Índice de la pregunta
   * @returns {Promise<Object>} Información de la imagen subida
   */
  static async subirImagenAuditoria(imagen, auditoriaId, seccionIndex, preguntaIndex) {
    try {
      console.log('[AuditoriaService] Subiendo imagen de auditoría:', {
        auditoriaId,
        seccionIndex,
        preguntaIndex,
        nombre: imagen.name,
        tamaño: imagen.size
      });

      // 1. Obtener la carpeta de la auditoría
      const auditoriaDoc = await getDocs(query(
        collection(db, "auditorias"),
        where("__name__", "==", auditoriaId)
      ));
      
      if (auditoriaDoc.empty) {
        throw new Error('Auditoría no encontrada');
      }
      
      const auditoria = auditoriaDoc.docs[0].data();
      let folderId = auditoria.controlFileFolderId;
      
      // Si no tiene carpeta, crearla
      if (!folderId) {
        console.log('[AuditoriaService] Auditoría sin carpeta, creando...');
        const carpetaAuditoria = await this.crearCarpetaAuditoria(auditoriaId, auditoria);
        folderId = carpetaAuditoria.folderId;
        
        // Actualizar la auditoría
        await updateDoc(doc(db, "auditorias", auditoriaId), {
          controlFileFolderId: folderId,
          controlFileFolderPath: carpetaAuditoria.path
        });
      }

      // 2. Crear subcarpeta para la sección si no existe
      const nombreSeccion = `Sección_${seccionIndex + 1}`;
      let seccionFolderId = folderId;
      
      try {
        const seccionFolder = await createControlAuditSubfolder(nombreSeccion, folderId);
        seccionFolderId = seccionFolder.folderId;
        console.log('[AuditoriaService] Subcarpeta de sección creada:', seccionFolderId);
      } catch (error) {
        console.warn('[AuditoriaService] No se pudo crear subcarpeta de sección, usando carpeta principal:', error);
      }

      // 3. Generar nombre descriptivo para la imagen
      const timestamp = Date.now();
      const extension = imagen.name.split('.').pop();
      const nombreImagen = `P${preguntaIndex + 1}_${timestamp}.${extension}`;

      // 4. Subir imagen a ControlFile
      const idToken = await auth.currentUser.getIdToken();
      const uploadResult = await uploadFile(imagen, idToken, seccionFolderId);
      
      if (!uploadResult.success) {
        throw new Error('Error en la subida de la imagen a ControlFile');
      }

      // 5. Crear objeto de imagen con metadatos
      const imagenProcesada = {
        nombre: nombreImagen,
        nombreOriginal: imagen.name,
        tipo: imagen.type,
        tamaño: imagen.size,
        url: `https://files.controldoc.app/${uploadResult.fileId}`,
        fileId: uploadResult.fileId,
        controlFileFolderId: seccionFolderId,
        seccionIndex,
        preguntaIndex,
        timestamp: Date.now(),
        metadata: {
          auditoriaId,
          seccion: seccionIndex,
          pregunta: preguntaIndex,
          uploadSessionId: uploadResult.uploadSessionId
        }
      };

      console.log('[AuditoriaService] Imagen subida exitosamente a ControlFile:', imagenProcesada);
      
      return imagenProcesada;
      
    } catch (error) {
      console.error('[AuditoriaService] Error subiendo imagen de auditoría:', error);
      throw error;
    }
  }

  /**
   * ✅ NUEVA FUNCIÓN: Procesa y sube múltiples imágenes de auditoría a ControlFile
   * @param {Array} imagenes - Array de archivos de imagen organizados por sección y pregunta
   * @param {string} auditoriaId - ID de la auditoría
   * @returns {Promise<Array>} Array de imágenes procesadas con la misma estructura
   */
  static async procesarImagenesAuditoria(imagenes, auditoriaId) {
    console.log('[AuditoriaService] Procesando imágenes de auditoría con ControlFile:', {
      auditoriaId,
      totalSecciones: imagenes.length
    });
    
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
            // ✅ Usar la nueva función de subida específica para auditorías
            const imagenProcesada = await this.subirImagenAuditoria(
              imagen, 
              auditoriaId, 
              seccionIndex, 
              preguntaIndex
            );
            
            seccionImagenes.push(imagenProcesada);
            
          } catch (error) {
            console.error(`[AuditoriaService] Error procesando imagen sección ${seccionIndex}, pregunta ${preguntaIndex}:`, error);
            seccionImagenes.push(null);
          }
        } else if (Array.isArray(imagen) && imagen.length > 0) {
          // Si es un array de imágenes, procesar la primera
          const primeraImagen = imagen[0];
          if (primeraImagen instanceof File) {
            try {
              const imagenProcesada = await this.subirImagenAuditoria(
                primeraImagen, 
                auditoriaId, 
                seccionIndex, 
                preguntaIndex
              );
              seccionImagenes.push(imagenProcesada);
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
    
    console.log('[AuditoriaService] Todas las imágenes procesadas con ControlFile:', imagenesProcesadas);
    return imagenesProcesadas;
  }

  /**
   * ✅ NUEVA FUNCIÓN: Obtiene las imágenes de una auditoría desde ControlFile
   * @param {string} auditoriaId - ID de la auditoría
   * @returns {Promise<Array>} Array de imágenes organizadas por sección y pregunta
   */
  static async obtenerImagenesAuditoria(auditoriaId) {
    try {
      console.log('[AuditoriaService] Obteniendo imágenes de auditoría:', auditoriaId);
      
      // Obtener la auditoría
      const auditoriaDoc = await getDocs(query(
        collection(db, "auditorias"),
        where("__name__", "==", auditoriaId)
      ));
      
      if (auditoriaDoc.empty) {
        console.warn('[AuditoriaService] Auditoría no encontrada para obtener imágenes');
        return [];
      }
      
      const auditoria = auditoriaDoc.docs[0].data();
      
      // Si no tiene imágenes en Firestore, retornar array vacío
      if (!auditoria.imagenes) {
        console.log('[AuditoriaService] Auditoría sin imágenes registradas');
        return [];
      }
      
      // Reconstruir el array de imágenes desde Firestore
      const imagenes = this.reconstruirImagenesDesdeFirestore(auditoria.imagenes, auditoria.metadata);
      
      console.log('[AuditoriaService] Imágenes obtenidas:', imagenes);
      return imagenes;
      
    } catch (error) {
      console.error('[AuditoriaService] Error obteniendo imágenes de auditoría:', error);
      return [];
    }
  }

  /**
   * ✅ NUEVA FUNCIÓN: Reconstruye el array de imágenes desde Firestore
   * @param {Object} imagenesFirestore - Imágenes almacenadas en Firestore
   * @param {Object} metadata - Metadatos de la auditoría
   * @returns {Array} Array de imágenes reconstruido
   */
  static reconstruirImagenesDesdeFirestore(imagenesFirestore, metadata) {
    if (!imagenesFirestore || !metadata) {
      return [];
    }
    
    // Si es array de objetos {seccion, valores}
    if (Array.isArray(imagenesFirestore) && imagenesFirestore.length > 0 && 
        imagenesFirestore[0] && typeof imagenesFirestore[0] === 'object' && 
        Array.isArray(imagenesFirestore[0].valores)) {
      
      const resultado = metadata.secciones.map((_, idx) => {
        const imgSec = imagenesFirestore.find(img => img.seccion === idx);
        if (!imgSec || !Array.isArray(imgSec.valores)) {
          return [];
        }
        return imgSec.valores;
      });
      
      return resultado;
    }
    
    // Si es array de arrays (formato clásico)
    if (Array.isArray(imagenesFirestore) && Array.isArray(imagenesFirestore[0])) {
      return imagenesFirestore;
    }
    
    return [];
  }

  /**
   * ✅ NUEVA FUNCIÓN: Actualiza las imágenes de una auditoría existente
   * @param {string} auditoriaId - ID de la auditoría
   * @param {Array} nuevasImagenes - Nuevas imágenes a guardar
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  static async actualizarImagenesAuditoria(auditoriaId, nuevasImagenes) {
    try {
      console.log('[AuditoriaService] Actualizando imágenes de auditoría:', auditoriaId);
      
      // Preparar las imágenes para Firestore
      const imagenesPreparadas = this.prepararImagenesParaFirestore(nuevasImagenes);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, "auditorias", auditoriaId), {
        imagenes: imagenesPreparadas,
        updatedAt: serverTimestamp()
      });
      
      console.log('[AuditoriaService] Imágenes de auditoría actualizadas correctamente');
      return true;
      
    } catch (error) {
      console.error('[AuditoriaService] Error actualizando imágenes de auditoría:', error);
      throw error;
    }
  }

  /**
   * ✅ NUEVA FUNCIÓN: Prepara las imágenes para guardar en Firestore
   * @param {Array} imagenes - Array de imágenes
   * @returns {Object} Imágenes preparadas para Firestore
   */
  static prepararImagenesParaFirestore(imagenes) {
    if (!Array.isArray(imagenes)) {
      return [];
    }
    
    const imagenesPreparadas = [];
    
    imagenes.forEach((seccionImagenes, seccionIndex) => {
      if (Array.isArray(seccionImagenes)) {
        const seccionPreparada = {
          seccion: seccionIndex,
          valores: seccionImagenes
        };
        imagenesPreparadas.push(seccionPreparada);
      }
    });
    
    return imagenesPreparadas;
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
