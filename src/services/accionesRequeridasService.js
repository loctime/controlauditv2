/**
 * Servicio para gestionar acciones requeridas en sucursales
 * Las acciones se almacenan en subcolecciones: sucursales/{sucursalId}/acciones_requeridas/{accionId}
 */
import { 
  collection, 
  doc, 
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
import { db } from '../firebaseAudit';

class AccionesRequeridasService {
  /**
   * Obtiene la referencia a la subcolección de acciones requeridas de una sucursal
   * @param {string} sucursalId - ID de la sucursal
   * @returns {CollectionReference} Referencia a la colección
   */
  static getAccionesCollection(sucursalId) {
    return collection(db, 'sucursales', sucursalId, 'acciones_requeridas');
  }

  /**
   * Obtiene la referencia a un documento de acción requerida
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} accionId - ID de la acción
   * @returns {DocumentReference} Referencia al documento
   */
  static getAccionDoc(sucursalId, accionId) {
    return doc(db, 'sucursales', sucursalId, 'acciones_requeridas', accionId);
  }

  /**
   * Crea una acción requerida desde un reporte
   * @param {string} reporteId - ID del reporte origen
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} empresaId - ID de la empresa
   * @param {Object} accionData - Datos de la acción (del array accionesRequeridas del reporte)
   * @returns {Promise<string>} ID de la acción creada
   */
  static async crearAccionDesdeReporte(reporteId, sucursalId, empresaId, accionData) {
    try {
      const accionCompleta = {
        ...accionData,
        reporteId,
        sucursalId,
        empresaId,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      const docRef = await addDoc(this.getAccionesCollection(sucursalId), accionCompleta);
      console.log(`✅ Acción requerida creada: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al crear acción requerida:', error);
      throw error;
    }
  }

  /**
   * Crea múltiples acciones requeridas desde un reporte
   * @param {string} reporteId - ID del reporte origen
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} empresaId - ID de la empresa
   * @param {Array} accionesData - Array de acciones requeridas del reporte
   * @returns {Promise<Array<string>>} IDs de las acciones creadas
   */
  static async crearAccionesDesdeReporte(reporteId, sucursalId, empresaId, accionesData) {
    if (!accionesData || accionesData.length === 0) {
      return [];
    }

    try {
      const promesas = accionesData.map(accion => 
        this.crearAccionDesdeReporte(reporteId, sucursalId, empresaId, accion)
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
   * @param {string} sucursalId - ID de la sucursal
   * @param {Object} filtros - Filtros opcionales
   * @param {string} filtros.estado - Filtrar por estado
   * @param {string} filtros.reporteId - Filtrar por reporte origen
   * @param {Date} filtros.fechaDesde - Filtrar desde fecha
   * @param {Date} filtros.fechaHasta - Filtrar hasta fecha
   * @returns {Promise<Array>} Array de acciones requeridas
   */
  static async obtenerAccionesPorSucursal(sucursalId, filtros = {}) {
    try {
      const accionesRef = this.getAccionesCollection(sucursalId);
      let q = query(accionesRef, orderBy('fechaCreacion', 'desc'));

      // Aplicar filtros
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
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} accionId - ID de la acción
   * @param {string} nuevoEstado - Nuevo estado: "pendiente" | "en_proceso" | "completada" | "cancelada"
   * @param {string} usuarioId - ID del usuario que actualiza
   * @param {string} usuarioNombre - Nombre del usuario
   * @param {string} comentario - Comentario opcional
   * @returns {Promise<void>}
   */
  static async actualizarEstadoAccion(sucursalId, accionId, nuevoEstado, usuarioId, usuarioNombre, comentario = null) {
    try {
      const accionRef = this.getAccionDoc(sucursalId, accionId);
      const accionDoc = await getDoc(accionRef);

      if (!accionDoc.exists()) {
        throw new Error('Acción requerida no encontrada');
      }

      const accionData = accionDoc.data();
      const updateData = {
        estado: nuevoEstado,
        fechaActualizacion: serverTimestamp()
      };

      // Si se marca como completada, agregar fecha y usuario
      if (nuevoEstado === 'completada') {
        updateData.fechaCompletada = serverTimestamp();
        updateData.completadaPor = usuarioId;
      } else if (nuevoEstado !== 'completada' && accionData.fechaCompletada) {
        // Si se cambia de completada a otro estado, limpiar datos
        updateData.fechaCompletada = null;
        updateData.completadaPor = null;
      }

      // Agregar comentario si se proporciona
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

      await updateDoc(accionRef, updateData);
      console.log(`✅ Estado de acción actualizado: ${accionId} -> ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error al actualizar estado de acción:', error);
      throw error;
    }
  }

  /**
   * Agrega un comentario a una acción requerida
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} accionId - ID de la acción
   * @param {string} comentario - Texto del comentario
   * @param {string} usuarioId - ID del usuario
   * @param {string} usuarioNombre - Nombre del usuario
   * @returns {Promise<void>}
   */
  static async agregarComentarioAccion(sucursalId, accionId, comentario, usuarioId, usuarioNombre) {
    try {
      const accionRef = this.getAccionDoc(sucursalId, accionId);
      const accionDoc = await getDoc(accionRef);

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

      await updateDoc(accionRef, {
        comentarios,
        fechaActualizacion: serverTimestamp()
      });

      console.log(`✅ Comentario agregado a acción: ${accionId}`);
    } catch (error) {
      console.error('❌ Error al agregar comentario:', error);
      throw error;
    }
  }

  /**
   * Registra una modificación en una acción requerida
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} accionId - ID de la acción
   * @param {string} modificacion - Texto de la modificación
   * @param {string} usuarioId - ID del usuario
   * @param {string} usuarioNombre - Nombre del usuario
   * @returns {Promise<void>}
   */
  static async agregarModificacionAccion(sucursalId, accionId, modificacion, usuarioId, usuarioNombre) {
    try {
      const accionRef = this.getAccionDoc(sucursalId, accionId);
      const accionDoc = await getDoc(accionRef);

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

      await updateDoc(accionRef, {
        modificaciones,
        fechaActualizacion: serverTimestamp()
      });

      console.log(`✅ Modificación registrada en acción: ${accionId}`);
    } catch (error) {
      console.error('❌ Error al registrar modificación:', error);
      throw error;
    }
  }

  /**
   * Actualiza el texto de una acción requerida
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} accionId - ID de la acción
   * @param {string} nuevoTexto - Nuevo texto de la acción
   * @param {string} usuarioId - ID del usuario
   * @param {string} usuarioNombre - Nombre del usuario
   * @returns {Promise<void>}
   */
  static async actualizarTextoAccion(sucursalId, accionId, nuevoTexto, usuarioId, usuarioNombre) {
    try {
      const accionRef = this.getAccionDoc(sucursalId, accionId);
      
      // Registrar modificación
      await this.agregarModificacionAccion(
        sucursalId, 
        accionId, 
        `Texto actualizado: "${nuevoTexto}"`, 
        usuarioId, 
        usuarioNombre
      );

      // Actualizar texto
      await updateDoc(accionRef, {
        accionTexto: nuevoTexto,
        fechaActualizacion: serverTimestamp()
      });

      console.log(`✅ Texto de acción actualizado: ${accionId}`);
    } catch (error) {
      console.error('❌ Error al actualizar texto de acción:', error);
      throw error;
    }
  }

  /**
   * Elimina una acción requerida
   * @param {string} sucursalId - ID de la sucursal
   * @param {string} accionId - ID de la acción
   * @returns {Promise<void>}
   */
  static async eliminarAccion(sucursalId, accionId) {
    try {
      const accionRef = this.getAccionDoc(sucursalId, accionId);
      await deleteDoc(accionRef);
      console.log(`✅ Acción eliminada: ${accionId}`);
    } catch (error) {
      console.error('❌ Error al eliminar acción:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de acciones requeridas por sucursal
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Object>} Estadísticas
   */
  static async obtenerEstadisticas(sucursalId) {
    try {
      const acciones = await this.obtenerAccionesPorSucursal(sucursalId);
      
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
          // Manejar diferentes formatos de fecha (Timestamp de Firestore, Date, string)
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

