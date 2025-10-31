// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useUserProfile } from '../../hooks/useUserProfile';
import { useUserManagement } from '../../hooks/useUserManagement';
import { empresaService } from '../../services/empresaService';
import { auditoriaService } from '../../services/auditoriaService';
import { saveCompleteUserCache } from '../../services/completeOfflineCache';

// Hooks personalizados
import { useOfflineCache } from './hooks/useOfflineCache';
import { useUserDataLoaders } from './hooks/useUserDataLoaders';
import { useSucursalesListener } from './hooks/useSucursalesListener';
import { useFormulariosListener } from './hooks/useFormulariosListener';
import { useContextActions } from './hooks/useContextActions';

// Definimos y exportamos el contexto
export const AuthContext = createContext();

const AuthContextComponent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmpresas, setUserEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [userSucursales, setUserSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [userFormularios, setUserFormularios] = useState([]);
  const [loadingFormularios, setLoadingFormularios] = useState(true);
  const [userAuditorias, setUserAuditorias] = useState([]);
  const [auditoriasCompartidas, setAuditoriasCompartidas] = useState([]);

  // Usar hooks personalizados
  const {
    userProfile,
    setUserProfile,
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

  // Hook de cache offline
  const { loadUserFromCache } = useOfflineCache();

  // Hooks de carga de datos
  const {
    loadUserEmpresas,
    loadUserSucursales,
    loadUserFormularios,
    loadUserAuditorias,
    loadAuditoriasCompartidas
  } = useUserDataLoaders(
    userProfile, 
    role, 
    userEmpresas,
    setUserEmpresas, 
    setLoadingEmpresas,
    setUserSucursales, 
    setLoadingSucursales,
    setUserFormularios, 
    setLoadingFormularios,
    loadUserFromCache
  );

  // Hooks de listeners reactivos
  useSucursalesListener(userProfile, role, userEmpresas, setUserSucursales, setLoadingSucursales, loadUserFromCache);
  useFormulariosListener(userProfile, role, setUserFormularios, setLoadingFormularios, loadUserFromCache);

  // Hook de acciones del contexto
  const {
    crearEmpresa,
    compartirAuditoria,
    verificarYCorregirEmpresas,
    updateEmpresa,
    forceRefreshCache
  } = useContextActions(
    user,
    userProfile,
    role,
    userEmpresas,
    userSucursales,
    userFormularios,
    setUserEmpresas,
    loadAuditoriasCompartidas
  );

  // Listener de empresas (ya usa servicio)
  useEffect(() => {
    const unsubscribe = empresaService.subscribeToUserEmpresas(
      userProfile, 
      role, 
      setUserEmpresas, 
      setLoadingEmpresas,
      loadUserFromCache
    );
    return unsubscribe;
  }, [userProfile?.uid, role, userProfile?.clienteAdminId, loadUserFromCache]);

  // Efecto principal de autenticación
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setLoadingEmpresas(false);
      setLoadingSucursales(false);
      setLoadingFormularios(false);
      console.log('⏱️ Timeout alcanzado, finalizando loaders');
    }, 2500);
    
    const handleOnline = () => {
      // Los listeners se encargarán automáticamente
    };
    
    window.addEventListener('online', handleOnline);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsLogged(true);
          localStorage.setItem("userInfo", JSON.stringify(firebaseUser));
          localStorage.setItem("isLogged", JSON.stringify(true));
          
          const profile = await createOrGetUserProfile(firebaseUser);
          
          if (profile) {
            setUserProfile(profile);
            
            const empresasCargadas = await loadUserEmpresas(firebaseUser.uid, profile, profile.role);
            
            // Cargar auditorías en paralelo
            await Promise.all([
              loadUserAuditorias(firebaseUser.uid).then(aud => setUserAuditorias(aud)),
              loadAuditoriasCompartidas(firebaseUser.uid).then(aud => setAuditoriasCompartidas(aud))
            ]);

            setTimeout(async () => {
              const [sucursalesCargadas, formulariosCargados] = await Promise.all([
                loadUserSucursales(firebaseUser.uid, empresasCargadas, profile),
                loadUserFormularios(firebaseUser.uid, empresasCargadas, profile)
              ]);

              try {
                const completeProfile = {
                  ...profile,
                  clienteAdminId: profile.clienteAdminId || profile.uid,
                  email: profile.email || firebaseUser.email,
                  displayName: profile.displayName || firebaseUser.displayName || firebaseUser.email,
                  role: profile.role || 'operario'
                };
                
                await saveCompleteUserCache(
                  completeProfile, 
                  empresasCargadas, 
                  sucursalesCargadas, 
                  formulariosCargados
                );
                console.log('✅ Cache guardado');
              } catch (error) {
                console.error('Error guardando cache:', error);
              }
            }, 1500);
          }
        } else {
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";
          
          if (wasLoggedIn) {
            const cachedUser = await loadUserFromCache();
            
            if (cachedUser && cachedUser.userProfile) {
              const cachedProfile = cachedUser.userProfile;
              setUserProfile(cachedProfile);
              
              const simulatedUser = {
                uid: cachedProfile.uid,
                email: cachedProfile.email,
                displayName: cachedProfile.displayName || cachedProfile.email,
                emailVerified: true,
                isAnonymous: false,
                metadata: {
                  creationTime: cachedProfile.createdAt || new Date().toISOString(),
                  lastSignInTime: new Date().toISOString()
                }
              };
              
              setUser(simulatedUser);
              setIsLogged(true);
              localStorage.setItem("userInfo", JSON.stringify(simulatedUser));
              localStorage.setItem("isLogged", JSON.stringify(true));
              
              if (cachedUser.empresas?.length > 0) {
                let empresasFiltradas = cachedUser.empresas;
                if (cachedProfile.role !== 'supermax') {
                  empresasFiltradas = cachedUser.empresas.filter(empresa => 
                    empresa.propietarioId === cachedProfile.uid ||
                    empresa.creadorId === cachedProfile.uid ||
                    empresa.clienteAdminId === cachedProfile.clienteAdminId ||
                    empresa.clienteAdminId === cachedProfile.uid
                  );
                }
                setUserEmpresas(empresasFiltradas);
                setLoadingEmpresas(false);
              }
              
              if (cachedUser.sucursales?.length > 0) {
                setUserSucursales(cachedUser.sucursales);
                setLoadingSucursales(false);
              }
              
              if (cachedUser.formularios?.length > 0) {
                setUserFormularios(cachedUser.formularios);
                setLoadingFormularios(false);
              }
              
              if (cachedUser.auditorias?.length > 0) {
                setUserAuditorias(cachedUser.auditorias);
              }
            } else {
              setUser(null);
              setIsLogged(false);
              setUserEmpresas([]);
              setUserAuditorias([]);
              setAuditoriasCompartidas([]);
              localStorage.removeItem("userInfo");
              localStorage.removeItem("isLogged");
            }
          } else {
            setUser(null);
            setIsLogged(false);
            setUserEmpresas([]);
            setUserAuditorias([]);
            setAuditoriasCompartidas([]);
            localStorage.removeItem("userInfo");
            localStorage.removeItem("isLogged");
          }
        }
      } catch (error) {
        console.error('AuthContext error:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, [createOrGetUserProfile, setUserProfile, loadUserEmpresas, loadUserSucursales, loadUserFormularios, loadUserAuditorias, loadAuditoriasCompartidas, loadUserFromCache, user]);

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

  const data = {
    user,
    userProfile,
    isLogged,
    loading,
    userEmpresas,
    loadingEmpresas,
    userSucursales,
    loadingSucursales,
    userFormularios,
    loadingFormularios,
    userAuditorias,
    auditoriasCompartidas,
    handleLogin,
    logoutContext,
    crearEmpresa,
    updateUserProfile,
    canViewEmpresa: (empresaId) => empresaService.canViewEmpresa(empresaId, userProfile),
    canViewAuditoria: (auditoriaId) => auditoriaService.canViewAuditoria(auditoriaId, userProfile, auditoriasCompartidas),
    getUserEmpresas: () => loadUserEmpresas(user?.uid),
    getUserSucursales: () => loadUserSucursales(user?.uid),
    getUserFormularios: () => loadUserFormularios(user?.uid),
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
    forceRefreshCache,
    bloqueado,
    motivoBloqueo,
    loadUserFromCache
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth debe ser usado dentro de un AuthContextProvider");
    throw new Error("useAuth debe ser usado dentro de un AuthContextProvider");
  }
  return context;
};

export default AuthContextComponent;
