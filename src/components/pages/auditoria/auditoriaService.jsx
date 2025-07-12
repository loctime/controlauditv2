// Servicio centralizado para operaciones de auditoría
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebaseConfig';
import { prepararDatosParaFirestore, registrarLogOperario } from '../../../utils/firestoreUtils';

/**
 * Servicio centralizado para operaciones de auditoría
 * Maneja guardado, consultas, procesamiento de imágenes y estadísticas
 */
class AuditoriaService {
  
  /**
   * Genera estadísticas de respuestas de auditoría
   * @param {Array} respuestas - Array de respuestas
   * @returns {Object} Estadísticas calculadas
   */
  static generarEstadisticas(respuestas) {
    const respuestasPlanas = Array.isArray(respuestas) ? respuestas.flat() : [];
    
    const estadisticas = {
      Conforme: respuestasPlanas.filter(r => r === "Conforme").length,
      "No conforme": respuestasPlanas.filter(r => r === "No conforme").length,
      "Necesita mejora": respuestasPlanas.filter(r => r === "Necesita mejora").length,
      "No aplica": respuestasPlanas.filter(r => r === "No aplica").length,
    };

    const total = respuestasPlanas.length;
    const porcentajes = {};
    
    Object.keys(estadisticas).forEach(key => {
      porcentajes[key] = total > 0 ? ((estadisticas[key] / total) * 100).toFixed(2) : 0;
    });

    return {
      conteo: estadisticas,
      porcentajes,
      total,
      sinNoAplica: {
        ...estadisticas,
        "No aplica": 0
      }
    };
  }

  /**
   * Procesa y sube imágenes a Firebase Storage
   * @param {Array} imagenes - Array de archivos de imagen
   * @returns {Promise<Array>} URLs de las imágenes subidas
   */
  static async procesarImagenes(imagenes) {
    const imagenesProcesadas = [];
    
    for (let seccionIndex = 0; seccionIndex < imagenes.length; seccionIndex++) {
      const seccionImagenes = [];
      for (let preguntaIndex = 0; preguntaIndex < imagenes[seccionIndex].length; preguntaIndex++) {
        const imagen = imagenes[seccionIndex][preguntaIndex];
        
        if (imagen instanceof File) {
          try {
            // Generar nombre único para la imagen
            const timestamp = Date.now();
            const nombreArchivo = `auditoria_${timestamp}_${imagen.name}`;
            const storageRef = ref(storage, `imagenes/auditorias/${nombreArchivo}`);
            
            // Subir imagen
            await uploadBytes(storageRef, imagen);
            const url = await getDownloadURL(storageRef);
            
            seccionImagenes.push({
              nombre: imagen.name,
              tipo: imagen.type,
              tamaño: imagen.size,
              url: url,
              timestamp: timestamp
            });
          } catch (error) {
            console.error("Error al procesar imagen:", error);
            seccionImagenes.push(null);
          }
        } else {
          seccionImagenes.push(imagen);
        }
      }
      imagenesProcesadas.push(seccionImagenes);
    }
    
    return imagenesProcesadas;
  }

  /**
   * Genera nombre de archivo para la auditoría
   * @param {Object} empresa - Datos de la empresa
   * @param {string} sucursal - Nombre de la sucursal
   * @param {Object} user - Datos del usuario
   * @returns {string} Nombre del archivo
   */
  static generarNombreArchivo(empresa, sucursal, user) {
    const fecha = new Date().toISOString().split('T')[0];
    const nombreEmpresa = empresa?.nombre || "Empresa";
    const ubicacion = sucursal && sucursal.trim() !== "" ? `_${sucursal}` : "_CasaCentral";
    const nombreUsuario = user?.displayName || user?.email || "Usuario";
    
    return `${nombreEmpresa}${ubicacion}_${nombreUsuario}_${fecha}`;
  }

