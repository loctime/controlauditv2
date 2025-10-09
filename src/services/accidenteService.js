import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

/**
 * Servicio para gestión de accidentes e incidentes
 */

// Crear un nuevo accidente
export const crearAccidente = async (accidenteData, empleadosSeleccionados, imagenes = []) => {
  try {
    // Preparar datos de empleados involucrados
    const empleadosInvolucrados = empleadosSeleccionados.map(emp => ({
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      conReposo: emp.conReposo || false,
      fechaInicioReposo: emp.conReposo ? Timestamp.now() : null
    }));

    // Crear documento del accidente
    const accidenteDoc = {
      empresaId: accidenteData.empresaId,
      sucursalId: accidenteData.sucursalId,
      tipo: 'accidente',
      empleadosInvolucrados,
      descripcion: accidenteData.descripcion || '',
      imagenes: [],
      fechaHora: Timestamp.now(),
      createdAt: Timestamp.now(),
      reportadoPor: accidenteData.reportadoPor,
      estado: 'abierto'
    };

    const docRef = await addDoc(collection(db, 'accidentes'), accidenteDoc);

    // Subir imágenes si existen
    if (imagenes && imagenes.length > 0) {
      const imagenesUrls = await subirImagenes(docRef.id, imagenes);
      await updateDoc(docRef, { imagenes: imagenesUrls });
    }

    // Actualizar estado de empleados con días de reposo
    for (const emp of empleadosSeleccionados) {
      if (emp.conReposo) {
        await actualizarEstadoEmpleado(emp.id, 'inactivo', Timestamp.now());
      }
    }

    return { id: docRef.id, ...accidenteDoc };
  } catch (error) {
    console.error('Error al crear accidente:', error);
    throw error;
  }
};

// Crear un nuevo incidente
export const crearIncidente = async (incidenteData, testigos = [], imagenes = []) => {
  try {
    // Preparar datos de testigos
    const testigosArray = testigos.map(emp => ({
      empleadoId: emp.id,
      empleadoNombre: emp.nombre
    }));

    // Crear documento del incidente
    const incidenteDoc = {
      empresaId: incidenteData.empresaId,
      sucursalId: incidenteData.sucursalId,
      tipo: 'incidente',
      testigos: testigosArray,
      empleadosInvolucrados: [], // Los incidentes no tienen empleados con reposo
      descripcion: incidenteData.descripcion || '',
      imagenes: [],
      fechaHora: Timestamp.now(),
      createdAt: Timestamp.now(),
      reportadoPor: incidenteData.reportadoPor,
      estado: 'abierto'
    };

    const docRef = await addDoc(collection(db, 'accidentes'), incidenteDoc);

    // Subir imágenes si existen
    if (imagenes && imagenes.length > 0) {
      const imagenesUrls = await subirImagenes(docRef.id, imagenes);
      await updateDoc(docRef, { imagenes: imagenesUrls });
    }

    return { id: docRef.id, ...incidenteDoc };
  } catch (error) {
    console.error('Error al crear incidente:', error);
    throw error;
  }
};

// Actualizar estado de empleado
export const actualizarEstadoEmpleado = async (empleadoId, estado, fechaInicioReposo = null) => {
  try {
    const empleadoRef = doc(db, 'empleados', empleadoId);
    const updateData = { estado };
    
    if (fechaInicioReposo) {
      updateData.fechaInicioReposo = fechaInicioReposo;
    }
    
    await updateDoc(empleadoRef, updateData);
  } catch (error) {
    console.error('Error al actualizar estado de empleado:', error);
    throw error;
  }
};

// Subir imágenes a Firebase Storage
export const subirImagenes = async (accidenteId, imagenes) => {
  try {
    const urls = [];
    
    for (let i = 0; i < imagenes.length; i++) {
      const imagen = imagenes[i];
      const timestamp = Date.now();
      const storageRef = ref(storage, `accidentes/${accidenteId}/${timestamp}_${i}_${imagen.name}`);
      
      const snapshot = await uploadBytes(storageRef, imagen);
      const url = await getDownloadURL(snapshot.ref);
      urls.push(url);
    }
    
    return urls;
  } catch (error) {
    console.error('Error al subir imágenes:', error);
    throw error;
  }
};

// Obtener accidentes con filtros
export const obtenerAccidentes = async (filtros = {}) => {
  try {
    let q = collection(db, 'accidentes');
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

    if (conditions.length > 0) {
      q = query(q, ...conditions, orderBy('fechaHora', 'desc'));
    } else {
      q = query(q, orderBy('fechaHora', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener accidentes:', error);
    throw error;
  }
};

// Obtener un accidente específico
export const obtenerAccidentePorId = async (accidenteId) => {
  try {
    const docRef = doc(db, 'accidentes', accidenteId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener accidente:', error);
    throw error;
  }
};

// Actualizar estado de accidente/incidente
export const actualizarEstadoAccidente = async (accidenteId, nuevoEstado) => {
  try {
    const accidenteRef = doc(db, 'accidentes', accidenteId);
    await updateDoc(accidenteRef, { estado: nuevoEstado });
  } catch (error) {
    console.error('Error al actualizar estado de accidente:', error);
    throw error;
  }
};

// Obtener empleados por sucursal (para los selectores)
export const obtenerEmpleadosPorSucursal = async (sucursalId) => {
  try {
    const q = query(
      collection(db, 'empleados'),
      where('sucursalId', '==', sucursalId),
      where('estado', '==', 'activo')
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
export const obtenerEstadisticas = async (empresaId) => {
  try {
    const q = query(
      collection(db, 'accidentes'),
      where('empresaId', '==', empresaId)
    );
    
    const snapshot = await getDocs(q);
    const accidentes = snapshot.docs.map(doc => doc.data());
    
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
