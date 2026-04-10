import logger from '@/utils/logger';
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
import { uploadFiles, buildLegacyImageMirror, listFiles, softDeleteFile } from './unifiedFileService';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { auth } from '../firebaseControlFile';
import { registrosAccidenteService } from './registrosAccidenteService';

// Referencia a la colecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de logs
const logsCollectionRef = collection(db, 'logs_operarios');

/**
 * Servicio para gestiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de accidentes e incidentes
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

const resolveModuleByTipo = (tipo) => (tipo === 'incidente' ? 'incidentes' : 'accidentes');

const enrichAccidenteWithCanonicalFiles = async (accidenteDoc, ownerId) => {
  if (!accidenteDoc?.id || !ownerId) {
    return normalizeAccidente(accidenteDoc);
  }

  let canonicalFiles = [];
  try {
    canonicalFiles = await listFiles({
      ownerId,
      module: resolveModuleByTipo(accidenteDoc.tipo),
      entityId: String(accidenteDoc.id)
    });
  } catch (_error) {
    canonicalFiles = [];
  }

  const legacyImagenes = Array.isArray(accidenteDoc.imagenes) ? accidenteDoc.imagenes : [];
  return normalizeAccidente({
    ...accidenteDoc,
    files: canonicalFiles,
    imagenes: canonicalFiles.length > 0 ? buildLegacyImageMirror(canonicalFiles) : legacyImagenes
  });
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

    let uploadedFileRefs = [];
    // Subir imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes si existen
    if (imagenes && imagenes.length > 0) {
      uploadedFileRefs = await subirImagenes(docRef.id, imagenes, accidenteData.empresaId, {
        ownerId,
        uploadedBy: actorId,
        module: 'accidentes',
        contextType: 'accidente',
        contextEventName: accidenteData.contextEventName,
        empresaNombre: accidenteData.empresaNombre,
        sucursalNombre: accidenteData.sucursalNombre
      });

    }

    // Actualizar estado de empleados con dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as de reposo
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
        logger.warn('No se pudo actualizar fechaUltimoAccidente en sucursal:', error);
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

    // Crear primer registro de seguimiento para que el panel lateral muestre datos
    try {
      const evidencias = (uploadedFileRefs && uploadedFileRefs.length > 0)
        ? uploadedFileRefs.map((fileRef) => ({ id: fileRef.fileId, fileId: fileRef.fileId, shareToken: fileRef.shareToken || null, nombre: fileRef.name }))
        : [];
      await registrosAccidenteService.createRegistry({
        ownerId,
        entityId: docRef.id,
        personas: empleadosInvolucrados,
        evidencias,
        metadata: {
          fecha: Timestamp.now(),
          descripcion: accidenteData.descripcion || 'Registro inicial',
          creadoPor: actorId
        }
      });
    } catch (regErr) {
      logger.warn('No se pudo crear el registro inicial del accidente (el accidente se creÃƒÂ³ correctamente):', regErr);
    }

    const result = { id: docRef.id, ...accidenteDoc };
    return await enrichAccidenteWithCanonicalFiles(result, ownerId);
  } catch (error) {
    logger.error('Error al crear accidente:', error);
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

    // Subir imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes si existen
    if (imagenes && imagenes.length > 0) {
      await subirImagenes(docRef.id, imagenes, incidenteData.empresaId, {
        ownerId,
        uploadedBy: actorId,
        module: 'incidentes',
        contextType: 'incidente',
        contextEventName: incidenteData.contextEventName,
        empresaNombre: incidenteData.empresaNombre,
        sucursalNombre: incidenteData.sucursalNombre
      });

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
    return await enrichAccidenteWithCanonicalFiles(result, ownerId);
  } catch (error) {
    logger.error('Error al crear incidente:', error);
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
    logger.error('Error al actualizar estado de empleado:', error);
    throw error;
  }
};

/**
 * Subir imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes usando el nuevo modelo de contexto de evento
 * FunciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n interna que usa uploadFileWithContext()
 * 
 * @private
 * @deprecated Esta funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n serÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ removida en IteraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n 2 cuando todos los componentes migren
 */
