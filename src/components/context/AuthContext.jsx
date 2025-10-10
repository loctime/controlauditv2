// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
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

  // Función para cargar usuario desde cache offline (useCallback para que esté disponible en listeners)
  const loadUserFromCache = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    
    // Timeout de seguridad para evitar loading infinito
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setLoadingEmpresas(false);
      setLoadingSucursales(false);
      setLoadingFormularios(false);
      console.log('⏱️ Timeout alcanzado, finalizando loaders');
    }, 2500); // 2.5 segundos para móvil
    
    // Listener para detectar cambios de conectividad
    const handleOnline = () => {
      // Los listeners reactivos se encargarán de recargar automáticamente
      if (user) {
        loadUserAuditorias(user.uid);
        loadAuditoriasCompartidas(user.uid);
      }
    };
    
    const handleOffline = () => {
      // Modo offline activado
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
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
            
            // Establecer el perfil PRIMERO
            setUserProfile(profile);
            
            // Cargar datos bloqueantes (esperar para el cache inicial)
            const empresasCargadas = await loadUserEmpresas(firebaseUser.uid, profile, profile.role);
            
            console.log('🔍 Empresas cargadas antes de sucursales:', empresasCargadas?.length || 0);
            
            // Cargar auditorías en paralelo (no bloqueantes para sucursales)
            await Promise.all([
              loadUserAuditorias(firebaseUser.uid),
              loadAuditoriasCompartidas(firebaseUser.uid)
            ]);

            // Cargar sucursales y formularios después de que empresas estén listas
            setTimeout(async () => {
              const [sucursalesCargadas, formulariosCargados] = await Promise.all([
                loadUserSucursales(firebaseUser.uid, empresasCargadas, profile),
                loadUserFormularios(firebaseUser.uid, empresasCargadas, profile)
              ]);

              // Guardar cache DESPUÉS de cargar todos los datos - PASAR datos ya cargados
              try {
                const completeProfile = {
                  ...profile,
                  clienteAdminId: profile.clienteAdminId || profile.uid,
                  email: profile.email || firebaseUser.email,
                  displayName: profile.displayName || firebaseUser.displayName || firebaseUser.email,
                  role: profile.role || 'operario'
                };
                
                // ✅ Pasar datos YA cargados para evitar queries duplicadas (problema Chrome)
                await saveCompleteUserCache(
                  completeProfile, 
                  empresasCargadas, 
                  sucursalesCargadas, 
                  formulariosCargados
                );
                console.log('✅ Cache guardado con datos completos:', {
                  empresas: empresasCargadas?.length || 0,
                  sucursales: sucursalesCargadas?.length || 0,
                  formularios: formulariosCargados?.length || 0
                });
              } catch (error) {
                console.error('Error guardando cache completo:', error);
              }
            }, 1500);
          }
        } else {
          // Si no hay usuario de Firebase, verificar si hay cache offline
          
          // Solo cargar del cache si había un usuario autenticado previamente
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";
          
          if (wasLoggedIn) {
            const cachedUser = await loadUserFromCache();
            
            if (cachedUser && cachedUser.userProfile) {
              const cachedProfile = cachedUser.userProfile;
              
              // Establecer el perfil del usuario
              setUserProfile(cachedProfile);
              
              // Crear un objeto usuario simulado para el cache
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
              
              // Cargar TODOS los datos del cache
              if (cachedUser.empresas && cachedUser.empresas.length > 0) {
                let empresasFiltradas = cachedUser.empresas;
                if (cachedProfile.role !== 'supermax') {
                  empresasFiltradas = cachedUser.empresas.filter(empresa => {
                    const esPropietario = empresa.propietarioId === cachedProfile.uid;
                    const esCreador = empresa.creadorId === cachedProfile.uid;
                    const esDelClienteAdmin = empresa.clienteAdminId === cachedProfile.clienteAdminId;
                    const esDelUsuario = empresa.clienteAdminId === cachedProfile.uid;
                    
                    return esPropietario || esCreador || esDelClienteAdmin || esDelUsuario;
                  });
                }
                
                setUserEmpresas(empresasFiltradas);
                setLoadingEmpresas(false);
              }
              
              if (cachedUser.sucursales && cachedUser.sucursales.length > 0) {
                setUserSucursales(cachedUser.sucursales);
                setLoadingSucursales(false);
              }
              
              if (cachedUser.formularios && cachedUser.formularios.length > 0) {
                setUserFormularios(cachedUser.formularios);
                setLoadingFormularios(false);
              }
              
              if (cachedUser.auditorias && cachedUser.auditorias.length > 0) {
                setUserAuditorias(cachedUser.auditorias);
              }
              
              console.log('✅ Datos cargados desde cache offline:', {
                empresas: empresasFiltradas?.length || 0,
                sucursales: cachedUser.sucursales?.length || 0,
                formularios: cachedUser.formularios?.length || 0
              });
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

  // --- Listeners reactivos para datos del usuario (multi-tenant) ---
  
  // Listener para empresas
  useEffect(() => {
    const unsubscribe = empresaService.subscribeToUserEmpresas(
      userProfile, 
      role, 
      setUserEmpresas, 
      setLoadingEmpresas,
      loadUserFromCache // Pasar función de cache para fallback offline
    );
    return unsubscribe;
  }, [userProfile?.uid, role, userProfile?.clienteAdminId, loadUserFromCache]);

  // Listener para sucursales (depende de que empresas estén cargadas)
  useEffect(() => {
    if (!userProfile || !role || !userEmpresas || userEmpresas.length === 0) {
      setUserSucursales([]);
      setLoadingSucursales(false);
      return;
    }

    setLoadingSucursales(true);
    const sucursalesRef = collection(db, 'sucursales');
    let q;

    if (role === 'supermax') {
      q = sucursalesRef;
    } else {
      const empresasIds = userEmpresas.map(emp => emp.id);
      // Firestore limita 'in' a 10 elementos, usar solo las primeras 10
      const empresasIdsLimited = empresasIds.slice(0, 10);
      q = query(sucursalesRef, where('empresaId', 'in', empresasIdsLimited));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const sucursalesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Si hay más de 10 empresas, cargar el resto manualmente
        if (role !== 'supermax' && userEmpresas.length > 10) {
          const empresasIds = userEmpresas.map(emp => emp.id);
          const remainingIds = empresasIds.slice(10);
          
          const loadRemainingSucursales = async () => {
            const chunks = [];
            for (let i = 0; i < remainingIds.length; i += 10) {
              chunks.push(remainingIds.slice(i, i + 10));
            }
            
            const promises = chunks.map(chunk => 
              getDocs(query(sucursalesRef, where('empresaId', 'in', chunk)))
            );
            
            const snapshots = await Promise.all(promises);
            const moreSucursales = snapshots.flatMap(snap => 
              snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            );
            
            setUserSucursales([...sucursalesData, ...moreSucursales]);
            setLoadingSucursales(false);
          };
          
          loadRemainingSucursales().catch(err => {
            console.error('❌ Error cargando sucursales adicionales:', err);
            setUserSucursales(sucursalesData);
            setLoadingSucursales(false);
          });
        } else {
          setUserSucursales(sucursalesData);
          setLoadingSucursales(false);
        }
      },
      async (error) => {
        console.error('❌ Error en listener de sucursales:', error);
        
        // Fallback al cache offline
        try {
          const cachedData = await loadUserFromCache();
          if (cachedData?.sucursales && cachedData.sucursales.length > 0) {
            console.log('🔄 [Offline] Usando sucursales del cache IndexedDB:', cachedData.sucursales.length);
            setUserSucursales(cachedData.sucursales);
            setLoadingSucursales(false);
            return;
          }
        } catch (cacheError) {
          console.error('Error cargando sucursales desde cache:', cacheError);
        }
        
        setUserSucursales([]);
        setLoadingSucursales(false);
      }
    );

    return unsubscribe;
  }, [userProfile?.uid, role, userEmpresas, loadUserFromCache]);

  // Listener para formularios
  useEffect(() => {
    if (!userProfile || !role) {
      setUserFormularios([]);
      setLoadingFormularios(false);
      return;
    }

    setLoadingFormularios(true);
    const formulariosRef = collection(db, 'formularios');
    let q;

    if (role === 'supermax') {
      q = formulariosRef;
    } else if (role === 'max') {
      q = query(formulariosRef, where('clienteAdminId', '==', userProfile.uid));
    } else if (role === 'operario' && userProfile.clienteAdminId) {
      q = query(formulariosRef, where('clienteAdminId', '==', userProfile.clienteAdminId));
    } else {
      setUserFormularios([]);
      setLoadingFormularios(false);
      return;
    }

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const formulariosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserFormularios(formulariosData);
        setLoadingFormularios(false);
      },
      async (error) => {
        console.error('❌ Error en listener de formularios:', error);
        
        // Fallback al cache offline
        try {
          const cachedData = await loadUserFromCache();
          if (cachedData?.formularios && cachedData.formularios.length > 0) {
            console.log('🔄 [Offline] Usando formularios del cache IndexedDB:', cachedData.formularios.length);
            setUserFormularios(cachedData.formularios);
            setLoadingFormularios(false);
            return;
          }
        } catch (cacheError) {
          console.error('Error cargando formularios desde cache:', cacheError);
        }
        
        setUserFormularios([]);
        setLoadingFormularios(false);
      }
    );

    return unsubscribe;
  }, [userProfile?.uid, role, userProfile?.clienteAdminId, loadUserFromCache]);


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

  // Funciones de carga de datos (usadas al login para cache inicial)
  const loadUserEmpresas = async (userId, providedProfile = null, providedRole = null) => {
    try {
      const profileToUse = providedProfile || userProfile;
      const roleToUse = providedRole || role;

      if (!roleToUse || !profileToUse) {
        setLoadingEmpresas(false);
        return [];
      }

      const empresas = await empresaService.getUserEmpresas(userId, roleToUse, profileToUse?.clienteAdminId);
      setUserEmpresas(empresas);
      setLoadingEmpresas(false);
      return empresas;
    } catch (error) {
      console.error('❌ Error cargando empresas:', error);
      
      try {
        const cachedData = await loadUserFromCache();
        if (cachedData?.empresas && cachedData.empresas.length > 0) {
          setUserEmpresas(cachedData.empresas);
          setLoadingEmpresas(false);
          return cachedData.empresas;
        }
      } catch (cacheError) {
        console.error('Error cargando desde cache:', cacheError);
      }
      
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return [];
    }
  };

  const loadUserSucursales = async (userId, empresasParam = null, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      console.log('🔍 loadUserSucursales llamado con:', {
        userId,
        empresasParam: empresasParam?.length || 'null/undefined',
        userEmpresas: userEmpresas?.length || 0,
        userProfile: !!userProfile,
        profileParam: !!profileParam
      });
      
      const empresasToUse = empresasParam || userEmpresas;
      
      if (!profileToUse || !empresasToUse || empresasToUse.length === 0) {
        console.log('⚠️ loadUserSucursales: No hay empresas disponibles', {
          profileToUse: !!profileToUse,
          empresasToUse: empresasToUse?.length || 0
        });
        setUserSucursales([]);
        setLoadingSucursales(false);
        return [];
      }

      console.log('🔍 loadUserSucursales: Cargando para', empresasToUse.length, 'empresas');
      setLoadingSucursales(true);
      let sucursalesData = [];
      
      if (role === 'supermax') {
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        const empresasIds = empresasToUse.map(emp => emp.id);
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
      
      console.log('✅ loadUserSucursales: Cargadas', sucursalesData.length, 'sucursales');
      setUserSucursales(sucursalesData);
      setLoadingSucursales(false);
      return sucursalesData;
    } catch (error) {
      console.error('❌ Error cargando sucursales:', error);
      
      try {
        const cachedData = await loadUserFromCache();
        if (cachedData?.sucursales && cachedData.sucursales.length > 0) {
          setUserSucursales(cachedData.sucursales);
          setLoadingSucursales(false);
          return cachedData.sucursales;
        }
      } catch (cacheError) {
        console.error('Error cargando sucursales desde cache:', cacheError);
      }
      
      setUserSucursales([]);
      setLoadingSucursales(false);
      return [];
    }
  };

  const loadUserFormularios = async (userId, empresasParam = null, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      const empresasToUse = empresasParam || userEmpresas;
      
      if (!profileToUse || !empresasToUse || empresasToUse.length === 0) {
        console.log('⚠️ loadUserFormularios: No hay empresas disponibles');
        setUserFormularios([]);
        setLoadingFormularios(false);
        return [];
      }

      console.log('🔍 loadUserFormularios: Cargando para', empresasToUse.length, 'empresas');
      setLoadingFormularios(true);
      let formulariosData = [];
      
      if (role === 'supermax') {
        const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        const formulariosQuery = query(
          collection(db, "formularios"), 
          where("clienteAdminId", "==", profileToUse.uid)
        );
        const formulariosSnapshot = await getDocs(formulariosQuery);
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'operario' && profileToUse.clienteAdminId) {
        const formulariosQuery = query(
          collection(db, "formularios"), 
          where("clienteAdminId", "==", profileToUse.clienteAdminId)
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
      console.error('❌ Error cargando formularios:', error);
      
      try {
        const cachedData = await loadUserFromCache();
        if (cachedData?.formularios && cachedData.formularios.length > 0) {
          setUserFormularios(cachedData.formularios);
          setLoadingFormularios(false);
          return cachedData.formularios;
        }
      } catch (cacheError) {
        console.error('Error cargando formularios desde cache:', cacheError);
      }
      
      setUserFormularios([]);
      setLoadingFormularios(false);
      return [];
    }
  };

  const loadUserAuditorias = async (userId) => {
    try {
      const auditorias = await auditoriaService.getUserAuditorias(userId, role);
      setUserAuditorias(auditorias);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías:', error);
      return [];
    }
  };

  const loadAuditoriasCompartidas = async (userId) => {
    try {
      const auditorias = await auditoriaService.getAuditoriasCompartidas(userId);
      setAuditoriasCompartidas(auditorias);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías compartidas:', error);
      return [];
    }
  };



  // Funciones wrapper para mantener compatibilidad
  const crearEmpresa = async (empresaData) => {
    const empresaId = await empresaService.crearEmpresa(empresaData, user, role, userProfile);
    
    // Actualización optimista para PWA offline
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
    
    // Solo agregar si no existe (evitar duplicados)
    setUserEmpresas(prevEmpresas => {
      const existe = prevEmpresas.some(emp => emp.id === empresaId);
      return existe ? prevEmpresas : [...prevEmpresas, nuevaEmpresaConId];
    });
    
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
        // Pasar datos ya cargados
        const cacheResult = await saveCompleteUserCache(
          userProfile, 
          userEmpresas, 
          userSucursales, 
          userFormularios
        );
        return cacheResult;
      } catch (error) {
        console.error('Error actualizando cache:', error);
        throw error;
      }
    }
  };

  // .Los valores disponibles en el contexto
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