  /**
   * Guarda una auditoría en Firestore
   * @param {Object} datosAuditoria - Datos de la auditoría
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<string>} ID del documento guardado
   */
  static async guardarAuditoria(datosAuditoria, userProfile) {
    try {
      // Validar datos requeridos
      if (!datosAuditoria.empresa || !datosAuditoria.formulario) {
        throw new Error("Faltan datos requeridos para guardar la auditoría");
      }

      // Procesar imágenes si existen
      let imagenesProcesadas = [];
      if (datosAuditoria.imagenes && datosAuditoria.imagenes.length > 0) {
        imagenesProcesadas = await this.procesarImagenes(datosAuditoria.imagenes);
      }

      // Generar estadísticas
      const estadisticas = this.generarEstadisticas(datosAuditoria.respuestas);

      // Preparar datos para Firestore
      const datosCompletos = {
        empresaId: datosAuditoria.empresa?.id || null,
        empresaNombre: datosAuditoria.empresa?.nombre || null,
        sucursal: datosAuditoria.sucursal || "Casa Central",
        formularioId: datosAuditoria.formulario?.id || null,
        nombreForm: datosAuditoria.formulario?.nombre || null,
        respuestas: Array.isArray(datosAuditoria.respuestas) ? datosAuditoria.respuestas.flat() : [],
        comentarios: Array.isArray(datosAuditoria.comentarios) ? datosAuditoria.comentarios.flat() : [],
        imagenes: imagenesProcesadas.flat().filter(img => img !== null),
        secciones: Array.isArray(datosAuditoria.secciones) ? datosAuditoria.secciones : [],
        estadisticas: estadisticas,
        estado: "completada",
        nombreArchivo: this.generarNombreArchivo(
          datosAuditoria.empresa, 
          datosAuditoria.sucursal, 
          userProfile
        ),
        creadoPor: userProfile?.uid || null,
        creadoPorEmail: userProfile?.email || null,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid || null,
        timestamp: serverTimestamp(),
        fechaCreacion: new Date().toISOString(),
        version: "2.0" // Versión del formato de datos
      };

      // Limpiar valores undefined
      Object.keys(datosCompletos).forEach(key => {
        if (typeof datosCompletos[key] === 'undefined') {
          datosCompletos[key] = null;
        }
      });

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, "reportes"), datosCompletos);

      // Registrar log de operación
      await registrarLogOperario(
        userProfile?.uid,
        'AUDITORIA_GUARDADA',
        {
          auditoriaId: docRef.id,
          empresa: datosAuditoria.empresa?.nombre,
          sucursal: datosAuditoria.sucursal,
          formulario: datosAuditoria.formulario?.nombre
        }
      );

      console.log(`✅ Auditoría guardada exitosamente: ${docRef.id}`);
      return docRef.id;

    } catch (error) {
      console.error("❌ Error al guardar auditoría:", error);
      throw error;
    }
  }

  /**
   * Obtiene auditorías filtradas por usuario y permisos
   * @param {Object} userProfile - Perfil del usuario
   * @param {Object} filtros - Filtros adicionales
   * @returns {Promise<Array>} Lista de auditorías
   */
  static async obtenerAuditorias(userProfile, filtros = {}) {
    try {
      let q = collection(db, "reportes");
      
      // Aplicar filtros según el rol del usuario
      if (userProfile.role === 'operario') {
        q = query(q, 
          where("creadoPor", "==", userProfile.uid),
          orderBy("timestamp", "desc")
        );
      } else if (userProfile.role === 'max') {
        q = query(q,
          where("clienteAdminId", "==", userProfile.uid),
          orderBy("timestamp", "desc")
        );
      }
      // Para supermax, no aplicar filtros (puede ver todo)

      const snapshot = await getDocs(q);
      const auditorias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Aplicar filtros adicionales en memoria
      let auditoriasFiltradas = auditorias;
      
      if (filtros.empresa) {
        auditoriasFiltradas = auditoriasFiltradas.filter(a => 
          a.empresaNombre?.toLowerCase().includes(filtros.empresa.toLowerCase())
        );
      }
      
      if (filtros.fechaDesde) {
        auditoriasFiltradas = auditoriasFiltradas.filter(a => 
          new Date(a.fechaCreacion) >= new Date(filtros.fechaDesde)
        );
      }
      
      if (filtros.fechaHasta) {
        auditoriasFiltradas = auditoriasFiltradas.filter(a => 
          new Date(a.fechaCreacion) <= new Date(filtros.fechaHasta)
        );
      }

      return auditoriasFiltradas;

    } catch (error) {
      console.error("❌ Error al obtener auditorías:", error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas generales de auditorías
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<Object>} Estadísticas generales
   */
  static async obtenerEstadisticasGenerales(userProfile) {
    try {
      const auditorias = await this.obtenerAuditorias(userProfile);
      
      const estadisticas = {
        totalAuditorias: auditorias.length,
        porEmpresa: {},
        porMes: {},
        promedioConformidad: 0
      };

      let totalConformes = 0;
      let totalRespuestas = 0;

      auditorias.forEach(auditoria => {
        // Estadísticas por empresa
        const empresa = auditoria.empresaNombre || 'Sin empresa';
        estadisticas.porEmpresa[empresa] = (estadisticas.porEmpresa[empresa] || 0) + 1;

        // Estadísticas por mes
        const fecha = new Date(auditoria.fechaCreacion);
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        estadisticas.porMes[mes] = (estadisticas.porMes[mes] || 0) + 1;

        // Calcular conformidad
        if (auditoria.estadisticas?.conteo) {
          totalConformes += auditoria.estadisticas.conteo.Conforme || 0;
          totalRespuestas += auditoria.estadisticas.total || 0;
        }
      });

      estadisticas.promedioConformidad = totalRespuestas > 0 
        ? ((totalConformes / totalRespuestas) * 100).toFixed(2) 
        : 0;

      return estadisticas;

    } catch (error) {
      console.error("❌ Error al obtener estadísticas:", error);
      throw error;
    }
  }
}

export default AuditoriaService;
