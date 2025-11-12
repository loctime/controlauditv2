// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useUserProfile } from '../../hooks/useUserProfile';
import { useUserManagement } from '../../hooks/useUserManagement';
import { empresaService } from '../../services/empresaService';
import { auditoriaService } from '../../services/auditoriaService';
import { saveCompleteUserCache } from '../../services/completeOfflineCache';
import { initializeOfflineData } from '../../utils/initializeOfflineData';

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
  
  // Bandera para evitar múltiples inicializaciones de ControlFile
  const controlFileInitializedRef = useRef(false);

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
    if (!userProfile?.uid || !role) return;
    
    const unsubscribe = empresaService.subscribeToUserEmpresas(
      userProfile, 
      role, 
      setUserEmpresas, 
      setLoadingEmpresas,
      loadUserFromCache
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid, role, userProfile?.clienteAdminId]);

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
    
    if (shouldUpdateCache) {
      // Debounce: esperar 3 segundos después del último cambio para evitar actualizaciones excesivas
      const timeoutId = setTimeout(async () => {
        try {
          const completeProfile = {
            ...userProfile,
            clienteAdminId: userProfile.clienteAdminId || userProfile.uid,
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

              // Verificar que tenemos datos antes de guardar cache
              if (empresasCargadas && empresasCargadas.length > 0) {
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
              } else {
                console.warn('⚠️ No se guardó cache: no hay empresas cargadas');
              }
              
              // Inicializar carpetas de ControlFile después de autenticación exitosa
              // SOLO se ejecuta UNA VEZ al iniciar sesión
              if (!controlFileInitializedRef.current) {
                controlFileInitializedRef.current = true;
                try {
                  // Esperar adicional para asegurar que el token esté actualizado
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const { initializeControlFileFolders } = await import('../../services/controlFileInit');
                  const folders = await initializeControlFileFolders();
                  if (folders.mainFolderId) {
                    console.log('[AuthContext] ✅ Carpetas ControlFile inicializadas:', folders.mainFolderId);
                  }
                } catch (error) {
                  console.error('[AuthContext] ⚠️ Error al inicializar carpetas ControlFile (no crítico):', error);
                  controlFileInitializedRef.current = false; // Permitir reintento si falla
                  // No bloquear el flujo si falla la inicialización de carpetas
                }
              }
            }, 2000);
          }
        } else {
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";
          
          if (wasLoggedIn) {
            console.log('📴 Modo offline detectado - cargando desde cache...');
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
                console.log('✅ Empresas cargadas desde cache:', empresasFiltradas.length);
                console.log('📊 Detalle empresas:', empresasFiltradas.map(e => e.nombre || e.id));
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
                        let empresasFiltradas = parsed.empresas;
                        if (cachedProfile.role !== 'supermax') {
                          empresasFiltradas = parsed.empresas.filter(empresa => 
                            empresa.propietarioId === cachedProfile.uid ||
                            empresa.creadorId === cachedProfile.uid ||
                            empresa.clienteAdminId === cachedProfile.clienteAdminId ||
                            empresa.clienteAdminId === cachedProfile.uid
                          );
                        }
                        setUserEmpresas(empresasFiltradas);
                        setLoadingEmpresas(false);
                        console.log('✅ [Chrome] Empresas cargadas desde localStorage:', empresasFiltradas.length);
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
              
              // CRÍTICO: Inicializar datos offline para Edge PWA
              // Esto asegura que IndexedDB esté listo y los datos estén disponibles
              // incluso si el usuario entra offline directamente sin pasar por /auditoria
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
            } else {
              console.error('❌ No hay cache válido disponible');
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
