/**
 * Servicio para gestionar acciones requeridas en sucursales
 * Service agnóstico a paths de Firestore - recibe CollectionReference/DocumentReference como parámetros
 */
import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

class AccionesRequeridasService {
  /**
   * Crea una acción requerida desde un reporte
   * @param {CollectionReference} accionesCollectionRef - Referencia a la colección de acciones requeridas
   * @param {string} reporteId - ID del reporte origen
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} empresaId - ID de la empresa
   * @param {Object} accionData - Datos de la acción (del array accionesRequeridas del reporte)
   * @returns {Promise<string>} ID de la acción creada
   */
  static async crearAccionDesdeReporte(accionesCollectionRef, reporteId, sucursalId, empresaId, accionData) {
    try {
      if (!accionesCollectionRef) {
        throw new Error('AccionesRequeridasService: accionesCollectionRef es requerido');
      }

      const accionCompleta = {
        ...accionData,
        reporteId,
        sucursalId,
        empresaId,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      const docRef = await addDoc(accionesCollectionRef, accionCompleta);
      console.log(`✅ Acción requerida creada: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al crear acción requerida:', error);
      throw error;
    }
  }

  /**
   * Crea múltiples acciones requeridas desde un reporte
   * @param {CollectionReference} accionesCollectionRef - Referencia a la colección de acciones requeridas
   * @param {string} reporteId - ID del reporte origen
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} empresaId - ID de la empresa
   * @param {Array} accionesData - Array de acciones requeridas del reporte
   * @returns {Promise<Array<string>>} IDs de las acciones creadas
   */
  static async crearAccionesDesdeReporte(accionesCollectionRef, reporteId, sucursalId, empresaId, accionesData) {
    if (!accionesData || accionesData.length === 0) {
      return [];
    }

    try {
      const promesas = accionesData.map(accion => 
        this.crearAccionDesdeReporte(accionesCollectionRef, reporteId, sucursalId, empresaId, accion)
      );
      
      const ids = await Promise.all(promesas);
      console.log(`✅ ${ids.length} acciones requeridas creadas`);
      return ids;
    } catch (error) {
      console.error('❌ Error al crear acciones requeridas:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las acciones requeridas de una sucursal
   * @param {CollectionReference} accionesCollectionRef - Referencia a la colección de acciones requeridas
   * @param {Object} filtros - Filtros opcionales
   * @param {string} filtros.estado - Filtrar por estado
   * @param {string} filtros.reporteId - Filtrar por reporte origen
   * @param {Date} filtros.fechaDesde - Filtrar desde fecha
   * @param {Date} filtros.fechaHasta - Filtrar hasta fecha
   * @returns {Promise<Array>} Array de acciones requeridas
   */
  static async obtenerAccionesPorSucursal(accionesCollectionRef, filtros = {}) {
    try {
      if (!accionesCollectionRef) {
        throw new Error('AccionesRequeridasService: accionesCollectionRef es requerido');
      }

      let q = query(accionesCollectionRef, orderBy('fechaCreacion', 'desc'));

      if (filtros.estado) {
        q = query(q, where('estado', '==', filtros.estado));
      }

      if (filtros.reporteId) {
        q = query(q, where('reporteId', '==', filtros.reporteId));
      }

      if (filtros.fechaDesde) {
        const fechaDesdeTimestamp = Timestamp.fromDate(filtros.fechaDesde);
        q = query(q, where('fechaCreacion', '>=', fechaDesdeTimestamp));
      }

      if (filtros.fechaHasta) {
        const fechaHastaTimestamp = Timestamp.fromDate(filtros.fechaHasta);
        q = query(q, where('fechaCreacion', '<=', fechaHastaTimestamp));
      }

      const querySnapshot = await getDocs(q);
      const acciones = [];

      querySnapshot.forEach((docSnapshot) => {
        acciones.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      return acciones;
    } catch (error) {
      console.error('❌ Error al obtener acciones requeridas:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una acción requerida
   * @param {DocumentReference} accionDocRef - Referencia al documento de la acción
   * @param {string} nuevoEstado - Nuevo estado: "pendiente" | "en_proceso" | "completada" | "cancelada"
   * @param {string} usuarioId - ID del usuario que actualiza
   * @param {string} usuarioNombre - Nombre del usuario
   * @param {string} comentario - Comentario opcional
   * @returns {Promise<void>}
   */
  static async actualizarEstadoAccion(accionDocRef, nuevoEstado, usuarioId, usuarioNombre, comentario = null) {
    try {
      if (!accionDocRef) {
        throw new Error('AccionesRequeridasService: accionDocRef es requerido');
      }

      const accionDoc = await getDoc(accionDocRef);

      if (!accionDoc.exists()) {
        throw new Error('Acción requerida no encontrada');
      }

      const accionData = accionDoc.data();
      const updateData = {
        estado: nuevoEstado,
        fechaActualizacion: serverTimestamp()
      };

      if (nuevoEstado === 'completada') {
        updateData.fechaCompletada = serverTimestamp();
        updateData.completadaPor = usuarioId;
      } else if (nuevoEstado !== 'completada' && accionData.fechaCompletada) {
        updateData.fechaCompletada = null;
        updateData.completadaPor = null;
      }

      if (comentario) {
        const comentarios = accionData.comentarios || [];
        comentarios.push({
          texto: comentario,
          fecha: serverTimestamp(),
          usuario: usuarioId,
          usuarioNombre: usuarioNombre
        });
        updateData.comentarios = comentarios;
      }

      await updateDoc(accionDocRef, updateData);
      console.log(`✅ Estado de acción actualizado: ${accionDocRef.id} -> ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error al actualizar estado de acción:', error);
      throw error;
    }
  }

  /**
   * Agrega un comentario a una acción requerida
   * @param {DocumentReference} accionDocRef - Referencia al documento de la acción
   * @param {string} comentario - Texto del comentario
   * @param {string} usuarioId - ID del usuario
   * @param {string} usuarioNombre - Nombre del usuario
   * @returns {Promise<void>}
   */
  static async agregarComentarioAccion(accionDocRef, comentario, usuarioId, usuarioNombre) {
    try {
      if (!accionDocRef) {
        throw new Error('AccionesRequeridasService: accionDocRef es requerido');
      }

      const accionDoc = await getDoc(accionDocRef);

      if (!accionDoc.exists()) {
        throw new Error('Acción requerida no encontrada');
      }

      const accionData = accionDoc.data();
      const comentarios = accionData.comentarios || [];
      
      comentarios.push({
        texto: comentario,
        fecha: serverTimestamp(),
        usuario: usuarioId,
        usuarioNombre: usuarioNombre
      });

      await updateDoc(accionDocRef, {
        comentarios,
        fechaActualizacion: serverTimestamp()
      });

      console.log(`✅ Comentario agregado a acción: ${accionDocRef.id}`);
    } catch (error) {
      console.error('❌ Error al agregar comentario:', error);
      throw error;
    }
  }

  /**
   * Registra una modificación en una acción requerida
   * @param {DocumentReference} accionDocRef - Referencia al documento de la acción
   * @param {string} modificacion - Texto de la modificación
   * @param {string} usuarioId - ID del usuario
   * @param {string} usuarioNombre - Nombre del usuario
   * @returns {Promise<void>}
   */
  static async agregarModificacionAccion(accionDocRef, modificacion, usuarioId, usuarioNombre) {
    try {
      if (!accionDocRef) {
        throw new Error('AccionesRequeridasService: accionDocRef es requerido');
      }

      const accionDoc = await getDoc(accionDocRef);

      if (!accionDoc.exists()) {
        throw new Error('Acción requerida no encontrada');
      }

      const accionData = accionDoc.data();
      const modificaciones = accionData.modificaciones || [];
      
      modificaciones.push({
        texto: modificacion,
        fecha: serverTimestamp(),
        usuario: usuarioId,
        usuarioNombre: usuarioNombre
      });

      await updateDoc(accionDocRef, {
        modificaciones,
        fechaActualizacion: serverTimestamp()
      });

      console.log(`✅ Modificación registrada en acción: ${accionDocRef.id}`);
    } catch (error) {
      console.error('❌ Error al registrar modificación:', error);
      throw error;
    }
  }

  /**
   * Actualiza el texto de una acción requerida
   * @param {DocumentReference} accionDocRef - Referencia al documento de la acción
   * @param {string} nuevoTexto - Nuevo texto de la acción
   * @param {string} usuarioId - ID del usuario
   * @param {string} usuarioNombre - Nombre del usuario
   * @returns {Promise<void>}
   */
  static async actualizarTextoAccion(accionDocRef, nuevoTexto, usuarioId, usuarioNombre) {
    try {
      if (!accionDocRef) {
        throw new Error('AccionesRequeridasService: accionDocRef es requerido');
      }
      
      await this.agregarModificacionAccion(
        accionDocRef,
        `Texto actualizado: "${nuevoTexto}"`, 
        usuarioId, 
        usuarioNombre
      );

      await updateDoc(accionDocRef, {
        accionTexto: nuevoTexto,
        fechaActualizacion: serverTimestamp()
      });

      console.log(`✅ Texto de acción actualizado: ${accionDocRef.id}`);
    } catch (error) {
      console.error('❌ Error al actualizar texto de acción:', error);
      throw error;
    }
  }

  /**
   * Elimina una acción requerida
   * @param {DocumentReference} accionDocRef - Referencia al documento de la acción
   * @returns {Promise<void>}
   */
  static async eliminarAccion(accionDocRef) {
    try {
      if (!accionDocRef) {
        throw new Error('AccionesRequeridasService: accionDocRef es requerido');
      }

      await deleteDoc(accionDocRef);
      console.log(`✅ Acción eliminada: ${accionDocRef.id}`);
    } catch (error) {
      console.error('❌ Error al eliminar acción:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de acciones requeridas por sucursal
   * @param {CollectionReference} accionesCollectionRef - Referencia a la colección de acciones requeridas
   * @returns {Promise<Object>} Estadísticas
   */
  static async obtenerEstadisticas(accionesCollectionRef) {
    try {
      if (!accionesCollectionRef) {
        throw new Error('AccionesRequeridasService: accionesCollectionRef es requerido');
      }

      const acciones = await this.obtenerAccionesPorSucursal(accionesCollectionRef);
      
      const estadisticas = {
        total: acciones.length,
        pendientes: acciones.filter(a => a.estado === 'pendiente').length,
        enProceso: acciones.filter(a => a.estado === 'en_proceso').length,
        completadas: acciones.filter(a => a.estado === 'completada').length,
        canceladas: acciones.filter(a => a.estado === 'cancelada').length,
        vencidas: acciones.filter(a => {
          if (!a.fechaVencimiento || a.estado === 'completada' || a.estado === 'cancelada') {
            return false;
          }
          let fechaVenc;
          if (a.fechaVencimiento.toDate && typeof a.fechaVencimiento.toDate === 'function') {
            fechaVenc = a.fechaVencimiento.toDate();
          } else if (a.fechaVencimiento instanceof Date) {
            fechaVenc = a.fechaVencimiento;
          } else if (typeof a.fechaVencimiento === 'string' || typeof a.fechaVencimiento === 'number') {
            fechaVenc = new Date(a.fechaVencimiento);
          } else {
            return false;
          }
          return fechaVenc < new Date();
        }).length
      };

      return estadisticas;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

export default AccionesRequeridasService;
