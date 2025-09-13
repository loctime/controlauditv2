// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { registrarAccionSistema } from '../../utils/firestoreUtils';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useUserManagement } from '../../hooks/useUserManagement';
import { empresaService } from '../../services/empresaService';
import { auditoriaService } from '../../services/auditoriaService';

// Definimos y exportamos el contexto
export const AuthContext = createContext();

const AuthContextComponent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmpresas, setUserEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [userAuditorias, setUserAuditorias] = useState([]);
  const [auditoriasCompartidas, setAuditoriasCompartidas] = useState([]);

  // Usar hooks personalizados
  const {
    userProfile,
    role,
    permisos,
    bloqueado,
    motivoBloqueo,
    createOrGetUserProfile,
    updateUserProfile
  } = useUserProfile(user);

  const {
    crearOperario,
    editarPermisosOperario,
    logAccionOperario,
    asignarUsuarioAClienteAdmin,
    getUsuariosDeClienteAdmin,
    getFormulariosDeClienteAdmin
  } = useUserManagement(user, userProfile);

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
              loadUserEmpresas(firebaseUser.uid),
              loadUserAuditorias(firebaseUser.uid),
              loadAuditoriasCompartidas(firebaseUser.uid)
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
          setIsLogged(false);
          setUserEmpresas([]);
          setUserAuditorias([]);
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
    const unsubscribe = empresaService.subscribeToUserEmpresas(
      userProfile, 
      role, 
      setUserEmpresas, 
      setLoadingEmpresas
    );
    return unsubscribe;
  }, [userProfile?.uid, role, userProfile?.clienteAdminId]);


  const handleLogin = (userLogged) => {
    setUser(userLogged);
    setIsLogged(true);
    localStorage.setItem("userInfo", JSON.stringify(userLogged));
    localStorage.setItem("isLogged", JSON.stringify(true));
  };

  const logoutContext = () => {
    setUser(null);
    setIsLogged(false);
    setUserEmpresas([]);
    setUserAuditorias([]);
    setAuditoriasCompartidas([]);
    localStorage.removeItem("userInfo");
    localStorage.removeItem("isLogged");
  };

  // Funciones de carga de datos
  const loadUserEmpresas = async (userId) => {
    const empresas = await empresaService.getUserEmpresas(userId, role, userProfile?.clienteAdminId);
    setUserEmpresas(empresas);
    return empresas;
  };

  const loadUserAuditorias = async (userId) => {
    const auditorias = await auditoriaService.getUserAuditorias(userId, role);
    setUserAuditorias(auditorias);
    return auditorias;
  };

  const loadAuditoriasCompartidas = async (userId) => {
    const auditorias = await auditoriaService.getAuditoriasCompartidas(userId);
    setAuditoriasCompartidas(auditorias);
    return auditorias;
  };



  // Funciones wrapper para mantener compatibilidad
  const crearEmpresa = async (empresaData) => {
    const empresaId = await empresaService.crearEmpresa(empresaData, user, role, userProfile);
    
    // Actualizar estado local
    const nuevaEmpresaConId = {
      id: empresaId,
      ...empresaData,
      propietarioId: role === 'operario' && userProfile?.clienteAdminId ? userProfile.clienteAdminId : user.uid,
      propietarioEmail: role === 'operario' && userProfile?.clienteAdminId ? 'admin@empresa.com' : user.email,
      propietarioRole: role === 'operario' ? 'max' : role,
      creadorId: user.uid,
      creadorEmail: user.email,
      creadorRole: role,
      createdAt: new Date(),
      socios: [role === 'operario' && userProfile?.clienteAdminId ? userProfile.clienteAdminId : user.uid]
    };
    
    setUserEmpresas(prevEmpresas => [...prevEmpresas, nuevaEmpresaConId]);
    await loadUserEmpresas(user.uid);
    
    return empresaId;
  };

  const compartirAuditoria = async (auditoriaId, emailUsuario) => {
    await auditoriaService.compartirAuditoria(auditoriaId, emailUsuario, user);
    await loadAuditoriasCompartidas(user.uid);
    return true;
  };

  const verificarYCorregirEmpresas = async () => {
    const { empresasCorregidas, empresasActualizadas } = await empresaService.verificarYCorregirEmpresas(userEmpresas, userProfile);
    if (empresasCorregidas > 0) {
      setUserEmpresas(empresasActualizadas);
    }
    return empresasCorregidas;
  };

  const updateEmpresa = async (empresaId, updateData) => {
    await empresaService.updateEmpresa(empresaId, updateData, userProfile);
    setUserEmpresas((prev) => prev.map(e => e.id === empresaId ? { ...e, ...updateData, ultimaModificacion: new Date() } : e));
    return true;
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
    auditoriasCompartidas,
    handleLogin,
    logoutContext,
    crearEmpresa,
    updateUserProfile,
    canViewEmpresa: (empresaId) => empresaService.canViewEmpresa(empresaId, userProfile),
    canViewAuditoria: (auditoriaId) => auditoriaService.canViewAuditoria(auditoriaId, userProfile, auditoriasCompartidas),
    getUserEmpresas: () => loadUserEmpresas(user?.uid),
    getUserAuditorias: () => loadUserAuditorias(user?.uid),
    getAuditoriasCompartidas: () => loadAuditoriasCompartidas(user?.uid),
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
    compartirAuditoria,
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
