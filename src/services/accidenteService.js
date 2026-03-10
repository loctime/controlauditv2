import { 
  collection, 
  getDocs, 
  doc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc,
  arrayUnion
} from 'firebase/firestore';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
import { db } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { getDownloadUrl } from './controlFileB2Service';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { uploadFileWithContext } from './unifiedFileUploadService';
import { auth } from '../firebaseControlFile';

// Referencia a la colecciÃƒÆ’Ã‚Â³n de logs
const logsCollectionRef = collection(db, 'logs_operarios');

/**
 * Servicio para gestiÃƒÆ’Ã‚Â³n de accidentes e incidentes
 */

/**
 * Normaliza un documento de accidente/incidente para unificar campos legacy
 * @param {Object} doc - Documento de Firestore
 * @returns {Object} Documento normalizado
 */
const normalizeAccidente = (doc) => {
  if (!doc) return doc;
  const fecha = doc.fecha ?? doc.fechaHora ?? null;
  const closedAt = doc.closedAt ?? doc.fechaCierre ?? null;

  return {
    ...doc,
    fecha,
    fechaHora: fecha,
    fechaCreacion: doc.fechaCreacion ?? doc.createdAt ?? null,
    closedAt,
    fechaCierre: closedAt,
    activa: doc.activa ?? true,
  };
};

const resolveAccidenteContext = (contextOrAccidenteId, maybeUserProfile = null) => {
  if (contextOrAccidenteId && typeof contextOrAccidenteId === 'object' && !Array.isArray(contextOrAccidenteId)) {
    return {
      ownerId: contextOrAccidenteId.ownerId || contextOrAccidenteId.userProfile?.ownerId || null,
      accidenteId: contextOrAccidenteId.accidenteId || contextOrAccidenteId.id || null
    };
  }

  return {
    ownerId: maybeUserProfile?.ownerId || null,
    accidenteId: contextOrAccidenteId || null
  };
};

// Crear un nuevo accidente
export const crearAccidente = async (accidenteData, empleadosSeleccionados, imagenes = [], userProfile) => {
  try {
    // Preparar datos de empleados involucrados
    const empleadosInvolucrados = empleadosSeleccionados.map(emp => ({
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      conReposo: emp.conReposo || false,
      fechaInicioReposo: emp.conReposo ? Timestamp.now() : null
    }));

    // Crear documento del accidente
    const fechaAccidente = accidenteData.fechaAccidente 
      ? Timestamp.fromDate(new Date(accidenteData.fechaAccidente))
      : Timestamp.now();

    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const actorId = accidenteData.reportadoPor || userProfile?.uid || null;

    const accidenteDoc = {
      ownerId,
      empresaId: accidenteData.empresaId,
      sucursalId: accidenteData.sucursalId,
      tipo: 'accidente',
      empleadosInvolucrados,
      descripcion: accidenteData.descripcion || '',
      imagenes: [],
      fecha: fechaAccidente,
      fechaHora: fechaAccidente,
      creadoPor: actorId,
      actualizadoPor: actorId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      reportadoPor: accidenteData.reportadoPor,
      estado: 'abierto',
      historialEstado: [{ from: null, to: 'abierto', by: actorId, at: Timestamp.now(), motivo: 'creacion' }],
      cerradoPor: null,
      closedAt: null
    };
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    const docRef = await addDocWithAppId(accidentesRef, accidenteDoc);

    // Subir imÃƒÆ’Ã‚Â¡genes si existen
    if (imagenes && imagenes.length > 0) {
      const imagenesUrls = await subirImagenes(docRef.id, imagenes, accidenteData.empresaId);
      await updateDocWithAppId(docRef, { imagenes: imagenesUrls });
    }

    // Actualizar estado de empleados con dÃƒÆ’Ã‚Â­as de reposo
    for (const emp of empleadosSeleccionados) {
      if (emp.conReposo) {
        await actualizarEstadoEmpleado(emp.id, 'inactivo', Timestamp.now(), userProfile);
      }
    }

    // Actualizar fechaUltimoAccidente en la sucursal
    if (accidenteData.sucursalId) {
      try {
        const sucursalRef = doc(db, ...firestoreRoutesCore.sucursales(ownerId), accidenteData.sucursalId);
        await updateDocWithAppId(sucursalRef, {
          fechaUltimoAccidente: Timestamp.now()
        });
      } catch (error) {
        console.warn('No se pudo actualizar fechaUltimoAccidente en sucursal:', error);
        // No fallar si no se puede actualizar, es un campo opcional
      }
    }

    // Registrar log
    // registrarAccionSistema maneja la ruta internamente
    await registrarAccionSistema(
      accidenteData.reportadoPor,
      `Accidente reportado: ${empleadosInvolucrados.length} empleado(s) involucrado(s)`,
      {
        accidenteId: docRef.id,
        empleados: empleadosInvolucrados.map(e => e.empleadoNombre).join(', '),
        descripcion: accidenteData.descripcion
      },
      'crear',
      'accidente',
      docRef.id,
      logsCollectionRef
    );

    const result = { id: docRef.id, ...accidenteDoc };
    return normalizeAccidente(result);
  } catch (error) {
    console.error('Error al crear accidente:', error);
    throw error;
  }
};

