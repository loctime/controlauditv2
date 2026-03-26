import logger from '@/utils/logger';
// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { auth } from "../../firebaseControlFile";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseControlFile";
import { updateDocWithAppId } from '../../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../../utils/firestoreUtils';
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
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { normalizeRole } from '../../utils/accessControl';
import { getOfflineDatabase } from '../../services/offlineDatabase';
import syncQueueService from '../../services/syncQueue';

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

  // Estado para selectedOwnerId (solo para tu UID específico)
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);

  // Control para activar listeners diferidos
  const [enableDeferredListeners, setEnableDeferredListeners] = useState(false);

  // Evitar recuperar ítems fallidos más de una vez por sesión
  const syncRecoveryDoneRef = useRef(false);

  // Flag para saber si ya intentamos restaurar desde localStorage (evita múltiples restauraciones)
  const restoredFromStorageRef = useRef(false);

  // Restaurar selección desde localStorage al inicializar
  // Ejecuta apenas tengamos datos, no espera a que TODO esté listo
  useEffect(() => {
    if (!isLogged || !userContext) return;
    if (loadingEmpresas || loadingSucursales) return;

    // Si ya restauramos, salir
    if (restoredFromStorageRef.current) return;

    try {
      const savedEmpresa = localStorage.getItem('globalSelectedEmpresa');
      const savedSucursal = localStorage.getItem('globalSelectedSucursal');

      const empresasDisponibles = userEmpresas?.length > 0 ? userEmpresas : [];
      const sucursalesDisponibles = userSucursales?.length > 0 ? userSucursales : [];

      let empresaARestaurar = 'todas';
      let sucursalARestaurar = 'todas';

      // EMPRESA: Si hay guardado y es válido, usar. Si no, auto-seleccionar la primera.
      if (savedEmpresa && savedEmpresa !== 'todas') {
        const existe = empresasDisponibles.find(e => e.id === savedEmpresa);
        empresaARestaurar = existe ? savedEmpresa : (empresasDisponibles.length > 0 ? empresasDisponibles[0].id : 'todas');
      } else if ((!savedEmpresa || savedEmpresa === 'todas') && empresasDisponibles.length > 0) {
        // No hay guardado o está en 'todas', auto-seleccionar primera empresa
        empresaARestaurar = empresasDisponibles[0].id;
      }

      // SUCURSAL: Si la empresa es válida, intentar restaurar guardado o auto-seleccionar primera
      if (empresaARestaurar !== 'todas') {
        let sucursalValida = null;

        if (savedSucursal && savedSucursal !== 'todas') {
          sucursalValida = sucursalesDisponibles.find(
            s => s.id === savedSucursal && s.empresaId === empresaARestaurar
          );
        }

        if (!sucursalValida) {
          // No hay guardado válido, auto-seleccionar primera sucursal de la empresa
          sucursalValida = sucursalesDisponibles.find(s => s.empresaId === empresaARestaurar);
        }

        if (sucursalValida) {
          sucursalARestaurar = sucursalValida.id;
        }
      }

      // Aplicar valores
      if (empresaARestaurar !== selectedEmpresa) {
        setSelectedEmpresa(empresaARestaurar);
      }
      if (sucursalARestaurar !== selectedSucursal) {
        setSelectedSucursal(sucursalARestaurar);
      }

      // Marcar como restaurado
      restoredFromStorageRef.current = true;
      logger.debug('[AuthContext] ✅ Selecciones restauradas desde localStorage:', { empresaARestaurar, sucursalARestaurar });
    } catch (error) {
      logger.warn('[AuthContext] Error restaurando selección desde localStorage:', error);
      restoredFromStorageRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogged, userContext, userEmpresas, userSucursales, loadingEmpresas, loadingSucursales]);
  
  // Persistir selección en localStorage cuando cambie
  // IMPORTANTE: Persistir "todas" como valor válido
  useEffect(() => {
    if (!isLogged || !userContext) return;
    
    try {
      // Persistir siempre, incluyendo "todas"
      const valueToSave = selectedEmpresa || 'todas';
      localStorage.setItem('globalSelectedEmpresa', valueToSave);
    } catch (error) {
      logger.warn('[AuthContext] Error persistiendo empresa en localStorage:', error);
    }
  }, [selectedEmpresa, isLogged, userContext]);
  
  useEffect(() => {
    if (!isLogged || !userContext) return;
    
    try {
      // Persistir siempre, incluyendo "todas"
      const valueToSave = selectedSucursal || 'todas';
      localStorage.setItem('globalSelectedSucursal', valueToSave);
    } catch (error) {
      logger.warn('[AuthContext] Error persistiendo sucursal en localStorage:', error);
    }
  }, [selectedSucursal, isLogged, userContext]);

  // Persistir selectedOwnerId en localStorage (solo para tu UID)
  useEffect(() => {
    if (!isLogged || !userContext) return;
    
    // Solo persistir selectedOwnerId para tu UID específico
    if (userContext.uid === 'rixIn0BwiVPHB4SgR0K0SlnpSLC2') {
      try {
        if (selectedOwnerId) {
          localStorage.setItem('selectedOwnerId', selectedOwnerId);
        } else {
          localStorage.removeItem('selectedOwnerId');
        }
      } catch (error) {
        logger.warn('[AuthContext] Error persistiendo selectedOwnerId en localStorage:', error);
      }
    }
  }, [selectedOwnerId, isLogged, userContext]);

  // Restaurar selectedOwnerId desde localStorage (solo para tu UID)
  useEffect(() => {
    if (!isLogged || !userContext) return;
    
    // Solo restaurar selectedOwnerId para tu UID específico
    if (userContext.uid === 'rixIn0BwiVPHB4SgR0K0SlnpSLC2') {
      try {
        const savedOwnerId = localStorage.getItem('selectedOwnerId');
        if (savedOwnerId) {
          setSelectedOwnerId(savedOwnerId);
        }
      } catch (error) {
        logger.warn('[AuthContext] Error restaurando selectedOwnerId desde localStorage:', error);
      }
    }
  }, [isLogged, userContext]);
  
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
          logger.debug('✅ Cache actualizado automáticamente');
        } catch (error) {
          logger.error('❌ Error actualizando cache:', error);
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
          // Intentar force-refresh online; si falla offline, usar token cacheado
          let tokenResult;
          try {
            tokenResult = await firebaseUser.getIdTokenResult(true);
          } catch (tokenRefreshError) {
            if (!navigator.onLine) {
              logger.warn('[AUTH] Token refresh falló offline, usando token cacheado:', tokenRefreshError.message);
              tokenResult = await firebaseUser.getIdTokenResult(false);
            } else {
              throw tokenRefreshError;
            }
          }
          const tokenRole = tokenResult.claims.role;
          const tokenOwnerId = tokenResult.claims.ownerId; // NO usar fallback - debe venir del token
          const tokenAppId = tokenResult.claims.appId;
          const tokenSuperdev = tokenResult.claims.superdev === true; // Claim de superdev
          const effectiveRole = normalizeRole(tokenRole, tokenSuperdev);
          
          // Validar claims críticos
          if (!effectiveRole || (effectiveRole !== 'admin' && effectiveRole !== 'operario' && effectiveRole !== 'superdev')) {
            logger.error('[AUTH] ❌ Token sin role válido');
            await signOut(auth);
            setUser(null);
            setUserContext(null);
            setLoading(false);
            return;
          }
          
          // Validar ownerId según role
          // admin → ownerId = uid (no viene en token)
          // operario → ownerId DEBE venir en el token
          if (effectiveRole === 'operario' && !tokenOwnerId) {
            logger.error('[AUTH] ❌ Operario sin ownerId en token');
            await signOut(auth);
            setUser(null);
            setUserContext(null);
            setLoading(false);
            return;
          }
          
          // Resolver ownerId según role
          const resolvedOwnerId = effectiveRole === 'operario' ? tokenOwnerId : firebaseUser.uid;
          
          // Logs de token
          logger.debug('[AUTH][TOKEN]', { 
            authUid: firebaseUser.uid, 
            tokenRole, 
            tokenOwnerId 
          });
          
          // 2. Buscar perfil del usuario - MODELO OWNER-CENTRIC
          // Separar flujo por tokenRole
          let context = null;
          
          if (effectiveRole === 'admin' || effectiveRole === 'superdev') {
            // ADMIN: Leer apps/auditoria/owners/{firebaseUser.uid} como perfil
            const ownerDocRef = doc(db, "apps", "auditoria", "owners", firebaseUser.uid);
            const ownerDocSnap = await getDoc(ownerDocRef);
            
            if (ownerDocSnap.exists()) {
              const ownerData = ownerDocSnap.data();
              context = {
                uid: ownerData.uid || firebaseUser.uid,
                email: ownerData.email || firebaseUser.email,
                displayName: ownerData.displayName || firebaseUser.displayName || firebaseUser.email,
                role: effectiveRole,
                ownerId: resolvedOwnerId,
                appId: ownerData.appId || tokenAppId || 'auditoria',
                status: ownerData.status,
                superdev: tokenSuperdev
              };
              logger.debug('[AUTH][PROFILE]', { 
                profileSource: 'owner', 
                resolvedOwnerId, 
                profileUid: context.uid 
              });
            } else {
              // ⚠️ Admin no encontrado - buscar en legacy
              logger.debug('[AUTH] ⚠️ Owner no encontrado, buscando en legacy...');
              const legacyUserDocRef = doc(db, "apps", "auditoria", "users", firebaseUser.uid);
              const legacyUserDocSnap = await getDoc(legacyUserDocRef);
              
              if (legacyUserDocSnap.exists()) {
                const legacyData = legacyUserDocSnap.data();
                context = {
                  uid: legacyData.uid || firebaseUser.uid,
                  email: legacyData.email || firebaseUser.email,
                  displayName: legacyData.displayName || firebaseUser.displayName || firebaseUser.email,
                  role: effectiveRole,
                  ownerId: resolvedOwnerId,
                  appId: legacyData.appId || tokenAppId || 'auditoria',
                  status: legacyData.status,
                  superdev: tokenSuperdev
                };
                logger.debug('[AUTH][PROFILE]', { 
                  profileSource: 'legacy', 
                  resolvedOwnerId, 
                  profileUid: context.uid 
                });
              } else {
                // ❌ Admin no existe ni owner ni legacy
                logger.error('[AUTH] ❌ Admin no registrado en ControlAudit (ni owner ni legacy)');
                await signOut(auth);
                setUser(null);
                setUserContext(null);
                setLoading(false);
                return;
              }
            }
          } else if (effectiveRole === 'operario') {
            // OPERARIO: NO leer owners/{resolvedOwnerId} como perfil
            // Leer apps/auditoria/owners/{resolvedOwnerId}/usuarios/{firebaseUser.uid}
            const userDocRef = doc(db, ...firestoreRoutesCore.usuario(resolvedOwnerId, firebaseUser.uid));
            const userDocSnap = await getDoc(userDocRef);
            
            if (!userDocSnap.exists()) {
              // ❌ Operario debe existir en owner-centric sí o sí
              logger.error('[AUTH] ❌ Operario no encontrado en owner-centric:', {
                ownerId: resolvedOwnerId,
                userId: firebaseUser.uid
              });
              await signOut(auth);
              setUser(null);
              setUserContext(null);
              setLoading(false);
              return;
            }
            
            const userData = userDocSnap.data();
            context = {
              uid: firebaseUser.uid, // Operario siempre usa su propio uid
              email: userData.email || firebaseUser.email,
              displayName: userData.displayName || firebaseUser.displayName || firebaseUser.email,
              role: effectiveRole,
              ownerId: resolvedOwnerId,
              appId: userData.appId || tokenAppId || 'auditoria',
              status: userData.status,
              superdev: tokenSuperdev,
              empresasPermitidas: userData.empresasAsignadas || []
            };
            logger.debug('[AUTH][PROFILE]', { 
              profileSource: 'operarioDoc', 
              resolvedOwnerId, 
              profileUid: context.uid 
            });
            logger.debug('[AUTH] ✅ Empresas permitidas cargadas para operario:', context.empresasPermitidas.length);
          }
          
          setUserContext(context);
          logger.debug('[AUTH] ✅ Usuario autenticado:', context);

          // Recuperar ítems failed en syncQueue por errores de auth (una sola vez por sesión)
          if (!syncRecoveryDoneRef.current) {
            syncRecoveryDoneRef.current = true;
            try {
              const offlineDb = await getOfflineDatabase();
              const allItems = await offlineDb.getAll('syncQueue');
              const authFailedItems = allItems.filter(item =>
                item.status === 'failed' &&
                item.lastError &&
                (item.lastError.includes('ownerId') ||
                 item.lastError.includes('auth') ||
                 item.lastError.includes('token') ||
                 item.lastError.includes('autenticado') ||
                 item.lastError.includes('Timeout'))
              );
              if (authFailedItems.length > 0) {
                logger.debug(`[AUTH] 🔄 Recuperando ${authFailedItems.length} ítems failed por auth en syncQueue`);
                for (const item of authFailedItems) {
                  await offlineDb.put('syncQueue', {
                    ...item,
                    status: 'pending',
                    retries: 0,
                    lastError: null,
                    nextRetry: Date.now()
                  });
                }
                syncQueueService.processQueue(true);
              }
            } catch (recoveryError) {
              logger.warn('[AUTH] ⚠️ Error recuperando syncQueue:', recoveryError);
            }
          }

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
              logger.warn('⚠️ Error cargando cache:', cacheError);
            }
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
              await initializeControlFileFolders();
              localStorage.setItem(initKey, 'true');
            } catch (error) {
              logger.error('[AuthContext] Error inicializando ControlFile:', error);
            }
          }
        } else {
          // Usuario no autenticado
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";

          if (!wasLoggedIn) {
            // Logout real: limpiar todo
            setUser(null);
            setIsLogged(false);
            setUserContext(null);
            setUserEmpresas([]);
            setUserAuditorias([]);
            setAuditoriasCompartidas([]);
            localStorage.removeItem("isLogged");
            localStorage.removeItem("userInfo");
          } else if (enableOffline && loadUserFromCache) {
            // Firebase devuelve null pero el usuario estaba logueado = offline
            // No limpiar estado, cargar desde cache
            try {
              showDebug('>>> CARGANDO CACHE...');
              const cached = await loadUserFromCache();
              showDebug('cached result: ' + JSON.stringify(cached ? {
                perfil: !!cached.userProfile,
                empresas: cached.empresas?.length || 0,
                sucursales: cached.sucursales?.length || 0,
                formularios: cached.formularios?.length || 0
              } : 'NULL'));
              if (cached) {
                setUserContext(cached.userProfile);
                setUserEmpresas(cached.empresas || []);
                setUserSucursales(cached.sucursales || []);
                setUserFormularios(cached.formularios || []);
                setIsLogged(true);
              } else {
                showDebug('>>> CACHE VACIO - sin datos offline');
              }
            } catch(e) {
              logger.error('Error cargando cache offline:', e);
            }
          }
        }
      } catch (error) {
        logger.error('AuthContext error:', error);
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
    setSelectedEmpresa('todas');
    setSelectedSucursal('todas');
    setSelectedOwnerId(null); // Limpiar selectedOwnerId al hacer logout
    // IMPORTANTE: Resetear el flag de restauración para que funcione en próximos inicios de sesión
    restoredFromStorageRef.current = false;
    localStorage.removeItem("userInfo");
    localStorage.removeItem("isLogged");
    localStorage.removeItem("globalSelectedEmpresa");
    localStorage.removeItem("globalSelectedSucursal");
    localStorage.removeItem("selectedOwnerId"); // Limpiar selectedOwnerId del localStorage
  };

  // Función simple para actualizar perfil en Firestore (sin sincronizar estado)
  // ⚠️ IMPORTANTE: Solo usar para UI/preferencias/flags, NO para datos de auth
  // El auth se maneja exclusivamente con custom claims del token
  const updateUserProfile = async (updates) => {
    if (!userContext?.ownerId || !user?.uid) {
      logger.error('[AuthContext] ownerId o uid no disponible');
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
      logger.error("Error al actualizar perfil:", error);
      throw error;
    }
  };

  // Función para resolver ownerId basado en selectedOwnerId
  const getEffectiveOwnerId = () => {
    // Si el usuario es tu UID específico y hay un selectedOwnerId, usar ese
    if (user?.uid === 'rixIn0BwiVPHB4SgR0K0SlnpSLC2' && selectedOwnerId) {
      return selectedOwnerId;
    }
    
    // Para todos los demás casos, usar el ownerId normal del usuario
    return userContext?.ownerId || user?.uid;
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
    selectedOwnerId,
    setSelectedOwnerId,
    getEffectiveOwnerId, // Función para resolver ownerId
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
    getUserAuditorias: async () => {
      const aud = await loadUserAuditorias(user?.uid, userContext);
      setUserAuditorias(aud);
      return aud;
    },
    getAuditoriasCompartidas: async () => {
      const aud = await loadAuditoriasCompartidas(user?.uid, userContext);
      setAuditoriasCompartidas(aud);
      return aud;
    },
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
    logger.error("useAuth debe ser usado dentro de un AuthContextProvider");
    throw new Error("useAuth debe ser usado dentro de un AuthContextProvider");
  }
  return context;
};

export default AuthContextComponent;


