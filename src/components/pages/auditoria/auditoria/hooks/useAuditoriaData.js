import { useEffect, useCallback } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { dbAudit, auditUserCollection } from "../../../../../firebaseControlFile";
import { storageUtils } from "../../../../../utils/utilitiesOptimization";
import { useAuth } from "../../../../context/AuthContext";
import { getCompleteUserCache } from "../../../../../services/completeOfflineCache";
import { getOfflineDatabase } from "../../../../../services/offlineDatabase";

export const useAuditoriaData = (
  setEmpresas,
  setSucursales,
  setFormularios,
  empresaSeleccionada,
  userProfile,
  userEmpresas,
  userFormularios,
  userSucursales
) => {
  // Función para cargar datos del cache offline (como fallback)
  // IMPORTANTE: Esta función debe estar definida antes de los useEffect que la usan
  const cargarDatosDelCache = useCallback(async () => {
    try {
      // Detectar navegador y modo PWA
      const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator.standalone === true) ||
                    document.referrer.includes('android-app://');
      const isOffline = !navigator.onLine;
      
      // En Chrome PWA offline, priorizar localStorage directamente
      if ((isChrome && isPWA && isOffline) || (!userProfile?.uid && isOffline)) {
        try {
          const localCache = localStorage.getItem('complete_user_cache');
          if (localCache) {
            const cacheData = JSON.parse(localCache);
            
            // Verificar que el cache tiene datos válidos
            if (cacheData && (cacheData.empresas || cacheData.formularios || cacheData.sucursales)) {
              // Cargar empresas
              if (cacheData.empresas && cacheData.empresas.length > 0) {
                setEmpresas(cacheData.empresas);
              }
              
              // Cargar formularios
              if (cacheData.formularios && cacheData.formularios.length > 0) {
                setFormularios(cacheData.formularios);
              }
              
              // Cargar sucursales
              if (cacheData.sucursales && cacheData.sucursales.length > 0) {
                setSucursales(cacheData.sucursales);
              }
              
              return cacheData;
            }
          }
        } catch (localStorageError) {
          console.error('Error parseando cache de localStorage:', localStorageError);
        }
      }
      
      // Si hay userProfile.uid, intentar getCompleteUserCache (mejor opción para Edge y Chrome online)
      if (userProfile?.uid) {
        try {
          const cacheData = await getCompleteUserCache(userProfile.uid);
          
          if (cacheData) {
            // Cargar empresas
            if (cacheData.empresas && cacheData.empresas.length > 0) {
              setEmpresas(cacheData.empresas);
            }
            
            // Cargar formularios
            if (cacheData.formularios && cacheData.formularios.length > 0) {
              setFormularios(cacheData.formularios);
            }
            
            // Cargar sucursales
            if (cacheData.sucursales && cacheData.sucursales.length > 0) {
              setSucursales(cacheData.sucursales);
            }
            
            return cacheData;
          }
        } catch (indexedDBError) {
          console.warn('Error cargando desde IndexedDB, intentando localStorage:', indexedDBError.message);
        }
      }
      
      // Fallback final: Intentar localStorage directamente
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          
          // Verificar que el cache tiene datos válidos
          if (cacheData && (cacheData.empresas || cacheData.formularios || cacheData.sucursales)) {
            // Cargar empresas
            if (cacheData.empresas && cacheData.empresas.length > 0) {
              setEmpresas(cacheData.empresas);
            }
            
            // Cargar formularios
            if (cacheData.formularios && cacheData.formularios.length > 0) {
              setFormularios(cacheData.formularios);
            }
            
            // Cargar sucursales
            if (cacheData.sucursales && cacheData.sucursales.length > 0) {
              setSucursales(cacheData.sucursales);
            }
            
            return cacheData;
          }
        }
      } catch (localStorageError) {
        console.error('Error parseando cache de localStorage:', localStorageError);
      }
      return null;
      
    } catch (error) {
      console.error('Error al cargar cache offline:', error);
      return null;
    }
  }, [userProfile, setEmpresas, setFormularios, setSucursales]);

  // Cargar datos SIEMPRE al montar el componente
  useEffect(() => {
    // Esperar a que userProfile esté disponible antes de cargar datos
    if (!userProfile) {
      return;
    }
    
    const cargarDatos = async () => {
      // 1. Intentar usar datos del contexto primero
      let datosCargados = false;
      
      if (userEmpresas && userEmpresas.length > 0) {
        setEmpresas(userEmpresas);
        datosCargados = true;
      }
      
      if (userFormularios && userFormularios.length > 0) {
        setFormularios(userFormularios);
        datosCargados = true;
      }
      
      if (userSucursales && userSucursales.length > 0) {
        setSucursales(userSucursales);
        datosCargados = true;
      }
      
      // 2. Si faltan datos, cargar desde cache SIEMPRE
      if (!datosCargados || 
          !userEmpresas || userEmpresas.length === 0 ||
          !userFormularios || userFormularios.length === 0 ||
          !userSucursales || userSucursales.length === 0) {
        await cargarDatosDelCache();
      }
    };
    
    cargarDatos();
  }, [userProfile, userEmpresas, userFormularios, userSucursales, cargarDatosDelCache]);

  // Efecto para recargar datos si cambian en el contexto
  useEffect(() => {
    // Verificar si hay datos faltantes
    const faltanEmpresas = !userEmpresas || userEmpresas.length === 0;
    const faltanFormularios = !userFormularios || userFormularios.length === 0;
    const faltanSucursales = !userSucursales || userSucursales.length === 0;
    
    // Si hay datos en contexto, usarlos
    if (userEmpresas && userEmpresas.length > 0) {
      setEmpresas(userEmpresas);
    }
    
    if (userFormularios && userFormularios.length > 0) {
      setFormularios(userFormularios);
    }
    
    if (userSucursales && userSucursales.length > 0) {
      setSucursales(userSucursales);
    }
    
    // Si faltan datos y hay userProfile, cargar desde cache una sola vez
    if (userProfile && (faltanEmpresas || faltanFormularios || faltanSucursales)) {
      cargarDatosDelCache().then(cacheData => {
        if (cacheData) {
          // Solo actualizar los que faltan
          if (faltanEmpresas && cacheData.empresas && cacheData.empresas.length > 0) {
            setEmpresas(cacheData.empresas);
          }
          
          if (faltanFormularios && cacheData.formularios && cacheData.formularios.length > 0) {
            setFormularios(cacheData.formularios);
          }
          
          if (faltanSucursales && cacheData.sucursales && cacheData.sucursales.length > 0) {
            setSucursales(cacheData.sucursales);
          }
        }
      }).catch(err => {
        console.warn('Error al cargar datos desde cache:', err);
      });
    }
  }, [userProfile, userEmpresas, userFormularios, userSucursales, cargarDatosDelCache]);

  // Función para obtener empresas que tienen sucursales desde el cache offline
  const obtenerEmpresasConSucursales = async () => {
    try {
      if (!userProfile) return [];
      
      // Primero intentar obtener sucursales del cache offline
      const cacheData = await cargarDatosDelCache();
      if (cacheData && cacheData.sucursales && cacheData.sucursales.length > 0) {
        // Obtener IDs únicos de empresas que tienen sucursales
        const empresasConSucursales = [...new Set(cacheData.sucursales.map(s => s.empresaId))];
        
        // Filtrar las empresas del cache que tienen sucursales
        if (cacheData.empresas && cacheData.empresas.length > 0) {
          const empresasFiltradas = cacheData.empresas.filter(empresa => 
            empresasConSucursales.includes(empresa.id)
          );
          return empresasFiltradas;
        }
      }
      
      // Si no hay cache, intentar cargar desde Firestore (solo si hay conexión)
      if (navigator.onLine) {
        let sucursalesData = [];
        
        if (userProfile.role === 'supermax') {
          const sucursalesCollection = auditUserCollection(userProfile.uid, "sucursales");
          // Límite conservador: 500 sucursales para supermax
          const q = query(sucursalesCollection, limit(500));
          const snapshot = await getDocs(q);
          sucursalesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else if (userProfile.role === 'max') {
          // Cargar sucursales de empresas propias
          const empresasRef = auditUserCollection(userProfile.uid, "empresas");
          const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
          const empresasSnapshot = await getDocs(empresasQuery);
          const misEmpresas = empresasSnapshot.docs.map(doc => doc.id);

          // Cargar usuarios operarios y sus empresas
          // NOTA: Esta colección está en la estructura multi-tenant, pero necesitamos buscar en otros usuarios
          // Por ahora mantenemos la estructura original hasta confirmar la migración completa
          const usuariosRef = collection(dbAudit, "apps", "auditoria", "users");
          const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
          const usuariosSnapshot = await getDocs(usuariosQuery);
          const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

          // Optimización: Limitar a máximo 50 operarios para evitar demasiadas queries
          const MAX_OPERARIOS = 50;
          const operariosLimitados = usuariosOperarios.slice(0, MAX_OPERARIOS);

          // Cargar empresas de operarios (con límite por operario)
          const empresasOperariosPromises = operariosLimitados.map(async (operarioId) => {
            const operarioEmpresasRef = auditUserCollection(operarioId, "empresas");
            const operarioEmpresasQuery = query(
              operarioEmpresasRef, 
              where("propietarioId", "==", operarioId),
              limit(50) // Límite conservador: 50 empresas por operario
            );
            const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
            return operarioEmpresasSnapshot.docs.map(doc => doc.id);
          });

          const empresasOperariosArrays = await Promise.all(empresasOperariosPromises);
          const empresasOperarios = empresasOperariosArrays.flat();
          const todasLasEmpresas = [...misEmpresas, ...empresasOperarios];
          
          // Optimización: Limitar total de empresas procesadas
          const MAX_EMPRESAS = 100;
          const empresasLimitadas = todasLasEmpresas.slice(0, MAX_EMPRESAS);

          // Cargar sucursales de todas las empresas (limitadas)
          if (empresasLimitadas.length > 0) {
            const chunkSize = 10;
            const empresasChunks = [];
            for (let i = 0; i < empresasLimitadas.length; i += chunkSize) {
              empresasChunks.push(empresasLimitadas.slice(i, i + chunkSize));
            }

            const sucursalesPromises = empresasChunks.map(async (chunk) => {
              const sucursalesRef = auditUserCollection(userProfile.uid, "sucursales");
              // Límite conservador: 200 sucursales por chunk
              const sucursalesQuery = query(
                sucursalesRef, 
                where("empresaId", "in", chunk),
                limit(200)
              );
              const sucursalesSnapshot = await getDocs(sucursalesQuery);
              return sucursalesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            });

            const sucursalesArrays = await Promise.all(sucursalesPromises);
            sucursalesData = sucursalesArrays.flat();
          }
        } else if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
          // Operario ve sucursales de su cliente admin
          const empresasRef = auditUserCollection(userProfile.clienteAdminId, "empresas");
          const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.clienteAdminId));
          const empresasSnapshot = await getDocs(empresasQuery);
          const empresasIds = empresasSnapshot.docs.map(doc => doc.id);

          // Optimización: Limitar total de empresas procesadas
          const MAX_EMPRESAS_OPERARIO = 100;
          const empresasLimitadas = empresasIds.slice(0, MAX_EMPRESAS_OPERARIO);

          if (empresasLimitadas.length > 0) {
            const chunkSize = 10;
            const empresasChunks = [];
            for (let i = 0; i < empresasLimitadas.length; i += chunkSize) {
              empresasChunks.push(empresasLimitadas.slice(i, i + chunkSize));
            }

            const sucursalesPromises = empresasChunks.map(async (chunk) => {
              const sucursalesRef = auditUserCollection(userProfile.clienteAdminId, "sucursales");
              // Límite conservador: 200 sucursales por chunk
              const sucursalesQuery = query(
                sucursalesRef, 
                where("empresaId", "in", chunk),
                limit(200)
              );
              const sucursalesSnapshot = await getDocs(sucursalesQuery);
              return sucursalesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            });

            const sucursalesArrays = await Promise.all(sucursalesPromises);
            sucursalesData = sucursalesArrays.flat();
          }
        }

        // Obtener IDs únicos de empresas que tienen sucursales
        const empresasConSucursales = [...new Set(sucursalesData.map(s => s.empresaId))];
        
        if (empresasConSucursales.length > 0) {
          // Cargar datos completos de las empresas
          const empresasRef = auditUserCollection(userProfile.uid, "empresas");
          const empresasQuery = query(empresasRef, where("__name__", "in", empresasConSucursales));
          const empresasSnapshot = await getDocs(empresasQuery);
          const empresasData = empresasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          return empresasData;
        }
      }
      
      return [];
    } catch (error) {
      console.error("Error al obtener empresas con sucursales:", error);
      return [];
    }
  };

  // Cargar empresas desde sucursales existentes
  useEffect(() => {
    // Detectar Chrome PWA offline
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator.standalone === true) ||
                  document.referrer.includes('android-app://');
    const isOffline = !navigator.onLine;
    
    // Si no hay userProfile o es Chrome PWA offline, intentar cargar desde localStorage directamente
    if (!userProfile || (isChrome && isPWA && isOffline)) {
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          if (cacheData && cacheData.empresas && cacheData.empresas.length > 0) {
            setEmpresas(cacheData.empresas);
            
            // También cargar formularios y sucursales si están disponibles
            if (cacheData.formularios && cacheData.formularios.length > 0) {
              setFormularios(cacheData.formularios);
            }
            if (cacheData.sucursales && cacheData.sucursales.length > 0) {
              setSucursales(cacheData.sucursales);
            }
            return;
          }
        }
      } catch (e) {
        console.warn('Error cargando desde localStorage:', e);
      }
      // No retornar aquí, continuar con la lógica normal si localStorage falla
    }

    const cargarEmpresas = async () => {
      try {
        // Prioridad 1: Usar userEmpresas del contexto (igual que /establecimiento)
        if (userEmpresas && userEmpresas.length > 0) {
          setEmpresas(userEmpresas);
        } 
        // Prioridad 2: Datos del cache offline
        else {
          const cacheData = await cargarDatosDelCache();
          
          if (cacheData && cacheData.empresas && cacheData.empresas.length > 0) {
            setEmpresas(cacheData.empresas);
          } 
          // Prioridad 3: Cargar desde Firestore (solo si hay conexión)
          else if (userProfile && userProfile.uid && navigator.onLine) {
            const empresasConSucursales = await obtenerEmpresasConSucursales();
            setEmpresas(empresasConSucursales);
          } else {
            setEmpresas([]);
          }
        }
      } catch (error) {
        console.error("Error al cargar empresas:", error);
        setEmpresas([]);
      }
    };

    cargarEmpresas();
  }, [userProfile, userEmpresas, setEmpresas, cargarDatosDelCache]);

  // Cargar todas las sucursales disponibles al inicio
  useEffect(() => {
    // Si no hay userProfile, intentar cargar desde localStorage directamente (offline)
    if (!userProfile) {
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          if (cacheData && cacheData.sucursales && cacheData.sucursales.length > 0) {
            setSucursales(cacheData.sucursales);
            return;
          }
        }
      } catch (e) {
        console.warn('Error cargando sucursales desde localStorage:', e);
      }
      return;
    }

    const cargarTodasLasSucursales = async () => {

      try {
        let sucursalesData = [];
        
        if (userProfile.role === 'supermax') {
          // Supermax ve todas las sucursales (con límite conservador)
          const sucursalesCollection = auditUserCollection(userProfile.uid, "sucursales");
          const q = query(sucursalesCollection, limit(500));
          const snapshot = await getDocs(q);
          sucursalesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            nombre: doc.data().nombre,
            empresa: doc.data().empresa,
            empresaId: doc.data().empresaId
          }));
        } else {
          // Para max y operario, usar userEmpresas o cache offline
          let empresasParaSucursales = userEmpresas;
          
          // Si no hay userEmpresas, intentar cargar desde cache offline
          if (!empresasParaSucursales || empresasParaSucursales.length === 0) {
            const cacheData = await cargarDatosDelCache();
            if (cacheData && cacheData.empresas && cacheData.empresas.length > 0) {
              empresasParaSucursales = cacheData.empresas;
            }
          }
          
          if (empresasParaSucursales && empresasParaSucursales.length > 0) {
            const empresasIds = empresasParaSucursales.map(emp => emp.id);
            
            // Optimización: Limitar total de empresas procesadas
            const MAX_EMPRESAS_SUCURSALES = 100;
            const empresasLimitadas = empresasIds.slice(0, MAX_EMPRESAS_SUCURSALES);
            
            // Firestore limita 'in' queries a 10 elementos, dividir en chunks si es necesario
            const chunkSize = 10;
            const empresasChunks = [];
            for (let i = 0; i < empresasLimitadas.length; i += chunkSize) {
              empresasChunks.push(empresasLimitadas.slice(i, i + chunkSize));
            }

            const sucursalesPromises = empresasChunks.map(async (chunk) => {
              const sucursalesRef = auditUserCollection(userProfile.uid, "sucursales");
              // Límite conservador: 200 sucursales por chunk
              const sucursalesQuery = query(
                sucursalesRef, 
                where("empresaId", "in", chunk),
                limit(200)
              );
              const sucursalesSnapshot = await getDocs(sucursalesQuery);
              return sucursalesSnapshot.docs.map(doc => ({
                id: doc.id,
                nombre: doc.data().nombre,
                empresa: doc.data().empresa,
                empresaId: doc.data().empresaId
              }));
            });

            const sucursalesArrays = await Promise.all(sucursalesPromises);
            sucursalesData = sucursalesArrays.flat();
          }
        }

        setSucursales(sucursalesData);
      } catch (error) {
        console.error("Error al obtener sucursales:", error);
        setSucursales([]);
      }
    };

    cargarTodasLasSucursales();
  }, [userProfile, userEmpresas, setSucursales]);

  // Cargar formularios desde el contexto, cache offline o Firestore
  useEffect(() => {
    // Si no hay userProfile, intentar cargar desde localStorage directamente (offline)
    if (!userProfile) {
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          if (cacheData && cacheData.formularios && cacheData.formularios.length > 0) {
            setFormularios(cacheData.formularios);
            return;
          }
        }
      } catch (e) {
        console.warn('Error cargando formularios desde localStorage:', e);
      }
      return;
    }

    const cargarFormularios = async () => {
      // Prioridad 1: Datos del contexto (online)
      if (userFormularios && userFormularios.length > 0) {
        setFormularios(userFormularios);
      } 
      // Prioridad 2: Datos del cache offline
      else {
        const cacheData = await cargarDatosDelCache();
        
        if (cacheData && cacheData.formularios && cacheData.formularios.length > 0) {
          setFormularios(cacheData.formularios);
        }
      }
    };

    cargarFormularios();
  }, [userProfile, userFormularios, setFormularios, cargarDatosDelCache]);

  // Cargar formularios desde Firestore si no están en el contexto ni en cache offline
  useEffect(() => {
    const obtenerFormularios = async () => {
      try {
        if (!userProfile) return;
        
        // Verificar si ya tenemos formularios del contexto o cache
        if (userFormularios && userFormularios.length > 0) {
          return; // Ya tenemos formularios, no hacer nada
        }
        
        // Verificar conectividad
        const isOnline = navigator.onLine;
        
        if (isOnline) {
          // Cargar desde Firestore cuando hay conectividad (con límite conservador)
          const formulariosCollection = auditUserCollection(userProfile.uid, "formularios");
          const q = query(formulariosCollection, limit(200));
          const snapshot = await getDocs(q);
          const todosLosFormularios = snapshot.docs.map((doc) => ({
            id: doc.id,
            nombre: doc.data().nombre,
            secciones: doc.data().secciones,
            creadorId: doc.data().creadorId,
            creadorEmail: doc.data().creadorEmail,
            esPublico: doc.data().esPublico,
            permisos: doc.data().permisos,
            clienteAdminId: doc.data().clienteAdminId
          }));
          
          // Filtrar formularios por permisos multi-tenant
          const formulariosPermitidos = todosLosFormularios.filter(formulario => {
            if (userProfile.role === 'supermax') return true;
            if (userProfile.role === 'max') {
              return formulario.clienteAdminId === userProfile.uid || 
                     formulario.creadorId === userProfile.uid;
            }
            if (userProfile.role === 'operario') {
              return formulario.creadorId === userProfile.uid ||
                     formulario.clienteAdminId === userProfile.clienteAdminId ||
                     formulario.esPublico ||
                     formulario.permisos?.puedeVer?.includes(userProfile.uid);
            }
            return false;
          });
          
          // Guardar en cache para uso offline
          storageUtils.set('formularios_cache', {
            formularios: formulariosPermitidos,
            timestamp: Date.now(),
            userId: userProfile.uid
          });
          
          setFormularios(formulariosPermitidos);
        } else {
          // Cargar desde cache cuando está offline
          const cacheData = storageUtils.get('formularios_cache');
          
          if (cacheData && cacheData.formularios && cacheData.userId === userProfile.uid) {
            // Verificar que el cache no esté muy antiguo (máximo 24 horas)
            const cacheAge = Date.now() - cacheData.timestamp;
            const maxCacheAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (cacheAge < maxCacheAge) {
              setFormularios(cacheData.formularios);
            } else {
              setFormularios([]);
            }
          } else {
            setFormularios([]);
          }
        }
      } catch (error) {
        console.error("Error al obtener formularios:", error);
        
        // Fallback: intentar cargar desde cache en caso de error
        try {
          const cacheData = storageUtils.get('formularios_cache');
          if (cacheData && cacheData.formularios) {
            setFormularios(cacheData.formularios);
          }
        } catch (cacheError) {
          console.error("Error al cargar desde cache:", cacheError);
          setFormularios([]);
        }
      }
    };
    
    obtenerFormularios();
  }, [userProfile, userFormularios, setFormularios]);
}; 