// Crear un nuevo incidente
export const crearIncidente = async (incidenteData, testigos = [], imagenes = [], userProfile) => {
  try {
    // Preparar datos de testigos
    const testigosArray = testigos.map(emp => ({
      empleadoId: emp.id,
      empleadoNombre: emp.nombre
    }));

    // Crear documento del incidente
    const fechaIncidente = incidenteData.fechaIncidente 
      ? Timestamp.fromDate(new Date(incidenteData.fechaIncidente))
      : Timestamp.now();

    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const actorId = incidenteData.reportadoPor || userProfile?.uid || null;

    const incidenteDoc = {
      ownerId,
      empresaId: incidenteData.empresaId,
      sucursalId: incidenteData.sucursalId,
      tipo: 'incidente',
      testigos: testigosArray,
      empleadosInvolucrados: [], // Los incidentes no tienen empleados con reposo
      descripcion: incidenteData.descripcion || '',
      imagenes: [],
      fecha: fechaIncidente,
      fechaHora: fechaIncidente,
      creadoPor: actorId,
      actualizadoPor: actorId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      reportadoPor: incidenteData.reportadoPor,
      estado: 'abierto',
      historialEstado: [{ from: null, to: 'abierto', by: actorId, at: Timestamp.now(), motivo: 'creacion' }],
      cerradoPor: null,
      closedAt: null
    };
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    const docRef = await addDocWithAppId(accidentesRef, incidenteDoc);

    // Subir imÃƒÆ’Ã‚Â¡genes si existen
    if (imagenes && imagenes.length > 0) {
      const imagenesUrls = await subirImagenes(docRef.id, imagenes, incidenteData.empresaId);
      await updateDocWithAppId(docRef, { imagenes: imagenesUrls });
    }

    // Registrar log (registrarAccionSistema maneja la ruta internamente)
    await registrarAccionSistema(
      incidenteData.reportadoPor,
      `Incidente reportado: ${testigosArray.length} testigo(s)`,
      {
        incidenteId: docRef.id,
        testigos: testigosArray.map(t => t.empleadoNombre).join(', '),
        descripcion: incidenteData.descripcion
      },
      'crear',
      'incidente',
      docRef.id
    );

    const result = { id: docRef.id, ...incidenteDoc };
    return normalizeAccidente(result);
  } catch (error) {
    console.error('Error al crear incidente:', error);
    throw error;
  }
};

// Actualizar estado de empleado
export const actualizarEstadoEmpleado = async (empleadoId, estado, fechaInicioReposo = null, userProfile) => {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const empleadoRef = doc(db, ...firestoreRoutesCore.empleado(ownerId, empleadoId));
    const updateData = { estado };
    
    if (fechaInicioReposo) {
      updateData.fechaInicioReposo = fechaInicioReposo;
    }
    
    await updateDocWithAppId(empleadoRef, updateData);
  } catch (error) {
    console.error('Error al actualizar estado de empleado:', error);
    throw error;
  }
};

