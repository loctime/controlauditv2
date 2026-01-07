// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { auth } from "../../firebaseControlFile";
import { onAuthStateChanged } from "firebase/auth";
import { useUserProfile } from '../../hooks/useUserProfile';
import { useUserManagement } from '../../hooks/useUserManagement';
import { empresaService } from '../../services/empresaService';
import { auditoriaService } from '../../services/auditoriaService';
import { saveCompleteUserCache } from '../../services/completeOfflineCache';
import { initializeOfflineData } from '../../utils/initializeOfflineData';
import { shouldEnableOffline } from '../../utils/pwaDetection';

// Hooks personalizados
import { useOfflineCache } from './hooks/useOfflineCache';
import { useUserDataLoaders } from './hooks/useUserDataLoaders';
import { useSucursalesListener } from './hooks/useSucursalesListener';
import { useFormulariosListener } from './hooks/useFormulariosListener';
import { useContextActions } from './hooks/useContextActions';
import { useEmpresasQuery } from '../../hooks/queries/useEmpresasQuery';
// Nota: Ya no importamos initializeControlFileFolders directamente
// Usamos getControlFileFolders() que busca existentes primero

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
  
  // Estados globales de selección
  const [selectedEmpresa, setSelectedEmpresa] = useState('todas');
  const [selectedSucursal, setSelectedSucursal] = useState('todas');
  
  // Control para activar listeners diferidos (optimización: evitar llamadas duplicadas)
  const [enableDeferredListeners, setEnableDeferredListeners] = useState(false);
  
  // Estados para custom claims del token (fuente de verdad inicial)
  const [tokenClaims, setTokenClaims] = useState(null);
  
  // Estado crítico: authReady solo es true cuando user, tokenClaims, userProfile y role están completamente inicializados
  // Esto previene queries prematuras que causan errores de permisos
  const [authReady, setAuthReady] = useState(false);

  // Usar hooks personalizados
  const {
    userProfile,
    setUserProfile,
    role,
    bloqueado,
    motivoBloqueo,
    createOrGetUserProfile,
    updateUserProfile
  } = useUserProfile(user);

  // Hook obsoleto - mantenido solo para compatibilidad
  // Las funciones de creación de usuarios se manejan directamente con userService
  const {
    editarPermisosOperario,
    logAccionOperario
  } = useUserManagement(user, userProfile);

  // Hook de cache offline (solo para móvil)
  const { loadUserFromCache } = useOfflineCache();
  const enableOffline = shouldEnableOffline(); // Solo true en PWA móvil instalada

  // Hook TanStack Query para empresas - ÚNICA FUENTE DE VERDAD
  // Elimina la necesidad de fetch manual y listeners duplicados
  // Pasar valores directamente para evitar dependencia circular (useAuth no está disponible aún)
  const { empresas: empresasFromQuery, loading: empresasLoadingFromQuery } = useEmpresasQuery({
    userProfile,
    role,
    authReady
  });

  // Sincronizar empresas del hook TanStack Query con el estado del contexto
  // Usar useRef para rastrear valores anteriores y evitar loops infinitos
  const prevEmpresasRef = useRef();
  const prevLoadingRef = useRef();
  
  useEffect(() => {
    const empresasArray = empresasFromQuery || [];
    const empresasString = JSON.stringify(empresasArray);
    const prevEmpresasString = JSON.stringify(prevEmpresasRef.current || []);
    
    // Solo actualizar si el contenido realmente cambió
    if (empresasString !== prevEmpresasString) {
      setUserEmpresas(empresasArray);
      prevEmpresasRef.current = empresasArray;
    }
    
    // Solo actualizar loading si realmente cambió
    if (empresasLoadingFromQuery !== prevLoadingRef.current) {
      setLoadingEmpresas(empresasLoadingFromQuery);
      prevLoadingRef.current = empresasLoadingFromQuery;
    }
  }, [empresasFromQuery, empresasLoadingFromQuery]);

  // Hooks de carga de datos (sin loadUserEmpresas - ahora se usa useEmpresasQuery)
  const {
    loadUserSucursales,
    loadUserFormularios,
    loadUserAuditorias,
    loadAuditoriasCompartidas
  } = useUserDataLoaders(
    userProfile, 
    role, 
    empresasFromQuery || [], // Usar empresas del hook TanStack Query
    setUserEmpresas, 
    setLoadingEmpresas,
    setUserSucursales, 
    setLoadingSucursales,
    setUserFormularios, 
    setLoadingFormularios,
    enableOffline ? loadUserFromCache : null
  );

  // Hooks de listeners reactivos (solo con fallback offline en móvil)
  // OPTIMIZACIÓN: Diferir listeners no críticos para evitar llamadas duplicadas con carga manual
  // CRÍTICO: Pasar authReady para bloquear listeners hasta que la autenticación esté completa
  useSucursalesListener(
    userProfile, 
    setUserSucursales, 
    setLoadingSucursales, 
    enableOffline ? loadUserFromCache : null,
    enableDeferredListeners, // Solo activar después de carga manual inicial
    authReady // Bloquear hasta que authReady sea true
  );
  useFormulariosListener(
    userProfile, 
    setUserFormularios, 
    setLoadingFormularios, 
    enableOffline ? loadUserFromCache : null,
    enableDeferredListeners, // Solo activar después de carga manual inicial
    authReady // Bloquear hasta que authReady sea true
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
    userProfile,
    role,
    userEmpresas,
    userSucursales,
    userFormularios,
    setUserEmpresas,
    loadAuditoriasCompartidas
  );

  // ELIMINADO: Listener de empresas duplicado
  // Ahora se usa useEmpresasQuery que es la única fuente de verdad
  // El hook TanStack Query maneja tanto el fetch inicial como el listener reactivo

  // Estado para rastrear si estamos online
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Actualizar estado online/offline
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

  // Actualizar cache automáticamente cuando los datos cambian (después de reconexión)
  useEffect(() => {
    if (!userProfile?.uid || !user || !isLogged) return;
    
    // Solo actualizar si hay datos y estamos online
    const shouldUpdateCache = 
      userEmpresas?.length > 0 && 
      isOnline &&
      !loadingEmpresas && 
      !loadingSucursales && 
      !loadingFormularios;
    
    if (shouldUpdateCache && enableOffline) {
      // Debounce: esperar 3 segundos después del último cambio para evitar actualizaciones excesivas
      // Solo actualizar cache si estamos en móvil (modo offline habilitado)
      const timeoutId = setTimeout(async () => {
        try {
          const completeProfile = {
            ...userProfile,
            email: userProfile.email || user?.email,
            displayName: userProfile.displayName || user?.displayName || user?.email,
            role: userProfile.role || 'operario'
          };
          
          await saveCompleteUserCache(
            completeProfile,
            userEmpresas,
            userSucursales || [],
            userFormularios || []
          );
          console.log('✅ Cache actualizado automáticamente con datos actuales');
        } catch (error) {
          console.error('❌ Error actualizando cache automáticamente:', error);
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid, userEmpresas?.length, userSucursales?.length, userFormularios?.length, isLogged, isOnline]);

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
      console.log('🌐 Conexión restaurada');
      // Los listeners se actualizarán automáticamente
      // El cache se actualizará en el useEffect de abajo cuando los datos cambien
    };
    
    window.addEventListener('online', handleOnline);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsLogged(true);
          localStorage.setItem("userInfo", JSON.stringify(firebaseUser));
          localStorage.setItem("isLogged", JSON.stringify(true));
          
          // CRÍTICO: Leer SIEMPRE los custom claims del token (forzar refresh)
          // Esta es la fuente de verdad inicial para role y ownerId
          // Firebase puede tardar varios segundos en propagar los claims después de setearlos
          let tokenRole = null;
          let tokenOwnerId = null;
          let tokenAppId = null;
          
          // Delay inicial: dar tiempo a Firebase para propagar los claims
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retry mechanism: los claims pueden tardar en propagarse desde el backend
          const maxRetries = 10;
          const retryDelays = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000]; // delays progresivos en ms
          
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              // Paso 1: Forzar refresh del token (esto invalida el cache)
              await auth.currentUser.getIdToken(true);
              
              // Paso 2: Esperar antes de leer los claims
              if (attempt > 0) {
                await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
              }
              
              // Paso 3: Leer los claims del token refrescado
              const tokenResult = await auth.currentUser.getIdTokenResult(true);
              tokenRole = tokenResult.claims.role || null;
              tokenOwnerId = tokenResult.claims.ownerId || null;
              tokenAppId = tokenResult.claims.appId || null;
              
              console.log(`[AUTH] Token claims (intento ${attempt + 1}/${maxRetries}):`, {
                role: tokenRole,
                ownerId: tokenOwnerId,
                appId: tokenAppId,
                aud: tokenResult.claims.aud
              });
              
              // Si encontramos el role, salir del loop
              if (tokenRole) {
                break;
              }
              
              // Si es el último intento y no hay role, abortar (sin fallback legacy)
              if (attempt === maxRetries - 1) {
                console.error('[AUTH] ❌ Token sin role en claims después de', maxRetries, 'intentos');
                setTokenClaims(null);
                return;
              } else {
                console.warn(`[AUTH] ⚠️ Claims no disponibles aún, reintentando en ${retryDelays[attempt]}ms...`);
              }
            } catch (error) {
              console.error(`[AUTH] ❌ Error obteniendo token (intento ${attempt + 1}):`, error);
              if (attempt === maxRetries - 1) {
                // Último intento fallido, abortar (sin fallback legacy)
                console.error('[AUTH] ❌ Error obteniendo token después de todos los reintentos');
                setTokenClaims(null);
                return;
              }
            }
          }
          
          // Validar que los claims críticos existan después de todos los reintentos
          if (!tokenRole) {
            console.error('[AUTH] ❌ Token sin role en claims después de todos los reintentos');
            setTokenClaims(null);
            return;
          }
          
          // Para admin: ownerId debe ser igual al uid
          if (tokenRole === 'admin') {
            tokenOwnerId = firebaseUser.uid;
          }
          
          // Validar que operario tenga ownerId
          if (tokenRole === 'operario' && !tokenOwnerId) {
            console.error('[AUTH] ❌ Operario sin ownerId en token claims');
            setTokenClaims(null);
            return;
          }
          
          // Guardar claims como fuente de verdad
          setTokenClaims({
            role: tokenRole,
            ownerId: tokenOwnerId,
            appId: tokenAppId
          });
          
          console.log('[AUTH] ✅ Claims validados y guardados:', {
            role: tokenRole,
            ownerId: tokenOwnerId,
            appId: tokenAppId
          });
          
          // Usar createOrGetUserProfile con ownerId del token
          // Admin: ownerId = firebaseUser.uid (ya seteado arriba)
          // Operario: ownerId = tokenOwnerId (del token o fallback)
          let profile = null;
          
          if (tokenRole === 'admin') {
            profile = await createOrGetUserProfile(firebaseUser, firebaseUser.uid);
            if (!profile) {
              console.error('[AUTH] ❌ Admin no encontrado en owner-centric');
              setTokenClaims(null);
              return;
            }
          } else if (tokenRole === 'operario' && tokenOwnerId) {
            profile = await createOrGetUserProfile(firebaseUser, tokenOwnerId);
            if (!profile) {
              console.error('[AUTH] ❌ Operario no encontrado en owner-centric');
              setTokenClaims(null);
              return;
            }
          } else {
            console.error('[AUTH] ❌ Role inválido o operario sin ownerId:', { tokenRole, tokenOwnerId });
            setTokenClaims(null);
            return;
          }
          
          // Validar que el profile retornado tenga el role correcto
          if (!profile || !profile.role) {
            console.error('[AUTH] ❌ Profile sin role después de createOrGetUserProfile');
            setTokenClaims(null);
            return;
          }
          
          // Validar que el role del profile coincida con el role del token
          if (profile.role !== tokenRole) {
            console.error('[AUTH] ❌ Role del profile no coincide con token:', {
              profileRole: profile.role,
              tokenRole: tokenRole
            });
            setTokenClaims(null);
            return;
          }
          
          // Esperar a que useUserProfile sincronice estado (máximo 2 segundos)
          // El hook actualizará userProfile en el siguiente render, pero continuamos con el profile retornado
          let syncRetries = 0;
          const maxSyncRetries = 20; // 20 * 100ms = 2 segundos máximo
          while (!userProfile && syncRetries < maxSyncRetries) {
            await new Promise(resolve => setTimeout(resolve, 100));
            syncRetries++;
          }
          
          // Si userProfile aún no se sincronizó, usar el profile retornado directamente
          // El hook se sincronizará en el siguiente render, pero no bloqueamos el flujo
          if (!userProfile) {
            console.warn('[AUTH] ⚠️ userProfile aún no sincronizado, usando profile retornado. El hook se sincronizará en el siguiente render.');
            // No abortar, continuar con el flujo usando el profile retornado
          }
          
          // Perfil cargado exitosamente - useUserProfile ya seteo userProfile y role
          // Cargar datos desde cache primero (instantáneo) - SOLO datos secundarios
          if (enableOffline && loadUserFromCache) {
            try {
              const cachedData = await loadUserFromCache();
              if (cachedData) {
                console.log('📦 [Cache inicial] Cargando datos secundarios desde cache...');
                
                if (cachedData.empresas && cachedData.empresas.length > 0) {
                  setUserEmpresas(cachedData.empresas);
                  setLoadingEmpresas(false);
                }
                
                if (cachedData.sucursales && cachedData.sucursales.length > 0) {
                  setUserSucursales(cachedData.sucursales);
                  setLoadingSucursales(false);
                }
                
                if (cachedData.formularios && cachedData.formularios.length > 0) {
                  setUserFormularios(cachedData.formularios);
                  setLoadingFormularios(false);
                }
                
                if (cachedData.auditorias && cachedData.auditorias.length > 0) {
                  setUserAuditorias(cachedData.auditorias);
                }
              }
            } catch (cacheError) {
              console.warn('⚠️ [Cache inicial] Error cargando cache:', cacheError);
            }
          }
          
          // Cargar auditorías desde Firestore
          // Usar profile (valor retornado) para operaciones inmediatas si userProfile aún no se sincronizó
          // authReady se establecerá automáticamente por el useEffect cuando userProfile y tokenClaims coincidan
          const profileToUse = userProfile || profile;
          if (profileToUse?.uid) {
            await Promise.all([
              loadUserAuditorias(firebaseUser.uid, profileToUse).then(aud => setUserAuditorias(aud)),
              loadAuditoriasCompartidas(firebaseUser.uid, profileToUse).then(aud => setAuditoriasCompartidas(aud))
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
          setTokenClaims(null);
          setUserEmpresas([]);
          setUserAuditorias([]);
          setAuditoriasCompartidas([]);
          localStorage.removeItem("userInfo");
          localStorage.removeItem("isLogged");
          
          // Modo offline: solo cargar datos secundarios desde cache
          // NO setear userProfile desde cache (requiere Firestore + token válido)
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";
          if (wasLoggedIn && enableOffline && loadUserFromCache) {
            try {
              const cachedUser = await loadUserFromCache();
              if (cachedUser) {
                console.log('📴 [Modo offline] Cargando solo datos secundarios desde cache');
                
                // Solo cargar datos secundarios, NO userProfile
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleLogin = (userLogged) => {
    setUser(userLogged);
    setIsLogged(true);
    localStorage.setItem("userInfo", JSON.stringify(userLogged));
    localStorage.setItem("isLogged", JSON.stringify(true));
  };

  const logoutContext = () => {
    setUser(null);
    setIsLogged(false);
    setTokenClaims(null);
    setUserEmpresas([]);
    setUserAuditorias([]);
    setAuditoriasCompartidas([]);
    localStorage.removeItem("userInfo");
    localStorage.removeItem("isLogged");
  };
  
  // authReady se deriva automáticamente del estado (user, tokenClaims, userProfile)
  // CRÍTICO: Solo es true cuando TODOS los componentes están listos:
  // - user existe
  // - tokenClaims existe y tiene role y ownerId válidos
  // - userProfile existe y su role coincide con tokenClaims.role
  // NOTA: No dependemos de 'role' del hook porque puede tardar en sincronizarse
  // Usamos tokenClaims.role como fuente de verdad
  useEffect(() => {
    const hasValidTokenClaims = !!(
      tokenClaims &&
      tokenClaims.role &&
      typeof tokenClaims.role === 'string' &&
      tokenClaims.role.length > 0 &&
      tokenClaims.ownerId &&
      typeof tokenClaims.ownerId === 'string' &&
      tokenClaims.ownerId.length > 0
    );
    
    const hasValidUserProfile = !!(
      userProfile &&
      userProfile.uid &&
      userProfile.role &&
      typeof userProfile.role === 'string' &&
      userProfile.role.length > 0
    );
    
    // Verificar que el role del userProfile coincida con el role del tokenClaims
    // tokenClaims.role es la fuente de verdad
    const rolesMatch = tokenClaims?.role === userProfile?.role;
    
    const isReady = !!(
      user &&
      hasValidTokenClaims &&
      hasValidUserProfile &&
      rolesMatch
    );
    
    if (isReady !== authReady) {
      console.log('[AUTH] authReady:', isReady, {
        user: !!user,
        tokenClaims: hasValidTokenClaims,
        userProfile: hasValidUserProfile,
        rolesMatch,
        tokenRole: tokenClaims?.role,
        profileRole: userProfile?.role
      });
      setAuthReady(isReady);
    }
  }, [user, tokenClaims, userProfile, authReady]);

  const data = {
    user,
    userProfile,
    isLogged,
    loading,
    authReady, // Estado crítico: solo true cuando user, userProfile y role están completamente listos
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
      // ✅ Para operarios: pasar empresas ya resueltas (no userProfile)
      if (role === 'operario') {
        return empresaService.canViewEmpresa(empresaId, userProfile, userEmpresas);
      }
      // Para admin: usar userProfile
      return empresaService.canViewEmpresa(empresaId, userProfile);
    },
    canViewAuditoria: (auditoriaId) => auditoriaService.canViewAuditoria(auditoriaId, userProfile, auditoriasCompartidas),
    // ELIMINADO: getUserEmpresas - ahora se usa useEmpresasQuery directamente
    getUserSucursales: () => loadUserSucursales(user?.uid),
    getUserFormularios: () => loadUserFormularios(user?.uid),
    getUserAuditorias: () => loadUserAuditorias(user?.uid, userProfile),
    getAuditoriasCompartidas: () => loadAuditoriasCompartidas(user?.uid, userProfile),
    role,
    editarPermisosOperario,
    logAccionOperario,
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
