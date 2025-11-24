// src/components/pages/admin/hooks/useClienteDashboard.js
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { collection, addDoc, query, where, getDocs, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, limit, orderBy, getDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
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

      let empresasData = [];
      if (role === 'supermax') {
        const empresasSnapshot = await getDocs(collection(db, 'empresas'));
        empresasData = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        // Cargar empresas propias
        const empresasRef = collection(db, "empresas");
        const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
        const empresasSnapshot = await getDocs(empresasQuery);
        const misEmpresas = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cargar usuarios operarios y sus empresas en paralelo
        const usuariosRef = collection(db, "usuarios");
        const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
        const usuariosSnapshot = await getDocs(usuariosQuery);
        const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

        // Cargar empresas de operarios en paralelo
        const empresasOperariosPromises = usuariosOperarios.map(async (operarioId) => {
          const operarioEmpresasQuery = query(empresasRef, where("propietarioId", "==", operarioId));
          const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
          return operarioEmpresasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const empresasOperariosArrays = await Promise.all(empresasOperariosPromises);
        const empresasOperarios = empresasOperariosArrays.flat();

        empresasData = [...misEmpresas, ...empresasOperarios];
      }
      return empresasData;
    } catch (error) {
      console.error('Error cargando empresas:', error);
      return [];
    }
  }, [userProfile, role]);

  // ✅ Función optimizada para cargar sucursales
  const cargarSucursales = useCallback(async (empresasData) => {
    try {
      if (!userProfile || !empresasData.length) return [];

      let sucursalesData = [];
      if (role === 'supermax') {
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        const empresasIds = empresasData.map(emp => emp.nombre);
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
      }
      return sucursalesData;
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      return [];
    }
  }, [userProfile, role]);

  // ✅ Función optimizada para cargar formularios
  const cargarFormularios = useCallback(async () => {
    try {
      if (!userProfile) return [];

      let formulariosData = [];
      if (role === 'supermax') {
        const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        // Cargar formularios propios
        const formulariosRef = collection(db, "formularios");
        const formulariosQuery = query(formulariosRef, where("clienteAdminId", "==", userProfile.uid));
        const formulariosSnapshot = await getDocs(formulariosQuery);
        const misFormularios = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cargar usuarios operarios
        const usuariosRef = collection(db, "usuarios");
        const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
        const usuariosSnapshot = await getDocs(usuariosQuery);
        const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

        // Cargar formularios de operarios en paralelo
        const formulariosOperariosPromises = usuariosOperarios.map(async (operarioId) => {
          const operarioFormulariosQuery = query(formulariosRef, where("clienteAdminId", "==", operarioId));
          const operarioFormulariosSnapshot = await getDocs(operarioFormulariosQuery);
          return operarioFormulariosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const formulariosOperariosArrays = await Promise.all(formulariosOperariosPromises);
        const formulariosOperarios = formulariosOperariosArrays.flat();

        formulariosData = [...misFormularios, ...formulariosOperarios];
      }
      return formulariosData;
    } catch (error) {
      console.error('Error cargando formularios:', error);
      return [];
    }
  }, [userProfile, role]);

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
          const usuarioRef = doc(db, 'usuarios', userId);
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

  // Ref para almacenar unsubscribe de listeners
  const unsubscribeRef = useRef(null);

  // ✅ Función optimizada para configurar listeners en tiempo real
  const configurarListenersAuditorias = useCallback(() => {
    if (!userProfile) return () => {};

    // Limpiar listener anterior si existe
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    try {
      const auditoriasRef = collection(db, 'auditorias_agendadas');
      let q;

      if (role === 'supermax') {
        q = query(
          auditoriasRef,
          orderBy('fechaCreacion', 'desc'),
          limit(50)
        );
      } else if (role === 'max') {
        // Query principal para auditorías del cliente admin
        q = query(
          auditoriasRef,
          where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid),
          orderBy('fechaCreacion', 'desc'),
          limit(100)
        );
      } else {
        return () => {};
      }

      // Configurar listener en tiempo real
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          console.log('[useClienteDashboard] Cambios detectados en auditorías:', snapshot.docs.length);
          
          let auditoriasData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Cargar información completa de usuarios
          auditoriasData = await cargarInformacionUsuarios(auditoriasData);

          // Filtrar duplicados por ID
          const auditoriasUnicas = auditoriasData.filter(
            (aud, idx, self) => self.findIndex(a => a.id === aud.id) === idx
          );

          setAuditorias(auditoriasUnicas);
        },
        (error) => {
          console.error('Error en listener de auditorías:', error);
          toast.error('Error al recibir actualizaciones de auditorías');
        }
      );

      unsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error configurando listeners de auditorías:', error);
      return () => {};
    }
  }, [userProfile, role, cargarInformacionUsuarios]);

  // ✅ Función legacy para carga inicial (mantener por compatibilidad)
  const cargarAuditorias = useCallback(async () => {
    try {
      if (!userProfile) return [];

      let auditoriasData = [];
      if (role === 'supermax') {
        const auditoriasRef = collection(db, 'auditorias_agendadas');
        const auditoriasQuery = query(
          auditoriasRef, 
          orderBy('fechaCreacion', 'desc'), 
          limit(50)
        );
        const auditoriasSnapshot = await getDocs(auditoriasQuery);
        auditoriasData = auditoriasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        const auditoriasRef = collection(db, "auditorias_agendadas");
        const auditoriasQuery = query(
          auditoriasRef, 
          where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid),
          orderBy('fechaCreacion', 'desc'),
          limit(100)
        );
        const auditoriasSnapshot = await getDocs(auditoriasQuery);
        auditoriasData = auditoriasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      auditoriasData = await cargarInformacionUsuarios(auditoriasData);
      return auditoriasData;
    } catch (error) {
      console.error('Error cargando auditorías:', error);
      return [];
    }
  }, [userProfile, role, cargarInformacionUsuarios]);

  // ✅ Funciones optimizadas con useCallback
  const handleAgendarAuditoria = useCallback(async (formData) => {
    try {
      // Si hay un encargado seleccionado, obtener su información completa
      let encargadoInfo = null;
      if (formData.encargado) {
        try {
          const usuarioRef = doc(db, 'usuarios', formData.encargado);
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
        usuarioId: userProfile?.uid,
        usuarioNombre: userProfile?.displayName || userProfile?.email,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid,
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

      // El listener en tiempo real actualizará automáticamente
      // No necesitamos recargar manualmente
      toast.success('Auditoría agendada exitosamente');
      return true;
    } catch (error) {
      console.error('Error agendando auditoría:', error);
      toast.error('Error al agendar la auditoría');
      return false;
    }
  }, [userProfile, cargarAuditorias]);

  // ✅ Cargar datos en paralelo y configurar listeners
  useEffect(() => {
    const cargarDatosParalelos = async () => {
      try {
        if (!userProfile) return;

        console.log('[DEBUG] Iniciando carga paralela de datos...');
        
        // Cargar empresas primero (necesarias para sucursales)
        setLoadingStates(prev => ({ ...prev, empresas: true }));
        const empresasData = await cargarEmpresas();
        const empresasUnicas = empresasData.filter(
          (emp, idx, self) => self.findIndex(e => e.id === emp.id) === idx
        );
        setEmpresas(empresasUnicas);
        setLoadingStates(prev => ({ ...prev, empresas: false }));

        // Cargar sucursales y formularios en paralelo
        const [sucursalesData, formulariosData] = await Promise.all([
          cargarSucursales(empresasUnicas),
          cargarFormularios()
        ]);

        const sucursalesUnicas = sucursalesData.filter(
          (suc, idx, self) => self.findIndex(s => s.id === suc.id) === idx
        );
        const formulariosUnicos = formulariosData.filter(
          (f, idx, self) => self.findIndex(ff => ff.id === f.id) === idx
        );

        setSucursales(sucursalesUnicas);
        setFormularios(formulariosUnicos);

        // Cargar auditorías inicialmente
        setLoadingStates(prev => ({ ...prev, auditorias: true }));
        const auditoriasData = await cargarAuditorias();
        const auditoriasUnicas = auditoriasData.filter(
          (aud, idx, self) => self.findIndex(a => a.id === aud.id) === idx
        );
        setAuditorias(auditoriasUnicas);
        setLoadingStates(prev => ({ ...prev, auditorias: false }));

        // Configurar listener en tiempo real para auditorías
        configurarListenersAuditorias();

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

    // Cleanup: desuscribir listener cuando el componente se desmonte
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userProfile, role, cargarEmpresas, cargarSucursales, cargarFormularios, cargarAuditorias, configurarListenersAuditorias]);

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
      // Navegar a la página de auditoría con los datos de la auditoría agendada
      const auditoria = auditorias.find(a => a.id === auditoriaId);
      if (auditoria) {
        // Redirigir a /auditoria con los datos pre-llenados
        // Esto se manejará en el componente que llama a esta función
        // Por ahora, solo marcamos como completada en auditorias_agendadas
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
        toast.success('Auditoría marcada como completada. Recuerda completarla en /auditoria');
      }
    } catch (error) {
      console.error('Error completando auditoría:', error);
      toast.error('Error al marcar como completada');
    }
  }, [auditorias]);

  const handleEliminarAuditoria = useCallback(async (auditoriaId) => {
    try {
      await deleteDoc(doc(db, 'auditorias_agendadas', auditoriaId));
      // El listener en tiempo real actualizará automáticamente
      // Actualizar localmente para feedback inmediato
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