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
          empresas: [], // IDs de empresas que el usuario puede ver
          auditorias: [], // IDs de auditorías que el usuario puede ver
          socios: [], // IDs de usuarios que son socios
          permisos: {
            puedeCrearEmpresas: true,
            puedeCompartirAuditorias: true,
            puedeAgregarSocios: true,
            puedeCrearAuditorias: true,
            puedeCrearSucursales: true
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

  // Función para obtener empresas del usuario
  const getUserEmpresas = async (userId) => {
    try {
      const empresasRef = collection(db, "empresas");
      const q = query(empresasRef, where("propietarioId", "==", userId));
      const snapshot = await getDocs(q);
      
      const empresas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserEmpresas(empresas);
      return empresas;
    } catch (error) {
      console.error("Error al obtener empresas del usuario:", error);
      return [];
    }
  };

  // Función para obtener auditorías del usuario
  const getUserAuditorias = async (userId) => {
    try {
      const auditoriasRef = collection(db, "reportes");
      const q = query(auditoriasRef, where("usuarioId", "==", userId));
      const snapshot = await getDocs(q);
      
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

  // Función para crear empresa
  const crearEmpresa = async (empresaData) => {
    try {
      const empresaRef = collection(db, "empresas");
      const nuevaEmpresa = {
        ...empresaData,
        propietarioId: user.uid,
        propietarioEmail: user.email,
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
      // Crear perfil básico
      const newOperario = {
        uid: null, // Se asignará al registrarse
        email,
        displayName,
        createdAt: new Date(),
        role: 'operario',
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

  // Función para verificar si el usuario puede ver una empresa
  const canViewEmpresa = (empresaId) => {
    if (!userProfile) return false;
    
    // El usuario puede ver sus propias empresas
    if (userProfile.empresas && userProfile.empresas.includes(empresaId)) {
      return true;
    }
    
    // El usuario puede ver empresas de sus socios
    if (socios.length > 0) {
      return socios.some(socio => 
        socio.empresas && socio.empresas.includes(empresaId)
      );
    }
    
    return false;
  };

  // Función para verificar si el usuario puede ver una auditoría
  const canViewAuditoria = (auditoriaId) => {
    if (!userProfile) return false;
    
    // El usuario puede ver sus propias auditorías
    if (userProfile.auditorias && userProfile.auditorias.includes(auditoriaId)) {
      return true;
    }
    
    // El usuario puede ver auditorías compartidas con él
    if (auditoriasCompartidas.some(aud => aud.id === auditoriaId)) {
      return true;
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
    logAccionOperario
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