const subirImagenesNew = async (accidenteId, imagenes, companyId = 'system', options = {}) => {
  const {
    ownerId,
    uploadedBy = null,
    module = 'accidentes',
    contextType = 'accidente',
    contextEventName = null,
    empresaNombre = null,
    sucursalNombre = null
  } = options;

  try {
    if (!ownerId) {
      throw new Error('ownerId es requerido para persistir FileRef en subcoleccion files');
    }

    const uploadResult = await uploadFiles({
      ownerId,
      module,
      entityId: String(accidenteId),
      companyId: empresaNombre || companyId,
      files: imagenes,
      uploadedBy,
      contextType,
      tipoArchivo: 'evidencia',
      entityCollection: 'accidentes',
      contextEventName,
      sucursalId: sucursalNombre
    });


    // Espejo legacy temporal para mantener pantallas existentes.
    return uploadResult.fileRefs;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`[accidenteService] Error al subir imagenes (${imagenes?.length || 0} total):`, errorMsg);
    throw error;
  }
};

export const subirImagenes = async (accidenteId, imagenes, companyId = 'system', options = {}) => {
  return await subirImagenesNew(accidenteId, imagenes, companyId, options);
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
      q = query(accidentesRef, ...conditions);
    } else {
      q = query(accidentesRef);
    }

    logger.debug(`[accidenteService] Query conditions:`, conditions);
    logger.debug(`[accidenteService] Collection path:`, ...firestoreRoutesCore.accidentes(ownerId));

    const snapshot = await getDocs(q);
    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    rows.sort((a, b) => {
      const fechaA = a.fecha?.toMillis?.() ?? a.fechaHora?.toMillis?.() ?? 0;
      const fechaB = b.fecha?.toMillis?.() ?? b.fechaHora?.toMillis?.() ?? 0;
      return fechaB - fechaA;
    });
    
    logger.debug(`[accidenteService] Query with filters:`, filtros);
    logger.debug(`[accidenteService] Found ${rows.length} accidents`);
    if (rows.length > 0) {
      logger.debug(`[accidenteService] First accident data sample:`, rows[0]);
    }
    
    return await Promise.all(rows.map((row) => enrichAccidenteWithCanonicalFiles(row, ownerId)));
  } catch (error) {
    logger.error('Error al obtener accidentes:', error);
    throw error;
  }
};

// Obtener un accidente especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­fico
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
      return await enrichAccidenteWithCanonicalFiles(data, ownerId);
    }
    return null;
  } catch (error) {
    logger.error('Error al obtener accidente:', error);
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
            logger.error(`Error reactivando empleado ${emp.empleadoId}:`, err)
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
    logger.error('Error al actualizar estado de accidente:', error);
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
    logger.error('Error al obtener empleados:', error);
    throw error;
  }
};

// Obtener estadÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­sticas de accidentes por empresa
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
    logger.error('Error al obtener estadÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­sticas:', error);
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
    logger.error('Error al eliminar accidente:', error);
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

    const deletedFileDocIds = Array.isArray(datosActualizados?.deletedFileDocIds)
      ? datosActualizados.deletedFileDocIds.filter(Boolean)
      : [];

    const updateData = {
      ...datosActualizados,
      updatedAt: Timestamp.now(),
      actualizadoPor: userId || userProfile?.uid || null
    };

    delete updateData.imagenes;
    delete updateData.deletedFileDocIds;

    // Si hay nuevas imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes, subirlas
    if (imagenesNuevas && imagenesNuevas.length > 0) {
      const accidenteData = accidenteDoc.data();
      const empresaId = datosActualizados.empresaId || accidenteData.empresaId || 'system';
      await subirImagenes(accidenteId, imagenesNuevas, empresaId, {
        ownerId,
        uploadedBy: userId || userProfile?.uid || null,
        module: resolveModuleByTipo(accidenteDoc.data()?.tipo),
        contextType: accidenteDoc.data()?.tipo === 'incidente' ? 'incidente' : 'accidente'
      });
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

    if (deletedFileDocIds.length > 0) {
      await Promise.all(
        deletedFileDocIds.map((fileDocId) =>
          softDeleteFile({
            ownerId,
            module: resolveModuleByTipo(updateData.tipo || accidenteDoc.data()?.tipo),
            entityId: accidenteId,
            fileDocId,
            deletedBy: userId || userProfile?.uid || null
          }).catch((error) => logger.error('[accidenteService] Error soft delete', fileDocId, error))
        )
      );
    }

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

    const result = { ...accidenteDoc.data(), ...updateData, id: accidenteId };
    return await enrichAccidenteWithCanonicalFiles(result, ownerId);
  } catch (error) {
    logger.error('Error al actualizar accidente:', error);
    throw error;
  }
};






















export const obtenerArchivosAccidente = async ({ ownerId, accidenteId, tipo = 'accidente' }) => {
  if (!ownerId || !accidenteId) return [];
  return await listFiles({ ownerId, module: resolveModuleByTipo(tipo), entityId: String(accidenteId) });
};



