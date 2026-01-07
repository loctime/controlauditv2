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
import { db } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { uploadEvidence, getDownloadUrl, ensureTaskbarFolder, ensureSubFolder } from './controlFileB2Service';
import { getControlFileFolders, clearControlFileFolders } from './controlFileInit';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { uploadFileWithContext } from './unifiedFileUploadService';
import { auth } from '../firebaseControlFile';

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

    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
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

    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
    const docRef = await addDocWithAppId(accidentesRef, incidenteDoc);

    // Subir imágenes si existen
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
 * Subir imágenes usando el nuevo modelo de contexto de evento
 * Función interna que usa uploadFileWithContext()
 * 
 * @private
 * @deprecated Esta función será removida en Iteración 2 cuando todos los componentes migren
 */
const subirImagenesNew = async (accidenteId, imagenes, companyId = 'system') => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    const userId = user.uid;

    console.log(`[accidenteService] 📤 [v1.0] Subiendo ${imagenes.length} imagen(es) con modelo de contexto: accidente/${accidenteId}/evidencia`);

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
        
        console.log(`[accidenteService] ✅ [v1.0] Imagen ${i + 1}/${imagenes.length} subida exitosamente`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[accidenteService] ❌ [v1.0] Error al subir imagen ${i + 1}/${imagenes.length}:`, errorMsg);
        // Continuar con las demás imágenes aunque una falle
      }
    }
    
    if (urls.length === 0) {
      throw new Error('No se pudo subir ninguna imagen');
    }
    
    return urls;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[accidenteService] ❌ [v1.0] Error al subir imágenes (${imagenes.length} total):`, errorMsg);
    throw error;
  }
};

/**
 * Subir imágenes usando sistema legacy (fallback)
 * @private
 */
const subirImagenesLegacy = async (accidenteId, imagenes, companyId = 'system') => {
  try {
    // PASO 1: Obtener carpeta raíz ControlAudit (ya existente)
    const mainFolderId = await ensureTaskbarFolder('ControlAudit');
    if (!mainFolderId) {
      console.error('[accidenteService] ⛔ [LEGACY] Upload cancelado: carpeta accidentes no disponible - No se pudo obtener carpeta principal ControlAudit');
      throw new Error('No se pudo obtener carpeta principal ControlAudit');
    }

    // PASO 2: Resolver subcarpeta "accidentes" con lógica GET-OR-CREATE
    let folderIdAccidentes = null;
    let subcarpetaCreada = false;

    try {
      // 2a. Buscar subcarpeta "accidentes" bajo ControlAudit
      const folders = await getControlFileFolders();
      folderIdAccidentes = folders.subFolders?.accidentes;

      // 2b. SI NO EXISTE → crearla usando ensureSubFolder
      if (!folderIdAccidentes) {
        console.log('[accidenteService] 📂 [LEGACY] Subcarpeta accidentes no encontrada en cache, creando...');
        folderIdAccidentes = await ensureSubFolder('Accidentes', mainFolderId);
        
        if (folderIdAccidentes) {
          subcarpetaCreada = true;
          console.log('[accidenteService] 📂 [LEGACY] Subcarpeta accidentes creada');
          
          // PASO 3: Invalidar cache si se creó la subcarpeta
          clearControlFileFolders();
          console.log('[accidenteService] ♻️ [LEGACY] Cache de carpetas invalidado');
        } else {
          console.error('[accidenteService] ⛔ [LEGACY] Upload cancelado: carpeta accidentes no disponible - No se pudo crear subcarpeta');
          throw new Error('No se pudo crear subcarpeta accidentes');
        }
      } else {
        // 2c. SI EXISTE → usar su id
        console.log('[accidenteService] 📂 [LEGACY] Subcarpeta accidentes existente reutilizada');
      }
    } catch (error) {
      console.error('[accidenteService] [LEGACY] Error al resolver carpeta de accidentes:', error);
      console.error('[accidenteService] ⛔ [LEGACY] Upload cancelado: carpeta accidentes no disponible');
      throw error;
    }

    // PASO 4: Validar que parentId es válido antes de subir
    if (!folderIdAccidentes) {
      console.error('[accidenteService] ⛔ [LEGACY] Upload cancelado: carpeta accidentes no disponible - folderIdAccidentes es null');
      throw new Error('folderIdAccidentes no disponible');
    }

    // PASO 5: Subir imágenes SOLO si parentId es válido
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
        
        console.log(`[accidenteService] ✅ [LEGACY] Imagen ${i + 1}/${imagenes.length} subida a ControlFile`);
      } catch (error) {
        console.error(`[accidenteService] [LEGACY] Error al subir imagen ${i + 1}:`, error);
        // Continuar con las demás imágenes aunque una falle
      }
    }
    
    return urls;
  } catch (error) {
    console.error('[accidenteService] [LEGACY] Error al subir imágenes:', error);
    throw error;
  }
};

/**
 * Subir imágenes a ControlFile
 * 
 * @deprecated Esta función ahora usa internamente el nuevo modelo de contexto de evento (v1.0).
 * Se mantiene la API existente para compatibilidad total con código legacy.
 * 
 * Migración: Los componentes deberían migrar a usar uploadFileWithContext() directamente.
 * Esta función será removida en Iteración 2 cuando todos los componentes migren.
 * 
 * @param {string} accidenteId - ID del accidente
 * @param {File[]} imagenes - Array de archivos de imagen
 * @param {string} companyId - ID de la empresa (default: 'system')
 * @returns {Promise<string[]>} Array de URLs de descarga temporal
 */
export const subirImagenes = async (accidenteId, imagenes, companyId = 'system') => {
  // Wrapper: usar nuevo sistema internamente pero mantener API legacy
  try {
    return await subirImagenesNew(accidenteId, imagenes, companyId);
  } catch (error) {
    // Fallback a sistema legacy solo si el nuevo sistema falla
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[accidenteService] ⚠️ [v1.0] Fallback a legacy por error: ${errorMsg}`);
    return await subirImagenesLegacy(accidenteId, imagenes, companyId);
  }
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
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
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
    if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
    const ownerId = userProfile.ownerId;
    const accidentesRef = collection(db, ...firestoreRoutesCore.accidentes(ownerId));
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
      // registrarAccionSistema maneja la ruta internamente
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

// Obtener estadísticas de accidentes por empresa
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
    console.error('Error al obtener estadísticas:', error);
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
