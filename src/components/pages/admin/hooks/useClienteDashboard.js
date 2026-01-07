// src/components/pages/admin/hooks/useClienteDashboard.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, limit, orderBy, getDoc } from "firebase/firestore";
import { db, dbAudit } from "../../../../firebaseControlFile";
import { firestoreRoutesCore } from "../../../../core/firestore/firestoreRoutes.core";
import { useAuth } from "../../../context/AuthContext";
import { toast } from 'react-toastify';
import { normalizeSucursal } from '../../../../utils/firestoreUtils';

export const useClienteDashboard = () => {
  const { userProfile, role } = useAuth();
  const [auditorias, setAuditorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    empresas: true,
    sucursales: true,
    formularios: true,
    auditorias: true
  });

  // ✅ Función optimizada para cargar empresas (owner-centric)
  const cargarEmpresas = useCallback(async () => {
    try {
      if (!userProfile?.ownerId) return [];

      // Cargar empresas desde estructura owner-centric: apps/auditoria/owners/{ownerId}/empresas
      const ownerId = userProfile.ownerId;
      const empresasRef = collection(dbAudit, ...firestoreRoutesCore.empresas(ownerId));
      const empresasSnapshot = await getDocs(empresasRef);
      const empresasData = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return empresasData;
    } catch (error) {
      console.error('Error cargando empresas:', error);
      return [];
    }
  }, [userProfile?.ownerId]);

  // ✅ Función optimizada para cargar sucursales (owner-centric)
  const cargarSucursales = useCallback(async (empresasData) => {
    try {
      if (!userProfile?.ownerId) return [];

      // Cargar sucursales desde estructura owner-centric: apps/auditoria/owners/{ownerId}/sucursales
      // Si hay filtro funcional por empresa, aplicarlo
      let sucursalesData = [];
      const ownerId = userProfile.ownerId;
      const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));
      
      if (empresasData && empresasData.length > 0) {
        const empresasIds = empresasData.map(emp => emp.nombre || emp.id);
        // Firestore limita 'in' queries a 10 elementos, dividir en chunks si es necesario
        const chunkSize = 10;
        const empresasChunks = [];
        for (let i = 0; i < empresasIds.length; i += chunkSize) {
          empresasChunks.push(empresasIds.slice(i, i + chunkSize));
        }

        const sucursalesPromises = empresasChunks.map(async (chunk) => {
          const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", chunk));
          const sucursalesSnapshot = await getDocs(sucursalesQuery);
          return sucursalesSnapshot.docs.map(doc => normalizeSucursal(doc));
        });

        const sucursalesArrays = await Promise.all(sucursalesPromises);
        sucursalesData = sucursalesArrays.flat();
      } else {
        // Si no hay filtro de empresa, cargar todas las sucursales disponibles
        const sucursalesSnapshot = await getDocs(sucursalesRef);
        sucursalesData = sucursalesSnapshot.docs.map(doc => normalizeSucursal(doc));
      }
      return sucursalesData;
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      return [];
    }
  }, [userProfile?.ownerId]);

  // ✅ Función optimizada para cargar formularios (owner-centric)
  const cargarFormularios = useCallback(async () => {
    try {
      if (!userProfile?.ownerId) return [];

      // Cargar formularios desde estructura owner-centric: apps/auditoria/owners/{ownerId}/formularios
      const ownerId = userProfile.ownerId;
      const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
      const formulariosSnapshot = await getDocs(formulariosRef);
      const formulariosData = formulariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return formulariosData;
    } catch (error) {
      console.error('Error cargando formularios:', error);
      return [];
    }
  }, [userProfile?.ownerId]);

  // ✅ Función para cargar información completa de usuarios cuando solo tenemos IDs (owner-centric)
  const cargarInformacionUsuarios = useCallback(async (auditoriasData) => {
    try {
      if (!userProfile?.ownerId) return auditoriasData;
      
      // Obtener todos los IDs únicos de usuarios que necesitamos cargar
      const userIds = new Set();
      auditoriasData.forEach(auditoria => {
        if (auditoria.encargado && typeof auditoria.encargado === 'string') {
          userIds.add(auditoria.encargado);
        }
      });

      if (userIds.size === 0) return auditoriasData;

      const ownerId = userProfile.ownerId;
      // Cargar información de usuarios en paralelo desde owner-centric
      const usuariosPromises = Array.from(userIds).map(async (userId) => {
        try {
          const usuarioRef = doc(dbAudit, ...firestoreRoutesCore.usuario(ownerId, userId));
          const usuarioDoc = await getDoc(usuarioRef);
          if (usuarioDoc.exists()) {
            return {
              id: usuarioDoc.id,
              ...usuarioDoc.data()
            };
          }
          return null;
        } catch (error) {
          console.error(`Error cargando usuario ${userId}:`, error);
          return null;
        }
      });

      const usuarios = await Promise.all(usuariosPromises);
      const usuariosMap = new Map();
      usuarios.forEach(usuario => {
        if (usuario) {
          usuariosMap.set(usuario.id, usuario);
        }
      });

      // Actualizar auditorías con información completa de usuarios
      return auditoriasData.map(auditoria => {
        if (auditoria.encargado && typeof auditoria.encargado === 'string') {
          const usuarioInfo = usuariosMap.get(auditoria.encargado);
          if (usuarioInfo) {
            return {
              ...auditoria,
              encargado: {
                id: usuarioInfo.id,
                displayName: usuarioInfo.displayName,
                email: usuarioInfo.email,
                role: usuarioInfo.role
              }
            };
          }
        }
        return auditoria;
      });
    } catch (error) {
      console.error('Error cargando información de usuarios:', error);
      return auditoriasData;
    }
  }, []);

  // ✅ Función optimizada para cargar auditorías con paginación (owner-centric)
  const cargarAuditorias = useCallback(async () => {
    try {
      if (!userProfile?.ownerId) return [];

      // Cargar auditorías desde estructura owner-centric: apps/auditoria/owners/{ownerId}/auditorias_agendadas
      const ownerId = userProfile.ownerId;
      const auditoriasRef = collection(dbAudit, 'apps', 'auditoria', 'owners', ownerId, 'auditorias_agendadas');
      const auditoriasQuery = query(
        auditoriasRef, 
        orderBy('fechaCreacion', 'desc'), 
        limit(100)
      );
      const auditoriasSnapshot = await getDocs(auditoriasQuery);
      let auditoriasData = auditoriasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cargar información completa de usuarios para auditorías que solo tienen IDs
      auditoriasData = await cargarInformacionUsuarios(auditoriasData);

      return auditoriasData;
    } catch (error) {
      console.error('Error cargando auditorías:', error);
      return [];
    }
  }, [userProfile?.uid, cargarInformacionUsuarios]);

  // ✅ Funciones optimizadas con useCallback
  const handleAgendarAuditoria = useCallback(async (formData) => {
    try {
      // Si hay un encargado seleccionado, obtener su información completa
      let encargadoInfo = null;
      if (formData.encargado) {
        try {
          const usuarioRef = doc(db, 'apps', 'audit', 'users', formData.encargado);
          const usuarioDoc = await getDoc(usuarioRef);
          if (usuarioDoc.exists()) {
            encargadoInfo = {
              id: usuarioDoc.id,
              displayName: usuarioDoc.data().displayName,
              email: usuarioDoc.data().email,
              role: usuarioDoc.data().role
            };
          }
        } catch (error) {
          console.error('Error obteniendo información del encargado:', error);
          // Si no se puede obtener la información, usar solo el ID
          encargadoInfo = { id: formData.encargado };
        }
      }

      const nuevaAuditoria = {
        ...formData,
        fecha: formData.fecha,
        hora: formData.hora,
        estado: 'agendada',
        usuarioNombre: userProfile?.displayName || userProfile?.email,
        encargado: encargadoInfo, // Guardar información completa del encargado
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      // Guardar en estructura owner-centric: apps/auditoria/owners/{ownerId}/auditorias_agendadas
      if (!userProfile?.ownerId) throw new Error('ownerId no disponible');
      const ownerId = userProfile.ownerId;
      const auditoriasRef = collection(dbAudit, 'apps', 'auditoria', 'owners', ownerId, 'auditorias_agendadas');
      const docRef = await addDoc(auditoriasRef, nuevaAuditoria);
      
      // Eliminar el setAuditorias manual
      // setAuditorias(prev => [{
      //   id: docRef.id,
      //   ...nuevaAuditoria,
      //   fechaCreacion: new Date(),
      //   fechaActualizacion: new Date()
      // }, ...prev]);

      // Recargar auditorías desde Firestore
      const auditoriasActualizadas = await cargarAuditorias();
      // Filtrar duplicados por ID
      const auditoriasUnicas = auditoriasActualizadas.filter(
        (aud, idx, self) => self.findIndex(a => a.id === aud.id) === idx
      );
      setAuditorias(auditoriasUnicas);

      toast.success('Auditoría agendada exitosamente');
      return true;
    } catch (error) {
      console.error('Error agendando auditoría:', error);
      toast.error('Error al agendar la auditoría');
      return false;
    }
  }, [userProfile, cargarAuditorias]);

  // ✅ Cargar datos en paralelo para mejor rendimiento
  useEffect(() => {
    const cargarDatosParalelos = async () => {
      try {
        if (!userProfile?.uid) return;

        console.log('[DEBUG] Iniciando carga paralela de datos...');
        
        // Cargar empresas primero (necesarias para sucursales)
        setLoadingStates(prev => ({ ...prev, empresas: true }));
        const empresasData = await cargarEmpresas();
        // Filtrar duplicados por ID
        const empresasUnicas = empresasData.filter(
          (emp, idx, self) => self.findIndex(e => e.id === emp.id) === idx
        );
        setEmpresas(empresasUnicas);
        setLoadingStates(prev => ({ ...prev, empresas: false }));

        // Cargar el resto en paralelo
        const [sucursalesData, formulariosData, auditoriasData] = await Promise.all([
          cargarSucursales(empresasUnicas),
          cargarFormularios(),
          cargarAuditorias()
        ]);

        // Filtrar duplicados por ID en sucursales y formularios
        const sucursalesUnicas = sucursalesData.filter(
          (suc, idx, self) => self.findIndex(s => s.id === suc.id) === idx
        );
        const formulariosUnicos = formulariosData.filter(
          (f, idx, self) => self.findIndex(ff => ff.id === f.id) === idx
        );

        setSucursales(sucursalesUnicas);
        setFormularios(formulariosUnicos);
        setAuditorias(auditoriasData);

        setLoadingStates({
          empresas: false,
          sucursales: false,
          formularios: false,
          auditorias: false
        });

        console.log('[DEBUG] Datos cargados con optimización:', {
          empresas: empresasData.length,
          sucursales: sucursalesData.length,
          formularios: formulariosData.length,
          auditorias: auditoriasData.length
        });

      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar los datos');
        setLoadingStates({
          empresas: false,
          sucursales: false,
          formularios: false,
          auditorias: false
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatosParalelos();
  }, [userProfile?.uid, cargarEmpresas, cargarSucursales, cargarFormularios, cargarAuditorias]);

  // ✅ Memoizar datos calculados para evitar recálculos
  const auditoriasPendientes = useMemo(() => 
    auditorias.filter(aud => aud.estado === 'agendada'), 
    [auditorias]
  );

  const auditoriasCompletadas = useMemo(() => 
    auditorias.filter(aud => aud.estado === 'completada'), 
    [auditorias]
  );

  const auditoriasDelDia = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return auditorias.filter(auditoria => auditoria.fecha === today);
  }, [auditorias]);

  const proximasAuditorias = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return auditorias
      .filter(auditoria => auditoria.fecha >= today && auditoria.estado === 'agendada')
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 5);
  }, [auditorias]);

  const handleCompletarAuditoria = useCallback(async (auditoriaId) => {
    try {
      if (!userProfile?.ownerId) return;
      
      // Actualizar en estructura owner-centric: apps/auditoria/owners/{ownerId}/auditorias_agendadas
      const ownerId = userProfile.ownerId;
      const auditoriaRef = doc(dbAudit, 'apps', 'auditoria', 'owners', ownerId, 'auditorias_agendadas', auditoriaId);
      await updateDoc(auditoriaRef, {
        estado: 'completada',
        fechaCompletada: serverTimestamp()
      });

      setAuditorias(prev => prev.map(aud => 
        aud.id === auditoriaId 
          ? { ...aud, estado: 'completada', fechaCompletada: new Date() }
          : aud
      ));
      toast.success('Auditoría marcada como completada');
    } catch (error) {
      console.error('Error completando auditoría:', error);
      toast.error('Error al marcar como completada');
    }
  }, [userProfile?.ownerId]);

  const handleEliminarAuditoria = useCallback(async (auditoriaId) => {
    try {
      if (!userProfile?.ownerId) return;
      
      // Eliminar de estructura owner-centric: apps/auditoria/owners/{ownerId}/auditorias_agendadas
      const ownerId = userProfile.ownerId;
      const auditoriaRef = doc(dbAudit, 'apps', 'auditoria', 'owners', ownerId, 'auditorias_agendadas', auditoriaId);
      await deleteDoc(auditoriaRef);
      setAuditorias(prev => prev.filter(aud => aud.id !== auditoriaId));
      toast.success('Auditoría eliminada');
    } catch (error) {
      console.error('Error eliminando auditoría:', error);
      toast.error('Error al eliminar la auditoría');
    }
  }, [userProfile?.ownerId]);

  return {
    auditorias,
    empresas,
    sucursales,
    formularios,
    loading,
    loadingStates,
    auditoriasPendientes,
    auditoriasCompletadas,
    auditoriasDelDia,
    proximasAuditorias,
    handleAgendarAuditoria,
    handleCompletarAuditoria,
    handleEliminarAuditoria
  };
}; 