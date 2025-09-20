// src/components/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
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
      console.log('⏰ Timeout de seguridad - deteniendo loading');
      setLoading(false);
    }, 1500); // 1.5 segundos máximo
    
    // Listener para detectar cambios de conectividad
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada - recargando datos...');
      // Recargar datos cuando se restaura la conexión
      if (user) {
        loadUserEmpresas(user.uid);
        loadUserAuditorias(user.uid);
        loadAuditoriasCompartidas(user.uid);
      }
    };
    
    const handleOffline = () => {
      console.log('🔌 Conexión perdida - modo offline activado');
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
              loadUserEmpresas(firebaseUser.uid),
              loadUserAuditorias(firebaseUser.uid),
              loadAuditoriasCompartidas(firebaseUser.uid)
            ]);

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
              
              const cacheResult = await saveCompleteUserCache(completeProfile);
              console.log('✅ Cache completo guardado para usuario:', firebaseUser.uid);
              console.log('✅ Cache guardado con:', {
                empresas: cacheResult?.empresas?.length || 0,
                formularios: cacheResult?.formularios?.length || 0,
                sucursales: cacheResult?.sucursales?.length || 0
              });
            } catch (error) {
              console.warn('⚠️ Error guardando cache completo:', error);
            }
          }
        } else {
          // Si no hay usuario de Firebase, verificar si hay cache offline
          console.log('🔌 Sin usuario de Firebase, verificando cache offline...');
          
          // Solo cargar del cache si había un usuario autenticado previamente
          const wasLoggedIn = localStorage.getItem("isLogged") === "true";
          
          if (wasLoggedIn) {
            const cachedUser = await loadUserFromCache();
            
            if (cachedUser && cachedUser.userProfile) {
              const userProfile = cachedUser.userProfile;
              console.log('✅ Usuario encontrado en cache offline:', userProfile.uid);
              
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
                console.log('✅ Empresas cargadas desde cache offline:', cachedUser.empresas.length);
                console.log('✅ Empresas del cache:', cachedUser.empresas.map(e => ({ id: e.id, nombre: e.nombre })));
                
                // Aplicar filtrado multi-tenant si es necesario
                let empresasFiltradas = cachedUser.empresas;
                if (userProfile.role !== 'supermax') {
                  empresasFiltradas = cachedUser.empresas.filter(empresa => {
                    return empresa.propietarioId === userProfile.uid || 
                           empresa.creadorId === userProfile.uid ||
                           empresa.clienteAdminId === userProfile.clienteAdminId;
                  });
                  console.log('✅ Empresas filtradas por rol:', empresasFiltradas.length);
                }
                
                setUserEmpresas(empresasFiltradas);
              } else {
                console.log('⚠️ No hay empresas en cache offline');
              }
              if (cachedUser.auditorias && cachedUser.auditorias.length > 0) {
                console.log('✅ Auditorías cargadas desde cache offline:', cachedUser.auditorias.length);
                setUserAuditorias(cachedUser.auditorias);
              } else {
                console.log('⚠️ No hay auditorías en cache offline');
              }
              
              console.log('✅ Usuario offline cargado desde cache');
            } else {
              console.log('❌ No hay usuario en cache offline');
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

  const forceRefreshCache = async () => {
    if (userProfile) {
      try {
        console.log('🔄 Forzando actualización del cache...');
        const cacheResult = await saveCompleteUserCache(userProfile);
        console.log('✅ Cache actualizado:', {
          empresas: cacheResult?.empresas?.length || 0,
          formularios: cacheResult?.formularios?.length || 0,
          sucursales: cacheResult?.sucursales?.length || 0
        });
        return cacheResult;
      } catch (error) {
        console.error('❌ Error actualizando cache:', error);
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
    throw new Error("useAuth debe ser usado dentro de un AuthContextProvider");
  }
  return context;
};

export default AuthContextComponent;
