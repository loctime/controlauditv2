// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { registrarLogOperario } from '../../utils/firestoreUtils'; // NUEVO: función para logs
import { getUserRole } from '../../config/admin'; // ✅ Importar configuración del administrador

// Definimos y exportamos el contexto
export const AuthContext = createContext();

const AuthContextComponent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmpresas, setUserEmpresas] = useState([]);
  const [userAuditorias, setUserAuditorias] = useState([]);
  const [socios, setSocios] = useState([]);
  const [auditoriasCompartidas, setAuditoriasCompartidas] = useState([]);
  const [role, setRole] = useState(null); // NUEVO: rol del usuario
  const [permisos, setPermisos] = useState({}); // NUEVO: permisos del usuario

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsLogged(true);
        localStorage.setItem("userInfo", JSON.stringify(firebaseUser));
        localStorage.setItem("isLogged", JSON.stringify(true));
        
        // Crear o obtener perfil del usuario
        const profile = await createOrGetUserProfile(firebaseUser);
        
        if (profile) {
          // Cargar datos del usuario
          await Promise.all([
            getUserEmpresas(firebaseUser.uid),
            getUserAuditorias(firebaseUser.uid),
            getUserSocios(firebaseUser.uid),
            getAuditoriasCompartidas(firebaseUser.uid)
          ]);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsLogged(false);
        setUserEmpresas([]);
        setUserAuditorias([]);
        setSocios([]);
        setAuditoriasCompartidas([]);
        localStorage.removeItem("userInfo");
        localStorage.removeItem("isLogged");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    setSocios([]);
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
          socios: [], // IDs de usuarios que son socios
          permisos: {
            puedeCrearEmpresas: true,
            puedeCrearSucursales: true,
            puedeCrearAuditorias: true,
            puedeCompartirAuditorias: true,
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
      console.log('=== DEBUG getUserEmpresas ===');
      console.log('userId:', userId);
      console.log('role:', role);
      console.log('userProfile:', userProfile);
      
      const empresasRef = collection(db, "empresas");
      let snapshot;
      
      // Si es supermax, ve todas las empresas
      if (role === 'supermax') {
        console.log('Acceso: supermax - ve todas las empresas');
        snapshot = await getDocs(empresasRef);
      } 
      // Si es max, solo ve sus propias empresas
      else if (role === 'max') {
        console.log('Acceso: max - ve sus propias empresas');
        const q = query(empresasRef, where("propietarioId", "==", userId));
        snapshot = await getDocs(q);
      }
      // Si es operario, ve empresas de su cliente admin
      else {
        console.log('Acceso: operario - ve empresas de su cliente admin');
        const userRef = doc(db, "usuarios", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const clienteAdminId = userData.clienteAdminId;
          console.log('clienteAdminId:', clienteAdminId);
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
      
      console.log('Empresas encontradas:', empresas.length);
      console.log('Empresas:', empresas);
      console.log('=== FIN DEBUG ===');
      
      setUserEmpresas(empresas);
      return empresas;
    } catch (error) {
      console.error("Error al obtener empresas del usuario:", error);
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

  // Función para obtener socios del usuario
  const getUserSocios = async (userId) => {
    try {
      const userRef = doc(db, "usuarios", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const sociosIds = userData.socios || [];
        
        // Obtener información de los socios
        const sociosInfo = [];
        for (const socioId of sociosIds) {
          const socioRef = doc(db, "usuarios", socioId);
          const socioSnap = await getDoc(socioRef);
          if (socioSnap.exists()) {
            sociosInfo.push({
              id: socioSnap.id,
              ...socioSnap.data()
            });
          }
        }
        
        setSocios(sociosInfo);
        return sociosInfo;
      }
      return [];
    } catch (error) {
      console.error("Error al obtener socios del usuario:", error);
      return [];
    }
  };

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

  // Función para agregar socio
  const agregarSocio = async (emailSocio) => {
    try {
      // Buscar usuario por email
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", emailSocio));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error("Usuario no encontrado");
      }
      
      const socioDoc = snapshot.docs[0];
      const socioId = socioDoc.id;
      
      // Actualizar perfil del usuario actual
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const sociosActuales = userData.socios || [];
        
        if (!sociosActuales.includes(socioId)) {
          await updateDoc(userRef, {
            socios: [...sociosActuales, socioId]
          });
          
          // Actualizar estado local
          await getUserSocios(user.uid);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error al agregar socio:", error);
      throw error;
    }
  };

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
      const nuevaEmpresa = {
        ...empresaData,
        propietarioId: user.uid,
        propietarioEmail: user.email,
        propietarioRole: role, // Agregar el rol del propietario
        createdAt: new Date(),
        socios: [user.uid] // El propietario es el primer socio
      };
      
      const docRef = await addDoc(empresaRef, nuevaEmpresa);
      
      // Actualizar perfil del usuario
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const empresasActuales = userData.empresas || [];
        
        await updateDoc(userRef, {
          empresas: [...empresasActuales, docRef.id]
        });
      }
      
      // Actualizar estado local
      await getUserEmpresas(user.uid);
      
      return docRef.id;
    } catch (error) {
      console.error("Error al crear empresa:", error);
      throw error;
    }
  };

  // NUEVO: Crear operario (solo para admin)
  const crearOperario = async (email, displayName = "Operario") => {
    try {
      // Verificar si ya existe
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) throw new Error("El usuario ya existe");
      
      // Crear perfil básico con clienteAdminId
      const newOperario = {
        uid: null, // Se asignará al registrarse
        email,
        displayName,
        createdAt: new Date(),
        role: 'operario',
        clienteAdminId: user.uid, // Asignar al cliente admin actual
        empresas: [],
        auditorias: [],
        socios: [],
        permisos: {
          puedeCrearEmpresas: false,
          puedeCompartirAuditorias: false,
          puedeAgregarSocios: false,
          puedeCrearAuditorias: false,
          puedeCrearSucursales: false
        },
        configuracion: {
          notificaciones: true,
          tema: 'light'
        }
      };
      await addDoc(usuariosRef, newOperario);
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
      const empresasRef = collection(db, "empresas");
      const snapshot = await getDocs(empresasRef);
      
      for (const doc of snapshot.docs) {
        const empresaData = doc.data();
        
        // Si la empresa no tiene propietarioId, asignarlo al usuario actual
        if (!empresaData.propietarioId && userProfile) {
          await updateDoc(doc.ref, {
            propietarioId: userProfile.uid,
            propietarioEmail: userProfile.email,
            ultimaModificacion: new Date()
          });
          
          console.log(`✅ Empresa "${empresaData.nombre}" asignada a ${userProfile.email}`);
        }
      }
    } catch (error) {
      console.error("Error al verificar empresas:", error);
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

  // Los valores disponibles en el contexto
  const data = {
    user,
    userProfile,
    isLogged,
    loading,
    userEmpresas,
    userAuditorias,
    socios,
    auditoriasCompartidas,
    handleLogin,
    logoutContext,
    agregarSocio,
    compartirAuditoria,
    crearEmpresa,
    updateUserProfile,
    canViewEmpresa,
    canViewAuditoria,
    getUserEmpresas: () => getUserEmpresas(user?.uid),
    getUserAuditorias: () => getUserAuditorias(user?.uid),
    getUserSocios: () => getUserSocios(user?.uid),
    getAuditoriasCompartidas: () => getAuditoriasCompartidas(user?.uid),
    role,
    permisos,
    crearOperario,
    editarPermisosOperario,
    logAccionOperario,
    asignarUsuarioAClienteAdmin,
    getUsuariosDeClienteAdmin,
    getFormulariosDeClienteAdmin,
    verificarYCorregirEmpresas
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