/**
 * Subir imÃƒÆ’Ã‚Â¡genes usando el nuevo modelo de contexto de evento
 * FunciÃƒÆ’Ã‚Â³n interna que usa uploadFileWithContext()
 * 
 * @private
 * @deprecated Esta funciÃƒÆ’Ã‚Â³n serÃƒÆ’Ã‚Â¡ removida en IteraciÃƒÆ’Ã‚Â³n 2 cuando todos los componentes migren
 */
const subirImagenesNew = async (accidenteId, imagenes, companyId = 'system') => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    const userId = user.uid;

    console.log(`[accidenteService] ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¤ [v1.0] Subiendo ${imagenes.length} imagen(es) con modelo de contexto: accidente/${accidenteId}/evidencia`);

    const urls = [];
    
    for (let i = 0; i < imagenes.length; i++) {
      const imagen = imagenes[i];
      try {
        // Usar el nuevo servicio unificado
        const result = await uploadFileWithContext({
          file: imagen,
          context: {
            contextType: 'accidente',
            contextEventId: accidenteId,
            companyId,
            tipoArchivo: 'evidencia'
          },
          fecha: new Date(),
          uploadedBy: userId
        });
        
        // Obtener URL de descarga temporal
        const url = await getDownloadUrl(result.fileId);
        urls.push(url);
        
        console.log(`[accidenteService] ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ [v1.0] Imagen ${i + 1}/${imagenes.length} subida exitosamente`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[accidenteService] ÃƒÂ¢Ã‚ÂÃ…â€™ [v1.0] Error al subir imagen ${i + 1}/${imagenes.length}:`, errorMsg);
        // Continuar con las demÃƒÆ’Ã‚Â¡s imÃƒÆ’Ã‚Â¡genes aunque una falle
      }
    }
    
    if (urls.length === 0) {
      throw new Error('No se pudo subir ninguna imagen');
    }
    
    return urls;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[accidenteService] ÃƒÂ¢Ã‚ÂÃ…â€™ [v1.0] Error al subir imÃƒÆ’Ã‚Â¡genes (${imagenes.length} total):`, errorMsg);
    throw error;
  }
};

/**
 * Subir imÃƒÆ’Ã‚Â¡genes a ControlFile
 * 
 * @deprecated Esta funciÃƒÆ’Ã‚Â³n ahora usa internamente el nuevo modelo de contexto de evento (v1.0).
 * Se mantiene la API existente para compatibilidad total con cÃƒÆ’Ã‚Â³digo legacy.
 * 
 * MigraciÃƒÆ’Ã‚Â³n: Los componentes deberÃƒÆ’Ã‚Â­an migrar a usar uploadFileWithContext() directamente.
 * Esta funciÃƒÆ’Ã‚Â³n serÃƒÆ’Ã‚Â¡ removida en IteraciÃƒÆ’Ã‚Â³n 2 cuando todos los componentes migren.
 * 
 * @param {string} accidenteId - ID del accidente
 * @param {File[]} imagenes - Array de archivos de imagen
 * @param {string} companyId - ID de la empresa (default: 'system')
 * @returns {Promise<string[]>} Array de URLs de descarga temporal
 */
export const subirImagenes = async (accidenteId, imagenes, companyId = 'system') => {
  // Legacy retirado intencionalmente: solo flujo unificado con uploadFileWithContext.
  return await subirImagenesNew(accidenteId, imagenes, companyId);
};

// Obtener accidentes con filtros funcionales
export const obtenerAccidentes = async (filtros = {}, userProfile) => {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    
    const conditions = [];

    if (filtros.empresaId) {
      conditions.push(where('empresaId', '==', filtros.empresaId));
    }

    if (filtros.sucursalId) {
      conditions.push(where('sucursalId', '==', filtros.sucursalId));
    }

    if (filtros.tipo) {
      conditions.push(where('tipo', '==', filtros.tipo));
    }

    if (filtros.estado) {
      conditions.push(where('estado', '==', filtros.estado));
    }

    let q;
    if (conditions.length > 0) {
      q = query(accidentesRef, ...conditions, orderBy('fecha', 'desc'));
    } else {
      q = query(accidentesRef, orderBy('fecha', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      return normalizeAccidente(data);
    });
  } catch (error) {
    console.error('Error al obtener accidentes:', error);
    throw error;
  }
};

