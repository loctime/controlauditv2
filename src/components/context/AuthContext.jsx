// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
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
  
  // Estado crítico: authReady solo es true cuando user, userProfile y role están completamente inicializados
  // Esto previene queries prematuras que causan errores de permisos
  const [authReady, setAuthReady] = useState(false);

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

  // Hook obsoleto - mantenido solo para compatibilidad
  // Las funciones de creación de usuarios se manejan directamente con userService
  const {
    editarPermisosOperario,
    logAccionOperario
  } = useUserManagement(user, userProfile);

  // Hook de cache offline (solo para móvil)
  const { loadUserFromCache } = useOfflineCache();
  const enableOffline = shouldEnableOffline(); // Solo true en PWA móvil instalada

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
    enableOffline ? loadUserFromCache : null
  );

  // Hooks de listeners reactivos (solo con fallback offline en móvil)
  // OPTIMIZACIÓN: Diferir listeners no críticos para evitar llamadas duplicadas con carga manual
  // Multi-tenant: Los datos ya vienen filtrados por usuario desde auditUserCollection
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

  // Listener de empresas (solo con fallback offline en móvil)
  // CRÍTICO: Solo ejecutar cuando authReady === true para evitar queries prematuras
  useEffect(() => {
    if (!authReady) {
      return;
    }
    
    if (
      !userProfile?.uid ||
      typeof role !== 'string' ||
      role.length === 0
    ) return;    
    const unsubscribe = empresaService.subscribeToUserEmpresas(
      userProfile, 
      role, 
      setUserEmpresas, 
      setLoadingEmpresas,
      enableOffline ? loadUserFromCache : null
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userProfile?.uid, role, enableOffline]);

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
          
          // Verificar que el token tenga el aud correcto (controlstorage-eb796)
          try {
            const token = await auth.currentUser.getIdTokenResult();
            console.log('[AUTH] Token aud claim:', token.claims.aud);
            if (token.claims.aud !== 'controlstorage-eb796') {
              console.warn('[AUTH] ⚠️ Token aud no coincide con controlstorage-eb796:', token.claims.aud);
            } else {
              console.log('[AUTH] ✅ Token aud correcto para ControlAudit:', token.claims.aud);
            }
          } catch (error) {
            console.error('[AUTH] Error obteniendo token:', error);
          }
          
          const profile = await createOrGetUserProfile(firebaseUser);
          
          if (profile) {
            setUserProfile(profile);
            
            // PASO 1: Cargar desde cache primero (instantáneo, elimina parpadeo)
            // Esto muestra datos inmediatamente mientras Firestore responde
            if (enableOffline && loadUserFromCache) {
              try {
                const cachedData = await loadUserFromCache();
                if (cachedData) {
                  console.log('📦 [Cache inicial] Cargando datos desde cache para mostrar inmediatamente...');
                  
                  // Cargar empresas desde cache si existen
                  if (cachedData.empresas && cachedData.empresas.length > 0) {
                    setUserEmpresas(cachedData.empresas);
                    setLoadingEmpresas(false);
                    console.log('✅ [Cache inicial] Empresas cargadas desde cache:', cachedData.empresas.length);
                  }
                  
                  // Cargar sucursales desde cache si existen
                  if (cachedData.sucursales && cachedData.sucursales.length > 0) {
                    setUserSucursales(cachedData.sucursales);
                    setLoadingSucursales(false);
                    console.log('✅ [Cache inicial] Sucursales cargadas desde cache:', cachedData.sucursales.length);
                  }
                  
                  // Cargar formularios desde cache si existen
                  if (cachedData.formularios && cachedData.formularios.length > 0) {
                    setUserFormularios(cachedData.formularios);
                    setLoadingFormularios(false);
                    console.log('✅ [Cache inicial] Formularios cargados desde cache:', cachedData.formularios.length);
                  }
                  
                  // Cargar auditorías desde cache si existen
                  if (cachedData.auditorias && cachedData.auditorias.length > 0) {
                    setUserAuditorias(cachedData.auditorias);
                    console.log('✅ [Cache inicial] Auditorías cargadas desde cache:', cachedData.auditorias.length);
                  }
                }
              } catch (cacheError) {
                console.warn('⚠️ [Cache inicial] No se pudo cargar desde cache (continuando con carga normal):', cacheError);
                // Continuar normalmente si el cache falla
              }
            }
            
            // CRÍTICO: Establecer authReady ANTES de ejecutar cualquier query
            // Solo cuando user, userProfile y role están completamente listos
            if (profile && profile.role && typeof profile.role === 'string' && profile.role.length > 0) {
              setAuthReady(true);
              console.log('✅ [AuthContext] authReady establecido - user, userProfile y role listos');
            }
            
            // PASO 2: Cargar desde Firestore (actualizará datos si hay cambios)
            // Solo ejecutar si authReady es true (ya establecido arriba si profile.role existe)
            if (profile && profile.role && typeof profile.role === 'string' && profile.role.length > 0) {
              const empresasCargadas = await loadUserEmpresas(firebaseUser.uid, profile, profile.role);
              
              // Cargar auditorías en paralelo (solo si profile tiene uid)
              if (profile && profile.uid) {
                await Promise.all([
                  loadUserAuditorias(firebaseUser.uid, profile).then(aud => setUserAuditorias(aud)),
                  loadAuditoriasCompartidas(firebaseUser.uid, profile).then(aud => setAuditoriasCompartidas(aud))
                ]);
              }

              // Cargar sucursales y formularios inmediatamente (sin setTimeout artificial)
              const [sucursalesCargadas, formulariosCargados] = await Promise.all([
                loadUserSucursales(firebaseUser.uid, empresasCargadas, profile),
                loadUserFormularios(firebaseUser.uid, empresasCargadas, profile)
              ]);
            }

            // OPTIMIZACIÓN: Activar listeners diferidos después de carga manual (evita duplicados)
            // Esperar 1 segundo para asegurar que la carga manual terminó completamente
            setTimeout(() => {
              setEnableDeferredListeners(true);
              console.log('✅ Listeners diferidos activados (optimización de performance)');
            }, 1000);

            // Verificar que tenemos datos antes de guardar cache (solo en móvil)
            if (enableOffline && empresasCargadas && empresasCargadas.length > 0) {
              try {
                const completeProfile = {
                  ...profile,
                  email: profile.email || firebaseUser.email,
                  displayName: profile.displayName || firebaseUser.displayName || firebaseUser.email,
                  role: profile.role || 'operario'
                };
                
                await saveCompleteUserCache(
                  completeProfile, 
                  empresasCargadas, 
                  sucursalesCargadas || [], 
                  formulariosCargados || []
                );
                console.log('✅ Cache guardado con datos:', {
                  empresas: empresasCargadas.length,
                  sucursales: (sucursalesCargadas || []).length,
                  formularios: (formulariosCargados || []).length
                });
              } catch (error) {
                console.error('❌ Error guardando cache:', error);
              }
            } else if (!enableOffline) {
              console.log('💻 Desktop: Cache offline deshabilitado (no necesario)');
            } else {
              console.warn('⚠️ No se guardó cache: no hay empresas cargadas');
            }
            
            // Inicializar carpetas de ControlFile después de autenticación exitosa
            // SOLO se ejecuta UNA VEZ por usuario usando localStorage
            const initKey = `controlfile_initialized_${firebaseUser.uid}`;
            const isInitialized = localStorage.getItem(initKey);
            
            if (!isInitialized) {
              try {
                // Esperar adicional para asegurar que el token esté actualizado
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { initializeControlFileFolders } = await import('../../services/controlFileInit');
                const folders = await initializeControlFileFolders();
                if (folders.mainFolderId) {
                  localStorage.setItem(initKey, 'true');
                  console.log('[AuthContext] ✅ Carpetas ControlFile inicializadas:', folders.mainFolderId);
                }
              } catch (error) {
                console.error('[AuthContext] ⚠️ Error al inicializar carpetas ControlFile (no crítico):', error);
                // No bloquear el flujo si falla la inicialización de carpetas
              }
            } else {
              console.log('[AuthContext] ⏭️ Inicialización de ControlFile omitida (ya inicializado)');
            }
          }
        } else {
          // Usuario no autenticado - resetear authReady
          setAuthReady(false);
          
          // Solo intentar cargar desde cache si estamos en móvil (modo offline habilitado)
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";
          
          // En modo offline, activar listeners diferidos inmediatamente (ya hay datos en cache)
          if (wasLoggedIn && enableOffline) {
            setEnableDeferredListeners(true);
          }
          
          if (wasLoggedIn && enableOffline) {
            console.log('📴 Modo offline detectado (móvil) - cargando desde cache...');
            const cachedUser = await loadUserFromCache();
            
            if (cachedUser && cachedUser.userProfile) {
              const cachedProfile = cachedUser.userProfile;
              console.log('✅ Cache encontrado para usuario:', cachedProfile.email);
              console.log('📊 Datos en cache:', {
                empresas: cachedUser.empresas?.length || 0,
                sucursales: cachedUser.sucursales?.length || 0,
                formularios: cachedUser.formularios?.length || 0,
                auditorias: cachedUser.auditorias?.length || 0
              });
              
              setUserProfile(cachedProfile);
              
              // CRÍTICO: Establecer authReady solo si el perfil del cache tiene role válido
              if (cachedProfile && cachedProfile.role && typeof cachedProfile.role === 'string' && cachedProfile.role.length > 0) {
                setAuthReady(true);
                console.log('✅ [AuthContext] authReady establecido desde cache - userProfile y role listos');
              }
              
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
              
              if (cachedUser.empresas && cachedUser.empresas.length > 0) {
                // Los servicios ya traen solo datos del usuario (multi-tenant)
                setUserEmpresas(cachedUser.empresas);
                setLoadingEmpresas(false);
                console.log('✅ Empresas cargadas desde cache:', cachedUser.empresas.length);
                console.log('📊 Detalle empresas:', cachedUser.empresas.map(e => e.nombre || e.id));
              } else {
                console.warn('⚠️ No hay empresas en cache');
                // Último intento: verificar localStorage directamente (Chrome)
                const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
                if (isChrome) {
                  console.log('🔍 [Chrome] Intentando cargar desde localStorage directamente...');
                  try {
                    const localCache = localStorage.getItem('complete_user_cache');
                    if (localCache) {
                      const parsed = JSON.parse(localCache);
                      if (parsed.empresas && parsed.empresas.length > 0) {
                        // Los servicios ya traen solo datos del usuario (multi-tenant)
                        setUserEmpresas(parsed.empresas);
                        setLoadingEmpresas(false);
                        console.log('✅ [Chrome] Empresas cargadas desde localStorage:', parsed.empresas.length);
                        // Mostrar toast solo en móvil/Chrome (async)
                        if (window.matchMedia('(display-mode: standalone)').matches) {
                          import('react-toastify').then(({ toast }) => {
                            toast.success(`✅ Modo offline: ${empresasFiltradas.length} empresas cargadas desde cache`, {
                              autoClose: 4000,
                              position: 'top-center'
                            });
                          });
                        }
                      } else {
                        // No hay empresas en localStorage tampoco
                        if (window.matchMedia('(display-mode: standalone)').matches) {
                          import('react-toastify').then(({ toast }) => {
                            toast.warning('⚠️ No hay empresas en cache. Conecta a internet y precarga las páginas.', {
                              autoClose: 6000,
                              position: 'top-center'
                            });
                          });
                        }
                      }
                    } else {
                      // No hay cache en localStorage
                      if (window.matchMedia('(display-mode: standalone)').matches) {
                        import('react-toastify').then(({ toast }) => {
                          toast.error('❌ No hay cache disponible. Conecta a internet y precarga las páginas primero.', {
                            autoClose: 7000,
                            position: 'top-center'
                          });
                        });
                      }
                    }
                  } catch (e) {
                    console.error('Error cargando desde localStorage:', e);
                    if (window.matchMedia('(display-mode: standalone)').matches) {
                      import('react-toastify').then(({ toast }) => {
                        toast.error(`❌ Error cargando cache: ${e.message}`, {
                          autoClose: 7000,
                          position: 'top-center'
                        });
                      });
                    }
                  }
                }
                if (!userEmpresas || userEmpresas.length === 0) {
                  setUserEmpresas([]);
                  setLoadingEmpresas(false);
                }
              }
              
              if (cachedUser.sucursales && cachedUser.sucursales.length > 0) {
                setUserSucursales(cachedUser.sucursales);
                setLoadingSucursales(false);
                console.log('✅ Sucursales cargadas desde cache:', cachedUser.sucursales.length);
              } else {
                console.warn('⚠️ No hay sucursales en cache');
                setUserSucursales([]);
                setLoadingSucursales(false);
              }
              
              if (cachedUser.formularios && cachedUser.formularios.length > 0) {
                setUserFormularios(cachedUser.formularios);
                setLoadingFormularios(false);
                console.log('✅ Formularios cargados desde cache:', cachedUser.formularios.length);
              } else {
                console.warn('⚠️ No hay formularios en cache');
                setUserFormularios([]);
                setLoadingFormularios(false);
              }
              
              if (cachedUser.auditorias && cachedUser.auditorias.length > 0) {
                setUserAuditorias(cachedUser.auditorias);
                console.log('✅ Auditorías cargadas desde cache:', cachedUser.auditorias.length);
              }
              
              // CRÍTICO: Inicializar datos offline para Edge PWA (solo en móvil)
              // Esto asegura que IndexedDB esté listo y los datos estén disponibles
              // incluso si el usuario entra offline directamente sin pasar por /auditoria
              if (enableOffline) {
                const isEdge = navigator.userAgent.includes('Edg');
                const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator.standalone === true) ||
                              document.referrer.includes('android-app://');
                
                if (isEdge && isPWA) {
                  try {
                    await initializeOfflineData(
                      cachedProfile,
                      setUserEmpresas,
                      setUserSucursales,
                      setUserFormularios
                    );
                  } catch (initError) {
                    console.warn('Error inicializando datos offline:', initError);
                    // Continuar sin fallar, los datos ya están cargados desde loadUserFromCache
                  }
                }
              }
            } else {
              console.error('❌ No hay cache válido disponible');
              setUser(null);
              setIsLogged(false);
              setAuthReady(false);
              setUserEmpresas([]);
              setUserAuditorias([]);
              setAuditoriasCompartidas([]);
              localStorage.removeItem("userInfo");
              localStorage.removeItem("isLogged");
            }
          } else if (wasLoggedIn && !enableOffline) {
            // En desktop sin conexión, simplemente cerrar sesión (no hay modo offline)
            console.log('💻 Desktop: Sin conexión y modo offline deshabilitado - cerrando sesión');
            setUser(null);
            setIsLogged(false);
            setAuthReady(false);
            setUserEmpresas([]);
            setUserAuditorias([]);
            setAuditoriasCompartidas([]);
            localStorage.removeItem("userInfo");
            localStorage.removeItem("isLogged");
          } else {
            setUser(null);
            setIsLogged(false);
            setAuthReady(false);
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
    setAuthReady(false);
    setUserEmpresas([]);
    setUserAuditorias([]);
    setAuditoriasCompartidas([]);
    localStorage.removeItem("userInfo");
    localStorage.removeItem("isLogged");
  };
  
  // Efecto para mantener authReady sincronizado con user, userProfile y role
  // Esto asegura que authReady se actualice automáticamente cuando cualquiera de estos cambie
  useEffect(() => {
    const isReady = !!(
      user &&
      userProfile &&
      userProfile.uid &&
      role &&
      typeof role === 'string' &&
      role.length > 0
    );
    
    // Solo actualizar si cambió el estado (evitar loops infinitos)
    if (isReady !== authReady) {
      setAuthReady(isReady);
      if (isReady) {
        console.log('✅ [AuthContext] authReady sincronizado - user, userProfile y role listos');
      } else {
        console.log('⏳ [AuthContext] authReady sincronizado - esperando inicialización completa');
      }
    }
  }, [user, userProfile, role, authReady]);

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
    canViewEmpresa: (empresaId) => empresaService.canViewEmpresa(empresaId, userProfile),
    canViewAuditoria: (auditoriaId) => auditoriaService.canViewAuditoria(auditoriaId, userProfile, auditoriasCompartidas),
    getUserEmpresas: () => loadUserEmpresas(user?.uid),
    getUserSucursales: () => loadUserSucursales(user?.uid),
    getUserFormularios: () => loadUserFormularios(user?.uid),
    getUserAuditorias: () => loadUserAuditorias(user?.uid, userProfile),
    getAuditoriasCompartidas: () => loadAuditoriasCompartidas(user?.uid, userProfile),
    role,
    permisos,
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
