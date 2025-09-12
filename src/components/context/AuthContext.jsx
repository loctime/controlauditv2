// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, onSnapshot } from "firebase/firestore";
import { registrarLogOperario, registrarAccionSistema } from '../../utils/firestoreUtils'; // NUEVO: función para logs
import { getUserRole } from '../../config/admin'; // ✅ Importar configuración del administrador
import userService from '../../services/userService';

// Definimos y exportamos el contexto
export const AuthContext = createContext();

const AuthContextComponent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmpresas, setUserEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [userAuditorias, setUserAuditorias] = useState([]);
  // Eliminado: socios. Usar solo usuarios.
  const [auditoriasCompartidas, setAuditoriasCompartidas] = useState([]);
  const [role, setRole] = useState(null); // NUEVO: rol del usuario
  const [permisos, setPermisos] = useState({}); // NUEVO: permisos del usuario
  const [bloqueado, setBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');

  useEffect(() => {
    
    // Timeout de seguridad para evitar loading infinito
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 segundos máximo
    
    // Escuchar cambios en el estado de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsLogged(true);
          localStorage.setItem("userInfo", JSON.stringify(firebaseUser));
          localStorage.setItem("isLogged", JSON.stringify(true));
          
          // Crear o obtener perfil del usuario
          const profile = await createOrGetUserProfile(firebaseUser);
          
          if (profile) {
            // Registrar log de inicio de sesión
            await registrarAccionSistema(
              firebaseUser.uid,
              `Inicio de sesión`,
              { 
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: profile.role
              },
              'login',
              'usuario',
              firebaseUser.uid
            );
            
            // Cargar datos del usuario
            await Promise.all([
              getUserEmpresas(firebaseUser.uid),
              getUserAuditorias(firebaseUser.uid),
              // getUserSocios(firebaseUser.uid), // Eliminado: socios
              getAuditoriasCompartidas(firebaseUser.uid)
            ]);
          }
        } else {
          // Registrar log de cierre de sesión si había un usuario
          if (user) {
            await registrarAccionSistema(
              user.uid,
              `Cierre de sesión`,
              { 
                email: user.email,
                displayName: user.displayName
              },
              'logout',
              'usuario',
              user.uid
            );
          }
          
          setUser(null);
          setUserProfile(null);
          setIsLogged(false);
          setUserEmpresas([]);
          setUserAuditorias([]);
          // setSocios([]); // Eliminado: socios
          setAuditoriasCompartidas([]);
          localStorage.removeItem("userInfo");
          localStorage.removeItem("isLogged");
        }
      } catch (error) {
        console.error('AuthContext error in onAuthStateChanged:', error);
      } finally {
        clearTimeout(timeoutId); // Limpiar timeout
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // --- Listener reactivo para empresas del usuario (multi-tenant) ---
  useEffect(() => {
    if (!userProfile?.uid || !role) {
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return;
    }
    setLoadingEmpresas(true);
    let q;
    const empresasRef = collection(db, "empresas");
    if (role === 'supermax') {
      // Supermax ve todas las empresas
      q = empresasRef;
    } else if (role === 'max') {
      // Max ve solo sus propias empresas
      q = query(empresasRef, where("propietarioId", "==", userProfile.uid));
    } else if (role === 'operario' && userProfile.clienteAdminId) {
      // Operario ve empresas de su cliente admin
      q = query(empresasRef, where("propietarioId", "==", userProfile.clienteAdminId));
    } else {
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return;
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserEmpresas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingEmpresas(false);
    }, (error) => {
      console.error('[AuthContext] Error en onSnapshot de empresas:', error);
      setUserEmpresas([]);
      setLoadingEmpresas(false);
    });
    return () => unsubscribe();
  }, [userProfile?.uid, role, userProfile?.clienteAdminId]);

  useEffect(() => {
    // Lógica de bloqueo de acceso por estado de pago
    const verificarBloqueo = async () => {
      if (!userProfile) {
        setBloqueado(false);
        setMotivoBloqueo('');
        return;
      }
      // Si es supermax, nunca se bloquea
      if (userProfile.role === 'supermax') {
        setBloqueado(false);
        setMotivoBloqueo('');
        return;
      }
      // Si es max, verificar estado de pago y activo
      if (userProfile.role === 'max') {
        if (
          userProfile.activo === false ||
          userProfile.estadoPago === 'vencido' ||
          (userProfile.fechaVencimiento && userProfile.fechaVencimiento.toDate && new Date(userProfile.fechaVencimiento.toDate()) < new Date())
        ) {
          setBloqueado(true);
          setMotivoBloqueo('Tu suscripción está vencida o inactiva. Contacta al administrador para regularizar tu acceso.');
          return;
        }
      }
      // Si es operario, buscar el cliente admin y verificar su estado
      if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
        const adminRef = doc(db, 'usuarios', userProfile.clienteAdminId);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const adminData = adminSnap.data();
          if (
            adminData.activo === false ||
            adminData.estadoPago === 'vencido' ||
            (adminData.fechaVencimiento && adminData.fechaVencimiento.toDate && new Date(adminData.fechaVencimiento.toDate()) < new Date())
          ) {
            setBloqueado(true);
            setMotivoBloqueo('El cliente administrador de tu cuenta tiene la suscripción vencida o inactiva. No puedes acceder al sistema.');
            return;
          }
        }
      }
      setBloqueado(false);
      setMotivoBloqueo('');
    };
    verificarBloqueo();
  }, [userProfile]);

  const handleLogin = (userLogged) => {
    setUser(userLogged);
    setIsLogged(true);
    localStorage.setItem("userInfo", JSON.stringify(userLogged));
    localStorage.setItem("isLogged", JSON.stringify(true));
  };

  const logoutContext = () => {
    setUser(null);
    setUserProfile(null);
    setIsLogged(false);
    setUserEmpresas([]);
    setUserAuditorias([]);
    // setSocios([]); // Eliminado: socios
    setAuditoriasCompartidas([]);
    localStorage.removeItem("userInfo");
    localStorage.removeItem("isLogged");
  };

  // Función para actualizar perfil del usuario
  const updateUserProfile = async (updates) => {
    try {
      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, updates);
      
      // Actualizar estado local
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
      
      // Registrar log de la acción
      await registrarAccionSistema(
        user.uid,
        `Actualizar perfil de usuario`,
        { updates },
        'editar',
        'usuario',
        user.uid
      );
      
      return true;
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      throw error;
    }
  };

  // Función para crear o obtener el perfil del usuario
  const createOrGetUserProfile = async (firebaseUser) => {
    try {
      const userRef = doc(db, "usuarios", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profileData = userSnap.data();
        setUserProfile(profileData);
        setRole(profileData.role || null); // NUEVO
        setPermisos(profileData.permisos || {}); // NUEVO
        console.log('Usuario existente - Rol:', profileData.role, 'Permisos:', profileData.permisos);
        return profileData;
      } else {
        // Crear nuevo perfil de usuario
        const newProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          createdAt: new Date(),
          role: getUserRole(firebaseUser.email), // ✅ Usar función importada
          // ✅ Sistema multi-tenant: Cliente administrador responsable
          clienteAdminId: getUserRole(firebaseUser.email) === 'max' ? firebaseUser.uid : null, // Si es max, es su propio admin
          empresas: [], // IDs de empresas que el usuario puede ver
          auditorias: [], // IDs de auditorías que el usuario puede ver
          // Eliminado: socios. Usar solo usuarios.
          permisos: {
            puedeCrearEmpresas: true,
            puedeCrearSucursales: true,
            puedeCrearAuditorias: true,
            puedeCompartirFormularios: true,
            puedeAgregarSocios: true,
            puedeGestionarUsuarios: true,
            puedeVerLogs: true,
            puedeGestionarSistema: true,
            puedeEliminarUsuarios: true
          },
          configuracion: {
            notificaciones: true,
            tema: 'light'
          }
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        setRole(newProfile.role);
        setPermisos(newProfile.permisos);
        console.log('Usuario nuevo creado - Rol:', newProfile.role, 'Permisos:', newProfile.permisos);
        return newProfile;
      }
    } catch (error) {
      console.error("Error al crear/obtener perfil de usuario:", error);
      return null;
    }
  };

  // Función para obtener empresas del usuario (multi-tenant)
  const getUserEmpresas = async (userId) => {
    try {
      
      if (!userId) {
        setUserEmpresas([]);
        return [];
      }
      
      const empresasRef = collection(db, "empresas");
      let snapshot;
      
      // Si es supermax, ve todas las empresas
      if (role === 'supermax') {
        snapshot = await getDocs(empresasRef);
      } 
      // Si es max, solo ve sus propias empresas
      else if (role === 'max') {
        const q = query(empresasRef, where("propietarioId", "==", userId));
        snapshot = await getDocs(q);
      }
      // Si es operario, ve empresas de su cliente admin
      else {
        const userRef = doc(db, "usuarios", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const clienteAdminId = userData.clienteAdminId;
          if (clienteAdminId) {
            const q = query(empresasRef, where("propietarioId", "==", clienteAdminId));
            snapshot = await getDocs(q);
          } else {
            snapshot = { docs: [] }; // No tiene acceso
          }
        } else {
          snapshot = { docs: [] };
        }
      }
      
      const empresas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserEmpresas(empresas);
      return empresas;
    } catch (error) {
      console.error("Error al obtener empresas del usuario:", error);
      setUserEmpresas([]);
      return [];
    }
  };

  // Función para obtener auditorías del usuario (multi-tenant)
  const getUserAuditorias = async (userId) => {
    try {
      const auditoriasRef = collection(db, "reportes");
      let snapshot;
      
      // Si es supermax, ve todas las auditorías
      if (role === 'supermax') {
        snapshot = await getDocs(auditoriasRef);
      } 
      // Si es max, ve sus propias auditorías y las de sus operarios
      else if (role === 'max') {
        // Obtener auditorías propias
        const qPropias = query(auditoriasRef, where("usuarioId", "==", userId));
        const snapshotPropias = await getDocs(qPropias);
        
        // Obtener auditorías de sus operarios
        const usuariosRef = collection(db, "usuarios");
        const qOperarios = query(usuariosRef, where("clienteAdminId", "==", userId));
        const snapshotOperarios = await getDocs(qOperarios);
        const operariosIds = snapshotOperarios.docs.map(doc => doc.id);
        
        let auditoriasOperarios = [];
        if (operariosIds.length > 0) {
          const qAuditoriasOperarios = query(auditoriasRef, where("usuarioId", "in", operariosIds));
          const snapshotAuditoriasOperarios = await getDocs(qAuditoriasOperarios);
          auditoriasOperarios = snapshotAuditoriasOperarios.docs;
        }
        
        // Combinar auditorías propias y de operarios
        const todasLasAuditorias = [...snapshotPropias.docs, ...auditoriasOperarios];
        snapshot = { docs: todasLasAuditorias };
      }
      // Si es operario, ve sus propias auditorías
      else {
        const q = query(auditoriasRef, where("usuarioId", "==", userId));
        snapshot = await getDocs(q);
      }
      
      const auditorias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserAuditorias(auditorias);
      return auditorias;
    } catch (error) {
      console.error("Error al obtener auditorías del usuario:", error);
      return [];
    }
  };

  // Eliminada función getUserSocios. Usar solo usuarios.

  // Función para obtener auditorías compartidas
  const getAuditoriasCompartidas = async (userId) => {
    try {
      const auditoriasRef = collection(db, "reportes");
      const q = query(auditoriasRef, where("compartidoCon", "array-contains", userId));
      const snapshot = await getDocs(q);
      
      const auditorias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAuditoriasCompartidas(auditorias);
      return auditorias;
    } catch (error) {
      console.error("Error al obtener auditorías compartidas:", error);
      return [];
    }
  };

  // Eliminada función agregarSocio. Usar solo usuarios.

  // Función para compartir auditoría
  const compartirAuditoria = async (auditoriaId, emailUsuario) => {
    try {
      // Buscar usuario por email
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", emailUsuario));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error("Usuario no encontrado");
      }
      
      const usuarioDoc = snapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      
      // Actualizar auditoría para compartir
      const auditoriaRef = doc(db, "reportes", auditoriaId);
      const auditoriaSnap = await getDoc(auditoriaRef);
      
      if (auditoriaSnap.exists()) {
        const auditoriaData = auditoriaSnap.data();
        const compartidoCon = auditoriaData.compartidoCon || [];
        
        if (!compartidoCon.includes(usuarioId)) {
          await updateDoc(auditoriaRef, {
            compartidoCon: [...compartidoCon, usuarioId]
          });
          
          // Registrar log de la acción
          await registrarAccionSistema(
            user.uid,
            `Compartir auditoría con: ${emailUsuario}`,
            { emailUsuario, usuarioId, auditoriaId },
            'editar',
            'auditoria',
            auditoriaId
          );
          
          // Actualizar estado local
          await getAuditoriasCompartidas(user.uid);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error al compartir auditoría:", error);
      throw error;
    }
  };

  // Función para crear empresa (multi-tenant)
  const crearEmpresa = async (empresaData) => {
    try {
      const empresaRef = collection(db, "empresas");
      
      // Determinar propietario y creador
      let propietarioId, propietarioEmail, propietarioRole;
      let creadorId, creadorEmail, creadorRole;
      
      if (role === 'operario' && userProfile?.clienteAdminId) {
        // Si es operario, el propietario es su cliente admin
        propietarioId = userProfile.clienteAdminId;
        
        // Obtener email del cliente admin
        const adminRef = doc(db, "usuarios", userProfile.clienteAdminId);
        const adminSnap = await getDoc(adminRef);
        propietarioEmail = adminSnap.exists() ? adminSnap.data().email : 'admin@empresa.com';
        propietarioRole = 'max';
        
        // El creador es el operario
        creadorId = user.uid;
        creadorEmail = user.email;
        creadorRole = role;
      } else {
        // Si es admin o supermax, es propietario y creador
        propietarioId = user.uid;
        propietarioEmail = user.email;
        propietarioRole = role;
        
        creadorId = user.uid;
        creadorEmail = user.email;
        creadorRole = role;
      }
      
      const nuevaEmpresa = {
        ...empresaData,
        propietarioId,
        propietarioEmail,
        propietarioRole,
        creadorId,
        creadorEmail,
        creadorRole,
        createdAt: new Date(),
        socios: [propietarioId] // El propietario es el primer socio
        // Eliminado: socios. Usar solo usuarios.
      };
      
      const docRef = await addDoc(empresaRef, nuevaEmpresa);
      
      // Actualizar perfil del propietario (cliente admin)
      const propietarioRef = doc(db, "usuarios", propietarioId);
      const propietarioSnap = await getDoc(propietarioRef);
      
      if (propietarioSnap.exists()) {
        const propietarioData = propietarioSnap.data();
        const empresasActuales = propietarioData.empresas || [];
        
        await updateDoc(propietarioRef, {
          empresas: [...empresasActuales, docRef.id]
        });
      }
      
      // Actualizar estado local agregando la nueva empresa directamente
      const nuevaEmpresaConId = {
        id: docRef.id,
        ...nuevaEmpresa
      };
      
      setUserEmpresas(prevEmpresas => [...prevEmpresas, nuevaEmpresaConId]);
      
      // También recargar desde Firestore para asegurar consistencia
      await getUserEmpresas(user.uid);
      
      // Registrar log de la acción
      await registrarAccionSistema(
        user.uid,
        `Crear empresa: ${empresaData.nombre}`,
        { empresaData, empresaId: docRef.id, propietarioId, creadorId },
        'crear',
        'empresa',
        docRef.id
      );
      
      return docRef.id;
    } catch (error) {
      console.error("Error al crear empresa:", error);
      throw error;
    }
  };

  // NUEVO: Crear operario (solo para admin)
  const crearOperario = async (email, displayName = "Operario") => {
    try {
      // Verificar límite de usuarios
      const usuariosRef = collection(db, "usuarios");
      const qOperarios = query(usuariosRef, where("clienteAdminId", "==", user.uid));
      const snapshotOperarios = await getDocs(qOperarios);
      const usuariosActuales = snapshotOperarios.size;
      
      // Obtener límite del cliente admin
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);
      const limiteUsuarios = userSnap.data()?.limiteUsuarios || 10;
      
      if (usuariosActuales >= limiteUsuarios) {
        throw new Error(`Límite de usuarios alcanzado (${limiteUsuarios}). Contacta al administrador para aumentar tu límite.`);
      }

      // Crear usuario usando el backend (NO con createUserWithEmailAndPassword)
      const result = await userService.createUser({
        email,
        password: "123456", // Contraseña temporal
        nombre: displayName,
        role: 'operario',
        permisos: {
          puedeCrearEmpresas: false,
          puedeCrearSucursales: false,
          puedeCrearAuditorias: true,
          puedeCompartirFormularios: false,
          puedeAgregarSocios: false
        },
        clienteAdminId: user.uid
      });
      
      // Registrar log de la acción
      await registrarAccionSistema(
        user.uid,
        `Crear operario: ${email}`,
        { email, displayName, limiteUsuarios, usuariosActuales },
        'crear',
        'usuario',
        result.uid
      );

      return true;
    } catch (error) {
      console.error("Error al crear operario:", error);
      throw error;
    }
  };

  // NUEVO: Editar permisos de operario
  const editarPermisosOperario = async (userId, nuevosPermisos) => {
    try {
      const userRef = doc(db, "usuarios", userId);
      await updateDoc(userRef, { permisos: nuevosPermisos });
      await registrarLogOperario(userId, 'editarPermisos', { nuevosPermisos });
      await registrarAccionSistema(
        user.uid,
        `Editar permisos de operario`,
        { userId, nuevosPermisos },
        'editar',
        'usuario',
        userId
      );
      return true;
    } catch (error) {
      console.error("Error al editar permisos del operario:", error);
      throw error;
    }
  };

  // NUEVO: Registrar acción de operario
  const logAccionOperario = async (userId, accion, detalles = {}) => {
    try {
      await registrarLogOperario(userId, accion, detalles);
    } catch (error) {
      console.error("Error al registrar log de operario:", error);
    }
  };

  // Función para asignar usuario operario a cliente administrador
  const asignarUsuarioAClienteAdmin = async (userId, clienteAdminId) => {
    try {
      const userRef = doc(db, "usuarios", userId);
      await updateDoc(userRef, {
        clienteAdminId: clienteAdminId,
        ultimaModificacion: new Date()
      });
      
      // Actualizar estado local si es el usuario actual
      if (user && user.uid === userId) {
        setUserProfile(prev => ({
          ...prev,
          clienteAdminId: clienteAdminId
        }));
      }
      
      return true;
    } catch (error) {
      console.error("Error al asignar usuario a cliente admin:", error);
      return false;
    }
  };

  // Función para obtener usuarios de un cliente administrador
  const getUsuariosDeClienteAdmin = async (clienteAdminId) => {
    try {
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("clienteAdminId", "==", clienteAdminId));
      const snapshot = await getDocs(q);
      
      const usuarios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return usuarios;
    } catch (error) {
      console.error("Error al obtener usuarios del cliente admin:", error);
      return [];
    }
  };

  // Función para obtener formularios de un cliente administrador
  const getFormulariosDeClienteAdmin = async (clienteAdminId) => {
    try {
      const formulariosRef = collection(db, "formularios");
      const q = query(formulariosRef, where("clienteAdminId", "==", clienteAdminId));
      const snapshot = await getDocs(q);
      
      const formularios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return formularios;
    } catch (error) {
      console.error("Error al obtener formularios del cliente admin:", error);
      return [];
    }
  };

  // Función para verificar y corregir empresas sin propietarioId
  const verificarYCorregirEmpresas = async () => {
    try {
      
      if (!userProfile) {
        return 0;
      }

      // Solo verificar empresas que ya pertenecen al usuario actual
      const empresasAVerificar = userEmpresas || [];
      
      let empresasCorregidas = 0;
      const empresasActualizadas = [...userEmpresas]; // Clonar array actual
      
      for (const empresa of empresasAVerificar) {
        
        // Verificar si la empresa tiene propietarioId
        if (!empresa.propietarioId) {
          
          const empresaRef = doc(db, "empresas", empresa.id);
          await updateDoc(empresaRef, {
            propietarioId: userProfile.uid,
            propietarioEmail: userProfile.email,
            propietarioRole: userProfile.role,
            creadorId: userProfile.uid,
            creadorEmail: userProfile.email,
            creadorRole: userProfile.role,
            ultimaModificacion: new Date()
          });
          
          // Actualizar la empresa en el array local
          const index = empresasActualizadas.findIndex(e => e.id === empresa.id);
          if (index !== -1) {
            empresasActualizadas[index] = {
              ...empresasActualizadas[index],
              propietarioId: userProfile.uid,
              propietarioEmail: userProfile.email,
              propietarioRole: userProfile.role,
              creadorId: userProfile.uid,
              creadorEmail: userProfile.email,
              creadorRole: userProfile.role,
              ultimaModificacion: new Date()
            };
          }
          
          empresasCorregidas++;
        } else {
        }
      }
      
      // Actualizar el estado local sin recargar desde Firestore
      if (empresasCorregidas > 0) {
        setUserEmpresas(empresasActualizadas);
      }
      
      return empresasCorregidas;
    } catch (error) {
      console.error("Error al verificar empresas:", error);
      throw error;
    }
  };

  // Función para verificar si el usuario puede ver una empresa (multi-tenant)
  const canViewEmpresa = (empresaId) => {
    if (!userProfile) return false;
    
    // Super administradores pueden ver todas las empresas
    if (userProfile.role === 'supermax') {
      return true;
    }
    
    // Clientes administradores pueden ver sus empresas y las de sus usuarios
    if (userProfile.role === 'max') {
      // Sus propias empresas (donde es el propietario)
      if (userProfile.empresas && userProfile.empresas.includes(empresaId)) {
        return true;
      }
      
      // Empresas de sus usuarios operarios (verificar por propietarioId)
      // Esta lógica se puede expandir según la estructura de empresas
      // Por ahora, solo permitimos sus propias empresas
      return false;
    }
    
    // Usuarios operarios pueden ver empresas de su cliente administrador
    if (userProfile.role === 'operario') {
      // Sus propias empresas
      if (userProfile.empresas && userProfile.empresas.includes(empresaId)) {
        return true;
      }
      
      // Empresas de su cliente administrador
      // Esta lógica se puede expandir según la estructura de empresas
      // Por ahora, solo permitimos sus propias empresas
      return false;
    }
    
    return false;
  };

  // Función para verificar si el usuario puede ver una auditoría (multi-tenant)
  const canViewAuditoria = (auditoriaId) => {
    if (!userProfile) return false;
    
    // Super administradores pueden ver todas las auditorías
    if (userProfile.role === 'supermax') {
      return true;
    }
    
    // Clientes administradores pueden ver sus auditorías y las de sus usuarios
    if (userProfile.role === 'max') {
      // Sus propias auditorías
      if (userProfile.auditorias && userProfile.auditorias.includes(auditoriaId)) {
        return true;
      }
      
      // Auditorías de sus usuarios operarios
      // Esta lógica se puede expandir según la estructura de auditorías
      return true; // Por ahora permitimos acceso a todas las auditorías
    }
    
    // Usuarios operarios pueden ver auditorías de su cliente administrador
    if (userProfile.role === 'operario') {
      // Sus propias auditorías
      if (userProfile.auditorias && userProfile.auditorias.includes(auditoriaId)) {
        return true;
      }
      
      // Auditorías compartidas con él
      if (auditoriasCompartidas.some(aud => aud.id === auditoriaId)) {
        return true;
      }
      
      // Auditorías de su cliente administrador
      // Esta lógica se puede expandir según la estructura de auditorías
      return true; // Por ahora permitimos acceso a todas las auditorías
    }
    
    return false;
  };

  // Actualizar datos de una empresa y registrar log
  const updateEmpresa = async (empresaId, updateData) => {
    try {
      const empresaRef = doc(db, 'empresas', empresaId);
      await updateDoc(empresaRef, {
        ...updateData,
        ultimaModificacion: new Date(),
      });
      // Registrar log de acción
      await registrarAccionSistema(
        userProfile?.uid,
        `Actualización de empresa (${empresaId})`,
        { ...updateData },
        'update',
        'empresa',
        empresaId
      );
      // Actualizar localmente si corresponde
      setUserEmpresas((prev) => prev.map(e => e.id === empresaId ? { ...e, ...updateData, ultimaModificacion: new Date() } : e));
      return true;
    } catch (error) {
      console.error('[updateEmpresa] Error al actualizar empresa:', error);
      throw error;
    }
  };

  // Los valores disponibles en el contexto
  const data = {
    user,
    userProfile,
    isLogged,
    loading,
    userEmpresas,
    loadingEmpresas,
    userAuditorias,
    // Eliminado: socios. Usar solo usuarios.
    auditoriasCompartidas,
    handleLogin,
    logoutContext,
    // Eliminada función agregarSocio. Usar solo usuarios.
    crearEmpresa,
    updateUserProfile,
    canViewEmpresa,
    canViewAuditoria,
    getUserEmpresas: () => getUserEmpresas(user?.uid),
    getUserAuditorias: () => getUserAuditorias(user?.uid),
    // Eliminada función getUserSocios. Usar solo usuarios.
    getAuditoriasCompartidas: () => getAuditoriasCompartidas(user?.uid),
    role,
    permisos,
    crearOperario,
    editarPermisosOperario,
    logAccionOperario,
    asignarUsuarioAClienteAdmin,
    getUsuariosDeClienteAdmin,
    getFormulariosDeClienteAdmin,
    verificarYCorregirEmpresas,
    updateEmpresa,
    bloqueado,
    motivoBloqueo
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthContextProvider");
  }
  return context;
};

export default AuthContextComponent;
