// src/components/pages/admin/hooks/useClienteDashboard.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, limit, orderBy, getDoc } from "firebase/firestore";
import { db } from "../../../../firebaseControlFile";
import { useAuth } from "../../../context/AuthContext";
import { toast } from 'react-toastify';

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

  // ✅ Función optimizada para cargar empresas
  const cargarEmpresas = useCallback(async () => {
    try {
      if (!userProfile) return [];

      // Cargar todas las empresas disponibles (ya filtradas por multi-tenant)
      const empresasSnapshot = await getDocs(collection(db, 'empresas'));
      const empresasData = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return empresasData;
    } catch (error) {
      console.error('Error cargando empresas:', error);
      return [];
    }
  }, [userProfile]);

  // ✅ Función optimizada para cargar sucursales
  const cargarSucursales = useCallback(async (empresasData) => {
    try {
      if (!userProfile) return [];

      // Cargar todas las sucursales disponibles (ya filtradas por multi-tenant)
      // Si hay filtro funcional por empresa, aplicarlo
      let sucursalesData = [];
      if (empresasData && empresasData.length > 0) {
        const empresasIds = empresasData.map(emp => emp.nombre || emp.id);
        // Firestore limita 'in' queries a 10 elementos, dividir en chunks si es necesario
        const chunkSize = 10;
        const empresasChunks = [];
        for (let i = 0; i < empresasIds.length; i += chunkSize) {
          empresasChunks.push(empresasIds.slice(i, i + chunkSize));
        }

        const sucursalesPromises = empresasChunks.map(async (chunk) => {
          const sucursalesRef = collection(db, "sucursales");
          const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", chunk));
          const sucursalesSnapshot = await getDocs(sucursalesQuery);
          return sucursalesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const sucursalesArrays = await Promise.all(sucursalesPromises);
        sucursalesData = sucursalesArrays.flat();
      } else {
        // Si no hay filtro de empresa, cargar todas
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      return sucursalesData;
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      return [];
    }
  }, [userProfile]);

  // ✅ Función optimizada para cargar formularios
  const cargarFormularios = useCallback(async () => {
    try {
      if (!userProfile) return [];

      // Cargar todos los formularios disponibles (ya filtrados por multi-tenant)
      const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
      const formulariosData = formulariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return formulariosData;
    } catch (error) {
      console.error('Error cargando formularios:', error);
      return [];
    }
  }, [userProfile]);

  // ✅ Función para cargar información completa de usuarios cuando solo tenemos IDs
  const cargarInformacionUsuarios = useCallback(async (auditoriasData) => {
    try {
      // Obtener todos los IDs únicos de usuarios que necesitamos cargar
      const userIds = new Set();
      auditoriasData.forEach(auditoria => {
        if (auditoria.encargado && typeof auditoria.encargado === 'string') {
          userIds.add(auditoria.encargado);
        }
      });

      if (userIds.size === 0) return auditoriasData;

      // Cargar información de usuarios en paralelo
      const usuariosPromises = Array.from(userIds).map(async (userId) => {
        try {
          const usuarioRef = doc(db, 'apps', 'audit', 'users', userId);
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

  // ✅ Función optimizada para cargar auditorías con paginación
  const cargarAuditorias = useCallback(async () => {
    try {
      if (!userProfile) return [];

      // Cargar todas las auditorías disponibles (ya filtradas por multi-tenant)
      const auditoriasRef = collection(db, 'auditorias_agendadas');
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
  }, [userProfile, cargarInformacionUsuarios]);

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

      const docRef = await addDoc(collection(db, 'auditorias_agendadas'), nuevaAuditoria);
      
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
        if (!userProfile) return;

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
  }, [userProfile, cargarEmpresas, cargarSucursales, cargarFormularios, cargarAuditorias]);

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
      const auditoriaRef = doc(db, 'auditorias_agendadas', auditoriaId);
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
  }, []);

  const handleEliminarAuditoria = useCallback(async (auditoriaId) => {
    try {
      await deleteDoc(doc(db, 'auditorias_agendadas', auditoriaId));
      setAuditorias(prev => prev.filter(aud => aud.id !== auditoriaId));
      toast.success('Auditoría eliminada');
    } catch (error) {
      console.error('Error eliminando auditoría:', error);
      toast.error('Error al eliminar la auditoría');
    }
  }, []);

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