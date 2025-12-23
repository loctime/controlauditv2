import { 
  collection, 
  getDocs, 
  doc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
import { db, auditUserCollection } from '../firebaseControlFile';
import { uploadEvidence, getDownloadUrl } from './controlFileB2Service';
import { getControlFileFolders } from './controlFileInit';
import { registrarAccionSistema } from '../utils/firestoreUtils';

/**
 * Servicio para gestión de accidentes e incidentes
 */

/**
 * Normaliza un documento de accidente/incidente para unificar campos legacy
 * @param {Object} doc - Documento de Firestore
 * @returns {Object} Documento normalizado
 */
const normalizeAccidente = (doc) => {
  if (!doc) return doc;
  
  return {
    ...doc,
    fechaCreacion: doc.fechaCreacion ?? doc.createdAt ?? null,
    activa: doc.activa ?? true,
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
    
    const accidenteDoc = {
      empresaId: accidenteData.empresaId,
      sucursalId: accidenteData.sucursalId,
      tipo: 'accidente',
      empleadosInvolucrados,
      descripcion: accidenteData.descripcion || '',
      imagenes: [],
      fechaHora: fechaAccidente,
      createdAt: Timestamp.now(),
      reportadoPor: accidenteData.reportadoPor,
      estado: 'abierto'
    };

    const accidentesRef = auditUserCollection(userProfile.uid, 'accidentes');
    const docRef = await addDocWithAppId(accidentesRef, accidenteDoc);

    // Subir imágenes si existen
    if (imagenes && imagenes.length > 0) {
      const imagenesUrls = await subirImagenes(docRef.id, imagenes, accidenteData.empresaId);
      await updateDocWithAppId(docRef, { imagenes: imagenesUrls });
    }

    // Actualizar estado de empleados con días de reposo
    for (const emp of empleadosSeleccionados) {
      if (emp.conReposo) {
        await actualizarEstadoEmpleado(emp.id, 'inactivo', Timestamp.now(), userProfile);
      }
    }

    // Actualizar fechaUltimoAccidente en la sucursal
    if (accidenteData.sucursalId) {
      try {
        const sucursalesRef = auditUserCollection(userProfile.uid, 'sucursales');
        const sucursalRef = doc(sucursalesRef, accidenteData.sucursalId);
        await updateDocWithAppId(sucursalRef, {
          fechaUltimoAccidente: Timestamp.now()
        });
      } catch (error) {
        console.warn('No se pudo actualizar fechaUltimoAccidente en sucursal:', error);
        // No fallar si no se puede actualizar, es un campo opcional
      }
    }

    // Registrar log
    const logsCollectionRef = auditUserCollection(userProfile.uid, 'logs');
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
    
    const incidenteDoc = {
      empresaId: incidenteData.empresaId,
      sucursalId: incidenteData.sucursalId,
      tipo: 'incidente',
      testigos: testigosArray,
      empleadosInvolucrados: [], // Los incidentes no tienen empleados con reposo
      descripcion: incidenteData.descripcion || '',
      imagenes: [],
      fechaHora: fechaIncidente,
      createdAt: Timestamp.now(),
      reportadoPor: incidenteData.reportadoPor,
      estado: 'abierto'
    };

    const accidentesRef = auditUserCollection(userProfile.uid, 'accidentes');
    const docRef = await addDocWithAppId(accidentesRef, incidenteDoc);

    // Subir imágenes si existen
    if (imagenes && imagenes.length > 0) {
      const imagenesUrls = await subirImagenes(docRef.id, imagenes, incidenteData.empresaId);
      await updateDocWithAppId(docRef, { imagenes: imagenesUrls });
    }

    // Registrar log
    const logsCollectionRef = auditUserCollection(userProfile.uid, 'logs');
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
      docRef.id,
      logsCollectionRef
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
    if (!userProfile?.uid) {
      throw new Error('userProfile.uid es requerido para actualizar empleado');
    }
    const empleadosRef = auditUserCollection(userProfile.uid, 'empleados');
    const empleadoRef = doc(empleadosRef, empleadoId);
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

// Subir imágenes a ControlFile
export const subirImagenes = async (accidenteId, imagenes, companyId = 'system') => {
  try {
    // Obtener carpeta de accidentes desde ControlFile
    let folderIdAccidentes = null;
    try {
      const folders = await getControlFileFolders();
      folderIdAccidentes = folders.subFolders?.accidentes;
      if (!folderIdAccidentes) {
        console.warn('[accidenteService] ⚠️ No se encontró carpeta de accidentes, usando raíz');
      }
    } catch (error) {
      console.error('[accidenteService] Error al obtener carpetas ControlFile:', error);
    }
    
    const urls = [];
    
    for (let i = 0; i < imagenes.length; i++) {
      const imagen = imagenes[i];
      try {
        // Subir imagen a ControlFile usando uploadEvidence
        const result = await uploadEvidence({
          file: imagen,
          auditId: `accidente_${accidenteId}`,
          companyId: companyId,
          parentId: folderIdAccidentes
        });
        
        // Obtener URL de descarga temporal
        const url = await getDownloadUrl(result.fileId);
        urls.push(url);
        
        console.log(`[accidenteService] ✅ Imagen ${i + 1}/${imagenes.length} subida a ControlFile`);
      } catch (error) {
        console.error(`[accidenteService] Error al subir imagen ${i + 1}:`, error);
        // Continuar con las demás imágenes aunque una falle
      }
    }
    
    return urls;
  } catch (error) {
    console.error('[accidenteService] Error al subir imágenes:', error);
    throw error;
  }
};

// Obtener accidentes con filtros funcionales
export const obtenerAccidentes = async (filtros = {}, userProfile) => {
  try {
    const accidentesRef = auditUserCollection(userProfile.uid, 'accidentes');
    
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
      q = query(accidentesRef, ...conditions, orderBy('fechaHora', 'desc'));
    } else {
      q = query(accidentesRef, orderBy('fechaHora', 'desc'));
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

// Obtener un accidente específico
export const obtenerAccidentePorId = async (accidenteId, userProfile) => {
  try {
    const accidentesRef = auditUserCollection(userProfile.uid, 'accidentes');
    const docRef = doc(accidentesRef, accidenteId);
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
    const accidentesRef = auditUserCollection(userProfile.uid, 'accidentes');
    const accidenteRef = doc(accidentesRef, accidenteId);
    const accidenteDoc = await getDoc(accidenteRef);
    const tipo = accidenteDoc.data()?.tipo || 'accidente';
    const fechaAccidente = accidenteDoc.data()?.fechaHora;
    const updateData = { estado: nuevoEstado };
    
    // Si se está cerrando un accidente y tiene empleados con reposo
    if (nuevoEstado === 'cerrado' && tipo === 'accidente') {
      const empleadosInvolucrados = accidenteDoc.data()?.empleadosInvolucrados || [];
      const fechaCierre = Timestamp.now();
      const fechaAccidenteDate = fechaAccidente?.toDate ? fechaAccidente.toDate() : new Date(fechaAccidente);
      const fechaCierreDate = fechaCierre.toDate();
      
      // Calcular días perdidos para cada empleado y actualizar empleados
      const empleadosActualizados = empleadosInvolucrados.map(emp => {
        if (emp.conReposo && emp.fechaInicioReposo) {
          // Calcular días perdidos desde inicio de reposo hasta cierre
          const fechaInicioReposo = emp.fechaInicioReposo?.toDate 
            ? emp.fechaInicioReposo.toDate() 
            : new Date(emp.fechaInicioReposo);
          
          const diasPerdidos = Math.max(0, Math.ceil((fechaCierreDate - fechaInicioReposo) / (1000 * 60 * 60 * 24)));
          
          // Reactivar empleado
          actualizarEstadoEmpleado(emp.empleadoId, 'activo', null, userProfile).catch(err => 
            console.error(`Error reactivando empleado ${emp.empleadoId}:`, err)
          );
          
          // Retornar empleado con días perdidos guardados
          return {
            ...emp,
            diasPerdidos,
            fechaFinReposo: fechaCierre
          };
        }
        return emp;
      });
      
      // Actualizar empleados involucrados con días perdidos
      updateData.empleadosInvolucrados = empleadosActualizados;
      updateData.fechaCierre = fechaCierre;
    }
    
    await updateDocWithAppId(accidenteRef, updateData);

    // Registrar log si hay userId
    if (userId) {
      const logsCollectionRef = auditUserCollection(userProfile.uid, 'logs');
      await registrarAccionSistema(
        userId,
        `Estado de ${tipo} actualizado a: ${nuevoEstado}`,
        {
          accidenteId,
          estadoAnterior: accidenteDoc.data()?.estado,
          estadoNuevo: nuevoEstado
        },
        'editar',
        tipo,
        accidenteId,
        logsCollectionRef
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
    if (!userProfile?.uid) {
      throw new Error('userProfile.uid es requerido para obtener empleados');
    }
    const empleadosRef = auditUserCollection(userProfile.uid, 'empleados');
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

// Obtener estadísticas de accidentes por empresa
export const obtenerEstadisticas = async (empresaId, userProfile) => {
  try {
    const accidentesRef = auditUserCollection(userProfile.uid, 'accidentes');
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
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};

// Eliminar accidente/incidente
export const eliminarAccidente = async (accidenteId, userId = null, userProfile) => {
  try {
    const accidentesRef = auditUserCollection(userProfile.uid, 'accidentes');
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
      const logsCollectionRef = auditUserCollection(userProfile.uid, 'logs');
      await registrarAccionSistema(
        userId,
        'Accidente/incidente eliminado',
        { accidenteId, tipo: accidenteData.tipo },
        'eliminar',
        'accidente',
        accidenteId,
        logsCollectionRef
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
    const accidentesRef = auditUserCollection(userProfile.uid, 'accidentes');
    const accidenteRef = doc(accidentesRef, accidenteId);
    const accidenteDoc = await getDoc(accidenteRef);
    
    if (!accidenteDoc.exists()) {
      throw new Error('Accidente no encontrado');
    }

    const updateData = { ...datosActualizados };

    // Si hay nuevas imágenes, subirlas
    if (imagenesNuevas && imagenesNuevas.length > 0) {
      const accidenteData = accidenteDoc.data();
      const empresaId = datosActualizados.empresaId || accidenteData.empresaId || 'system';
      const nuevasUrls = await subirImagenes(accidenteId, imagenesNuevas, empresaId);
      // Si ya vienen imágenes en datosActualizados (después de eliminar algunas), usar esas
      // Si no, usar las existentes del documento
      const imagenesBase = updateData.imagenes || accidenteDoc.data().imagenes || [];
      updateData.imagenes = [...imagenesBase, ...nuevasUrls];
    } else if (!updateData.imagenes) {
      // Si no hay nuevas imágenes pero no se enviaron imágenes en datosActualizados,
      // mantener las existentes
      updateData.imagenes = accidenteDoc.data().imagenes || [];
    }

    await updateDocWithAppId(accidenteRef, updateData);

    // Registrar log
    if (userId) {
      const logsCollectionRef = auditUserCollection(userProfile.uid, 'logs');
      await registrarAccionSistema(
        userId,
        'Accidente/incidente actualizado',
        { accidenteId, cambios: Object.keys(updateData) },
        'editar',
        accidenteDoc.data().tipo,
        accidenteId,
        logsCollectionRef
      );
    }

    const result = { id: accidenteId, ...updateData };
    return normalizeAccidente(result);
  } catch (error) {
    console.error('Error al actualizar accidente:', error);
    throw error;
  }
};
