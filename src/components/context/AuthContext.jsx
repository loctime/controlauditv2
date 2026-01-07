// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { auth } from "../../firebaseControlFile";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseControlFile";
import { updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { useUserManagement } from '../../hooks/useUserManagement';
import { empresaService } from '../../services/empresaService';
import { auditoriaService } from '../../services/auditoriaService';
import { saveCompleteUserCache } from '../../services/completeOfflineCache';
import { shouldEnableOffline } from '../../utils/pwaDetection';

// Hooks personalizados
import { useOfflineCache } from './hooks/useOfflineCache';
import { useUserDataLoaders } from './hooks/useUserDataLoaders';
import { useSucursalesListener } from './hooks/useSucursalesListener';
import { useFormulariosListener } from './hooks/useFormulariosListener';
import { useContextActions } from './hooks/useContextActions';
import { useEmpresasQuery } from '../../hooks/queries/useEmpresasQuery';

// Definimos y exportamos el contexto
export const AuthContext = createContext();

const AuthContextComponent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // UserContext simple: solo desde custom claims
  const [userContext, setUserContext] = useState(null);
  
  const [userEmpresas, setUserEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [userSucursales, setUserSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [userFormularios, setUserFormularios] = useState([]);
  const [loadingFormularios, setLoadingFormularios] = useState(true);
  const [userAuditorias, setUserAuditorias] = useState([]);
  const [auditoriasCompartidas, setAuditoriasCompartidas] = useState([]);
  
  // Estados globales de selección
  const [selectedEmpresa, setSelectedEmpresa] = useState('todas');
  const [selectedSucursal, setSelectedSucursal] = useState('todas');
  
  // Control para activar listeners diferidos
  const [enableDeferredListeners, setEnableDeferredListeners] = useState(false);
  
  // Hook de cache offline (solo para móvil)
  const { loadUserFromCache } = useOfflineCache();
  const enableOffline = shouldEnableOffline();

  // Hook TanStack Query para empresas
  const { empresas: empresasFromQuery, loading: empresasLoadingFromQuery } = useEmpresasQuery({
    userProfile: userContext, // Compatibilidad: userContext actúa como userProfile
    role: userContext?.role,
    authReady: !!userContext // Simple: authReady = userContext existe
  });

  // Sincronizar empresas del hook TanStack Query con el estado del contexto
  const prevEmpresasRef = useRef();
  const prevLoadingRef = useRef();
  
  useEffect(() => {
    const empresasArray = empresasFromQuery || [];
    const empresasString = JSON.stringify(empresasArray);
    const prevEmpresasString = JSON.stringify(prevEmpresasRef.current || []);
    
    if (empresasString !== prevEmpresasString) {
      setUserEmpresas(empresasArray);
      prevEmpresasRef.current = empresasArray;
    }
    
    if (empresasLoadingFromQuery !== prevLoadingRef.current) {
      setLoadingEmpresas(empresasLoadingFromQuery);
      prevLoadingRef.current = empresasLoadingFromQuery;
    }
  }, [empresasFromQuery, empresasLoadingFromQuery]);

  // Hooks de carga de datos
  const {
    loadUserSucursales,
    loadUserFormularios,
    loadUserAuditorias,
    loadAuditoriasCompartidas
  } = useUserDataLoaders(
    userContext, // Compatibilidad: userContext actúa como userProfile
    userContext?.role,
    empresasFromQuery || [],
    setUserEmpresas, 
    setLoadingEmpresas,
    setUserSucursales, 
    setLoadingSucursales,
    setUserFormularios, 
    setLoadingFormularios,
    enableOffline ? loadUserFromCache : null
  );

  // Hooks de listeners reactivos
  useSucursalesListener(
    userContext, 
    setUserSucursales, 
    setLoadingSucursales, 
    enableOffline ? loadUserFromCache : null,
    enableDeferredListeners,
    !!userContext // Simple: authReady = userContext existe
  );
  useFormulariosListener(
    userContext, 
    setUserFormularios, 
    setLoadingFormularios, 
    enableOffline ? loadUserFromCache : null,
    enableDeferredListeners,
    !!userContext // Simple: authReady = userContext existe
  );

  // Hook de acciones del contexto
  const {
    crearEmpresa,
    compartirAuditoria,
    verificarYCorregirEmpresas,
    updateEmpresa,
    forceRefreshCache
  } = useContextActions(
    user,
    userContext, // Compatibilidad: userContext actúa como userProfile
    userContext?.role,
    userEmpresas,
    userSucursales,
    userFormularios,
    setUserEmpresas,
    loadAuditoriasCompartidas
  );

  // ⚠️ DEUDA TÉCNICA: useUserManagement es legacy
  // Mezcla conceptos viejos - migrar a servicios owner-centric puros a mediano plazo
  // Por ahora se mantiene para compatibilidad, pero no usar para nuevas features
  const {
    editarPermisosOperario,
    logAccionOperario
  } = useUserManagement(user, userContext);

  // Estado para rastrear si estamos online
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actualizar cache automáticamente cuando los datos cambian
  useEffect(() => {
    if (!userContext?.uid || !user || !isLogged) return;
    
    const shouldUpdateCache = 
      userEmpresas?.length > 0 && 
      isOnline &&
      !loadingEmpresas && 
      !loadingSucursales && 
      !loadingFormularios;
    
    if (shouldUpdateCache && enableOffline) {
      const timeoutId = setTimeout(async () => {
        try {
          const completeProfile = {
            ...userContext,
            email: user?.email,
            displayName: user?.displayName || user?.email
          };
          
          await saveCompleteUserCache(
            completeProfile,
            userEmpresas,
            userSucursales || [],
            userFormularios || []
          );
          console.log('✅ Cache actualizado automáticamente');
        } catch (error) {
          console.error('❌ Error actualizando cache:', error);
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [userContext?.uid, userEmpresas?.length, userSucursales?.length, userFormularios?.length, isLogged, isOnline]);

  // Efecto principal de autenticación - SIMPLIFICADO
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setLoadingEmpresas(false);
      setLoadingSucursales(false);
      setLoadingFormularios(false);
    }, 2500);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsLogged(true);
          localStorage.setItem("userInfo", JSON.stringify(firebaseUser));
          localStorage.setItem("isLogged", JSON.stringify(true));
          
          // 1. Obtener custom claims del token (única fuente de verdad)
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const tokenRole = tokenResult.claims.role;
          const tokenOwnerId = tokenResult.claims.ownerId; // NO usar fallback - debe venir del token
          const tokenAppId = tokenResult.claims.appId;
          
          // Validar claims críticos
          if (!tokenRole || (tokenRole !== 'admin' && tokenRole !== 'operario')) {
            console.error('[AUTH] ❌ Token sin role válido');
            await signOut(auth);
            setUser(null);
            setUserContext(null);
            setLoading(false);
            return;
          }
          
          // Validar ownerId según role
          // admin → ownerId = uid (no viene en token)
          // operario → ownerId DEBE venir en el token
          if (tokenRole === 'operario' && !tokenOwnerId) {
            console.error('[AUTH] ❌ Operario sin ownerId en token');
            await signOut(auth);
            setUser(null);
            setUserContext(null);
            setLoading(false);
            return;
          }
          
          // Resolver ownerId según role
          const resolvedOwnerId = tokenRole === 'admin' ? firebaseUser.uid : tokenOwnerId;
          
          // 2. Validar existencia del documento en Firestore (solo exists/not exists)
          const userDocRef = doc(db, "apps", "auditoria", "owners", resolvedOwnerId, "usuarios", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists()) {
            console.error('[AUTH] ❌ Usuario no registrado en ControlAudit');
            // Logout limpio - no debe quedar medio logueado
            await signOut(auth);
            setUser(null);
            setUserContext(null);
            setLoading(false);
            return;
          }
          
          // 3. Si existe, crear userContext solo desde custom claims
          const context = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email,
            role: tokenRole, // SOLO del token
            ownerId: resolvedOwnerId, // SOLO del token
            appId: tokenAppId || 'auditoria'
          };
          
          setUserContext(context);
          console.log('[AUTH] ✅ Usuario autenticado:', context);
          
          // Cargar datos desde cache primero (solo datos secundarios)
          if (enableOffline && loadUserFromCache) {
            try {
              const cachedData = await loadUserFromCache();
              if (cachedData) {
                if (cachedData.empresas?.length > 0) {
                  setUserEmpresas(cachedData.empresas);
                  setLoadingEmpresas(false);
                }
                if (cachedData.sucursales?.length > 0) {
                  setUserSucursales(cachedData.sucursales);
                  setLoadingSucursales(false);
                }
                if (cachedData.formularios?.length > 0) {
                  setUserFormularios(cachedData.formularios);
                  setLoadingFormularios(false);
                }
                if (cachedData.auditorias?.length > 0) {
                  setUserAuditorias(cachedData.auditorias);
                }
              }
            } catch (cacheError) {
              console.warn('⚠️ Error cargando cache:', cacheError);
            }
          }
          
          // Cargar auditorías desde Firestore
          if (context.uid) {
            await Promise.all([
              loadUserAuditorias(firebaseUser.uid, context).then(aud => setUserAuditorias(aud)),
              loadAuditoriasCompartidas(firebaseUser.uid, context).then(aud => setAuditoriasCompartidas(aud))
            ]);
          }

          // Activar listeners diferidos después de carga inicial
          setTimeout(() => {
            setEnableDeferredListeners(true);
          }, 1000);
          
          // Inicializar carpetas de ControlFile (solo una vez)
          const initKey = `controlfile_initialized_${firebaseUser.uid}`;
          if (!localStorage.getItem(initKey)) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              const { initializeControlFileFolders } = await import('../../services/controlFileInit');
              const folders = await initializeControlFileFolders();
              if (folders.mainFolderId) {
                localStorage.setItem(initKey, 'true');
              }
            } catch (error) {
              console.error('[AuthContext] Error inicializando ControlFile:', error);
            }
          }
        } else {
          // Usuario no autenticado
          setUser(null);
          setIsLogged(false);
          setUserContext(null);
          setUserEmpresas([]);
          setUserAuditorias([]);
          setAuditoriasCompartidas([]);
          localStorage.removeItem("userInfo");
          localStorage.removeItem("isLogged");
          
          // Modo offline: cargar datos secundarios desde cache
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";
          if (wasLoggedIn && enableOffline && loadUserFromCache) {
            try {
              const cachedUser = await loadUserFromCache();
              if (cachedUser) {
                if (cachedUser.empresas?.length > 0) {
                  setUserEmpresas(cachedUser.empresas);
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
                setEnableDeferredListeners(true);
              }
            } catch (error) {
              console.error('Error cargando cache offline:', error);
            }
          }
        }
      } catch (error) {
        console.error('AuthContext error:', error);
        setUserContext(null);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleLogin = (userLogged) => {
    setUser(userLogged);
    setIsLogged(true);
    localStorage.setItem("userInfo", JSON.stringify(userLogged));
    localStorage.setItem("isLogged", JSON.stringify(true));
  };

  const logoutContext = () => {
    setUser(null);
    setIsLogged(false);
    setUserContext(null);
    setUserEmpresas([]);
    setUserAuditorias([]);
    setAuditoriasCompartidas([]);
    localStorage.removeItem("userInfo");
    localStorage.removeItem("isLogged");
  };

  // Función simple para actualizar perfil en Firestore (sin sincronizar estado)
  // ⚠️ IMPORTANTE: Solo usar para UI/preferencias/flags, NO para datos de auth
  // El auth se maneja exclusivamente con custom claims del token
  const updateUserProfile = async (updates) => {
    if (!userContext?.ownerId || !user?.uid) {
      console.error('[AuthContext] ownerId o uid no disponible');
      return false;
    }

    try {
      const userRef = doc(db, "apps", "auditoria", "owners", userContext.ownerId, "usuarios", user.uid);
      await updateDocWithAppId(userRef, updates);
      
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

  // Compatibilidad: userProfile y role desde userContext
  const userProfile = userContext;
  const role = userContext?.role;
  const authReady = !!userContext; // Simple: existe o no existe

  const data = {
    user,
    userProfile, // Compatibilidad: alias de userContext
    userContext, // Nuevo: contexto simple desde custom claims
    isLogged,
    loading,
    authReady, // Simple: userContext existe
    userEmpresas,
    loadingEmpresas,
    userSucursales,
    loadingSucursales,
    userFormularios,
    loadingFormularios,
    userAuditorias,
    auditoriasCompartidas,
    selectedEmpresa,
    setSelectedEmpresa,
    selectedSucursal,
    setSelectedSucursal,
    handleLogin,
    logoutContext,
    crearEmpresa,
    updateUserProfile,
    canViewEmpresa: (empresaId) => {
      if (role === 'operario') {
        return empresaService.canViewEmpresa(empresaId, userContext, userEmpresas);
      }
      return empresaService.canViewEmpresa(empresaId, userContext);
    },
    canViewAuditoria: (auditoriaId) => auditoriaService.canViewAuditoria(auditoriaId, userContext, auditoriasCompartidas),
    getUserSucursales: () => loadUserSucursales(user?.uid),
    getUserFormularios: () => loadUserFormularios(user?.uid),
    getUserAuditorias: () => loadUserAuditorias(user?.uid, userContext),
    getAuditoriasCompartidas: () => loadAuditoriasCompartidas(user?.uid, userContext),
    role,
    editarPermisosOperario,
    logAccionOperario,
    verificarYCorregirEmpresas,
    updateEmpresa,
    compartirAuditoria,
    forceRefreshCache,
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
