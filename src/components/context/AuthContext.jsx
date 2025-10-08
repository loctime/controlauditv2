// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { registrarAccionSistema } from '../../utils/firestoreUtils';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useUserManagement } from '../../hooks/useUserManagement';
import { empresaService } from '../../services/empresaService';
import { auditoriaService } from '../../services/auditoriaService';
import { saveCompleteUserCache } from '../../services/completeOfflineCache';

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
    }, 3000); // 3 segundos máximo (aumentado para dar tiempo a cargar empresas)
    
    // Listener para detectar cambios de conectividad
    const handleOnline = () => {
      // Recargar datos cuando se restaura la conexión
      if (user) {
        loadUserEmpresas(user.uid);
        loadUserAuditorias(user.uid);
        loadAuditoriasCompartidas(user.uid);
        // Recargar sucursales y formularios después de un pequeño delay
        setTimeout(async () => {
          await Promise.all([
            loadUserSucursales(user.uid),
            loadUserFormularios(user.uid)
          ]);
        }, 1500);
      }
    };
    
    const handleOffline = () => {
      // Modo offline activado
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Función para cargar usuario desde cache offline
    const loadUserFromCache = async () => {
      try {
        if (!window.indexedDB) return null;
        
        const request = indexedDB.open('controlaudit_offline_v1', 2);
        const cachedUser = await new Promise((resolve, reject) => {
          request.onsuccess = function(event) {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('settings')) {
              resolve(null);
              return;
            }
            
            const transaction = db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            
            store.get('complete_user_cache').onsuccess = function(e) {
              const cached = e.target.result;
              if (cached && cached.value) {
                // Devolver todo el cache, no solo userProfile
                resolve(cached.value);
              } else {
                resolve(null);
              }
            };
          };
          request.onerror = function(event) {
            reject(event.target.error);
          };
        });
        
        return cachedUser;
      } catch (error) {
        console.error('Error al cargar usuario desde cache:', error);
        return null;
      }
    };
    
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
              loadUserEmpresas(firebaseUser.uid, profile, profile.role),
              loadUserAuditorias(firebaseUser.uid),
              loadAuditoriasCompartidas(firebaseUser.uid)
            ]);

            // Cargar sucursales y formularios después de que las empresas estén disponibles
            setTimeout(async () => {
              await Promise.all([
                loadUserSucursales(firebaseUser.uid),
                loadUserFormularios(firebaseUser.uid)
              ]);
            }, 1000); // Pequeño delay para asegurar que las empresas estén cargadas

            // Guardar cache completo para funcionamiento offline
            try {
              // Asegurar que el profile tenga todos los datos necesarios
              const completeProfile = {
                ...profile,
                clienteAdminId: profile.clienteAdminId || profile.uid, // Fallback al uid si no hay clienteAdminId
                email: profile.email || firebaseUser.email,
                displayName: profile.displayName || firebaseUser.displayName || firebaseUser.email,
                role: profile.role || 'operario'
              };
              
              await saveCompleteUserCache(completeProfile);
            } catch (error) {
              console.error('Error guardando cache completo:', error);
            }
          }
        } else {
          // Si no hay usuario de Firebase, verificar si hay cache offline
          
          // Solo cargar del cache si había un usuario autenticado previamente
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";
          
          if (wasLoggedIn) {
            const cachedUser = await loadUserFromCache();
            
            if (cachedUser && cachedUser.userProfile) {
              const userProfile = cachedUser.userProfile;
              
              // Crear un objeto usuario simulado para el cache
              const simulatedUser = {
                uid: userProfile.uid,
                email: userProfile.email,
                displayName: userProfile.displayName || userProfile.email,
                emailVerified: true,
                isAnonymous: false,
                metadata: {
                  creationTime: userProfile.createdAt || new Date().toISOString(),
                  lastSignInTime: new Date().toISOString()
                }
              };
              
              setUser(simulatedUser);
              setIsLogged(true);
              localStorage.setItem("userInfo", JSON.stringify(simulatedUser));
              localStorage.setItem("isLogged", JSON.stringify(true));
              
              // Cargar datos del cache
              if (cachedUser.empresas && cachedUser.empresas.length > 0) {
                // Aplicar filtrado multi-tenant si es necesario
                let empresasFiltradas = cachedUser.empresas;
                if (userProfile.role !== 'supermax') {
                  empresasFiltradas = cachedUser.empresas.filter(empresa => {
                    const esPropietario = empresa.propietarioId === userProfile.uid;
                    const esCreador = empresa.creadorId === userProfile.uid;
                    const esDelClienteAdmin = empresa.clienteAdminId === userProfile.clienteAdminId;
                    const esDelUsuario = empresa.clienteAdminId === userProfile.uid; // Para usuarios 'max'
                    
                    return esPropietario || esCreador || esDelClienteAdmin || esDelUsuario;
                  });
                }
                
                setUserEmpresas(empresasFiltradas);
              }
              if (cachedUser.auditorias && cachedUser.auditorias.length > 0) {
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
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
  const loadUserEmpresas = async (userId, providedProfile = null, providedRole = null) => {
    try {
      // Usar los parámetros provistos o los del estado
      const profileToUse = providedProfile || userProfile;
      const roleToUse = providedRole || role;

      // Asegurar que tenemos los datos necesarios
      if (!roleToUse || !profileToUse) {
        console.warn('⚠️ [AuthContext] Role o userProfile no disponibles aún');
        setLoadingEmpresas(false);
        return [];
      }

      const empresas = await empresaService.getUserEmpresas(userId, roleToUse, profileToUse?.clienteAdminId);
      setUserEmpresas(empresas);
      setLoadingEmpresas(false);
      return empresas;
    } catch (error) {
      // Fallback al cache offline si falla la carga desde Firestore
      try {
        const cachedData = await loadUserFromCache();
        if (cachedData?.empresas && cachedData.empresas.length > 0) {
          setUserEmpresas(cachedData.empresas);
          setLoadingEmpresas(false);
          return cachedData.empresas;
        }
      } catch (cacheError) {
        console.error('Error cargando desde cache offline:', cacheError);
      }
      
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return [];
    }
  };

  const loadUserSucursales = async (userId, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      if (!userProfile) {
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => loadUserSucursales(userId, retryCount + 1), 1000);
          return [];
        } else {
          setUserSucursales([]);
          setLoadingSucursales(false);
          return [];
        }
      }

      if (!userEmpresas || userEmpresas.length === 0) {
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => loadUserSucursales(userId, retryCount + 1), 1000);
          return [];
        } else {
          setUserSucursales([]);
          setLoadingSucursales(false);
          return [];
        }
      }

      setLoadingSucursales(true);

      let sucursalesData = [];
      
      if (role === 'supermax') {
        // Supermax ve todas las sucursales
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Para max y operario: cargar sucursales de sus empresas
        const empresasIds = userEmpresas.map(emp => emp.id);
        
        // Firestore limita 'in' queries a 10 elementos, dividir en chunks si es necesario
        const chunkSize = 10;
        const empresasChunks = [];
        for (let i = 0; i < empresasIds.length; i += chunkSize) {
          empresasChunks.push(empresasIds.slice(i, i + chunkSize));
        }

        const sucursalesPromises = empresasChunks.map(async (chunk) => {
          const sucursalesRef = collection(db, "sucursales");
          const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", chunk));
          const sucursalesSnapshot = await getDocs(sucursalesQuery);
          return sucursalesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const sucursalesArrays = await Promise.all(sucursalesPromises);
        sucursalesData = sucursalesArrays.flat();
      }
      
      setUserSucursales(sucursalesData);
      setLoadingSucursales(false);
      return sucursalesData;
    } catch (error) {
      // Fallback al cache offline si falla la carga desde Firestore
      try {
        const cachedData = await loadUserFromCache();
        if (cachedData?.sucursales && cachedData.sucursales.length > 0) {
          setUserSucursales(cachedData.sucursales);
          setLoadingSucursales(false);
          return cachedData.sucursales;
        }
      } catch (cacheError) {
        console.error('Error cargando sucursales desde cache offline:', cacheError);
      }
      
      setUserSucursales([]);
      setLoadingSucursales(false);
      return [];
    }
  };

  const loadUserFormularios = async (userId, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      if (!userProfile) {
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => loadUserFormularios(userId, retryCount + 1), 1000);
          return [];
        } else {
          setUserFormularios([]);
          setLoadingFormularios(false);
          return [];
        }
      }

      if (!userEmpresas || userEmpresas.length === 0) {
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => loadUserFormularios(userId, retryCount + 1), 1000);
          return [];
        } else {
          setUserFormularios([]);
          setLoadingFormularios(false);
          return [];
        }
      }

      setLoadingFormularios(true);

      let formulariosData = [];
      
      if (role === 'supermax') {
        // Supermax ve todos los formularios
        const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        // Max ve formularios donde es el clienteAdminId
        const formulariosQuery = query(
          collection(db, "formularios"), 
          where("clienteAdminId", "==", userProfile.uid)
        );
        const formulariosSnapshot = await getDocs(formulariosQuery);
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'operario' && userProfile.clienteAdminId) {
        // Operario ve formularios de su cliente admin
        const formulariosQuery = query(
          collection(db, "formularios"), 
          where("clienteAdminId", "==", userProfile.clienteAdminId)
        );
        const formulariosSnapshot = await getDocs(formulariosQuery);
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      setUserFormularios(formulariosData);
      setLoadingFormularios(false);
      return formulariosData;
    } catch (error) {
      // Fallback al cache offline si falla la carga desde Firestore
      try {
        const cachedData = await loadUserFromCache();
        if (cachedData?.formularios && cachedData.formularios.length > 0) {
          setUserFormularios(cachedData.formularios);
          setLoadingFormularios(false);
          return cachedData.formularios;
        }
      } catch (cacheError) {
        console.error('Error cargando formularios desde cache offline:', cacheError);
      }
      
      setUserFormularios([]);
      setLoadingFormularios(false);
      return [];
    }
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

  const forceRefreshCache = async () => {
    if (userProfile) {
      try {
        const cacheResult = await saveCompleteUserCache(userProfile);
        return cacheResult;
      } catch (error) {
        console.error('Error actualizando cache:', error);
        throw error;
      }
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
    motivoBloqueo
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth debe ser usado dentro de un AuthContextProvider");
    console.error("Stack trace:", new Error().stack);
    throw new Error("useAuth debe ser usado dentro de un AuthContextProvider");
  }
  return context;
};

export default AuthContextComponent;