// Obtener un accidente especÃƒÆ’Ã‚Â­fico
export const obtenerAccidentePorId = async (contextOrAccidenteId, maybeUserProfile = null) => {
  try {
    const { ownerId, accidenteId } = resolveAccidenteContext(contextOrAccidenteId, maybeUserProfile);
    if (!ownerId) throw new Error('ownerId es requerido');
    if (!accidenteId) throw new Error('accidenteId es requerido');
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    const docRef = doc(accidentesRef, String(accidenteId));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      return normalizeAccidente(data);
    }
    return null;
  } catch (error) {
    console.error('Error al obtener accidente:', error);
    throw error;
  }
};

// Actualizar estado de accidente/incidente
export const actualizarEstadoAccidente = async (accidenteId, nuevoEstado, userId = null, userProfile) => {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    const accidenteRef = doc(accidentesRef, accidenteId);
    const accidenteDoc = await getDoc(accidenteRef);
    const tipo = accidenteDoc.data()?.tipo || 'accidente';
    const actorId = userId || userProfile?.uid || null;
    const estadoAnterior = accidenteDoc.data()?.estado || null;
    const updateData = {
      estado: nuevoEstado,
      updatedAt: Timestamp.now(),
      actualizadoPor: actorId
    };

    if (nuevoEstado === 'cerrado' && tipo === 'accidente') {
      const empleadosInvolucrados = accidenteDoc.data()?.empleadosInvolucrados || [];
      const fechaCierre = Timestamp.now();
      const fechaCierreDate = fechaCierre.toDate();

      const empleadosActualizados = empleadosInvolucrados.map(emp => {
        if (emp.conReposo && emp.fechaInicioReposo) {
          const fechaInicioReposo = emp.fechaInicioReposo?.toDate
            ? emp.fechaInicioReposo.toDate()
            : new Date(emp.fechaInicioReposo);

          const diasPerdidos = Math.max(0, Math.ceil((fechaCierreDate - fechaInicioReposo) / (1000 * 60 * 60 * 24)));

          actualizarEstadoEmpleado(emp.empleadoId, 'activo', null, userProfile).catch(err =>
            console.error(`Error reactivando empleado ${emp.empleadoId}:`, err)
          );

          return {
            ...emp,
            diasPerdidos,
            fechaFinReposo: fechaCierre
          };
        }
        return emp;
      });

      updateData.empleadosInvolucrados = empleadosActualizados;
      updateData.fechaCierre = fechaCierre;
      updateData.closedAt = fechaCierre;
      updateData.cerradoPor = actorId;
    }

    if (nuevoEstado && nuevoEstado !== estadoAnterior) {
      updateData.historialEstado = arrayUnion({
        from: estadoAnterior,
        to: nuevoEstado,
        by: actorId,
        at: Timestamp.now(),
        motivo: nuevoEstado === 'cerrado' ? 'cierre' : 'actualizacion_estado'
      });
    }

    await updateDocWithAppId(accidenteRef, updateData);

    if (userId) {
      await registrarAccionSistema(
        userId,
        `Estado de ${tipo} actualizado a: ${nuevoEstado}`,
        {
          accidenteId,
          estadoAnterior,
          estadoNuevo: nuevoEstado
        },
        'editar',
        tipo,
        accidenteId
      );
    }
  } catch (error) {
    console.error('Error al actualizar estado de accidente:', error);
    throw error;
  }
};
// Obtener empleados por sucursal (para los selectores)
// Incluye todos los empleados (activos e inactivos) para permitir reportar accidentes previos
export const obtenerEmpleadosPorSucursal = async (sucursalId, userProfile) => {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const empleadosRef = collection(db, ...firestoreRoutesCore.empleados(ownerId));
    const q = query(
      empleadosRef,
      where('sucursalId', '==', sucursalId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    throw error;
  }
};

// Obtener estadÃƒÆ’Ã‚Â­sticas de accidentes por empresa
export const obtenerEstadisticas = async (empresaId, userProfile) => {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    const q = query(
      accidentesRef,
      where('empresaId', '==', empresaId)
    );
    
    const snapshot = await getDocs(q);
    const accidentes = snapshot.docs.map(doc => {
      const data = doc.data();
      return normalizeAccidente(data);
    });
    
    return {
      total: accidentes.length,
      accidentes: accidentes.filter(a => a.tipo === 'accidente').length,
      incidentes: accidentes.filter(a => a.tipo === 'incidente').length,
      abiertos: accidentes.filter(a => a.estado === 'abierto').length,
      cerrados: accidentes.filter(a => a.estado === 'cerrado').length
    };
  } catch (error) {
    console.error('Error al obtener estadÃƒÆ’Ã‚Â­sticas:', error);
    throw error;
  }
};

// Eliminar accidente/incidente
export const eliminarAccidente = async (accidenteId, userId = null, userProfile) => {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    const accidenteRef = doc(accidentesRef, accidenteId);
    const accidenteDoc = await getDoc(accidenteRef);
    
    if (!accidenteDoc.exists()) {
      throw new Error('Accidente no encontrado');
    }

    const accidenteData = accidenteDoc.data();
    
    // Eliminar documento de Firestore
    await deleteDocWithAppId(accidenteRef);

    // Registrar log
    if (userId) {
      // registrarAccionSistema maneja la ruta internamente
      await registrarAccionSistema(
        userId,
        'Accidente/incidente eliminado',
        { accidenteId, tipo: accidenteData.tipo },
        'eliminar',
        'accidente',
        accidenteId
      );
    }
  } catch (error) {
    console.error('Error al eliminar accidente:', error);
    throw error;
  }
};

// Actualizar accidente/incidente
export const actualizarAccidente = async (accidenteId, datosActualizados, imagenesNuevas = [], userId = null, userProfile) => {
  try {
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    const accidenteRef = doc(accidentesRef, accidenteId);
    const accidenteDoc = await getDoc(accidenteRef);
    
    if (!accidenteDoc.exists()) {
      throw new Error('Accidente no encontrado');
    }

    const updateData = {
      ...datosActualizados,
      updatedAt: Timestamp.now(),
      actualizadoPor: userId || userProfile?.uid || null
    };

    // Si hay nuevas imÃƒÆ’Ã‚Â¡genes, subirlas
    if (imagenesNuevas && imagenesNuevas.length > 0) {
      const accidenteData = accidenteDoc.data();
      const empresaId = datosActualizados.empresaId || accidenteData.empresaId || 'system';
      const nuevasUrls = await subirImagenes(accidenteId, imagenesNuevas, empresaId);
      // Si ya vienen imÃƒÆ’Ã‚Â¡genes en datosActualizados (despuÃƒÆ’Ã‚Â©s de eliminar algunas), usar esas
      // Si no, usar las existentes del documento
      const imagenesBase = updateData.imagenes || accidenteDoc.data().imagenes || [];
      updateData.imagenes = [...imagenesBase, ...nuevasUrls];
    } else if (!updateData.imagenes) {
      // Si no hay nuevas imÃƒÆ’Ã‚Â¡genes pero no se enviaron imÃƒÆ’Ã‚Â¡genes en datosActualizados,
      // mantener las existentes
      updateData.imagenes = accidenteDoc.data().imagenes || [];
    }

    const actorId = userId || userProfile?.uid || null;
    if (datosActualizados.estado && datosActualizados.estado !== accidenteDoc.data()?.estado) {
      updateData.historialEstado = arrayUnion({
        from: accidenteDoc.data()?.estado || null,
        to: datosActualizados.estado,
        by: actorId,
        at: Timestamp.now(),
        motivo: 'actualizacion_estado'
      });
    }

    await updateDocWithAppId(accidenteRef, updateData);

    // Registrar log
    if (userId) {
      // registrarAccionSistema maneja la ruta internamente
      await registrarAccionSistema(
        userId,
        'Accidente/incidente actualizado',
        { accidenteId, cambios: Object.keys(updateData) },
        'editar',
        accidenteDoc.data().tipo,
        accidenteId
      );
    }

    const result = { id: accidenteId, ...updateData };
    return normalizeAccidente(result);
  } catch (error) {
    console.error('Error al actualizar accidente:', error);
    throw error;
  }
};
















