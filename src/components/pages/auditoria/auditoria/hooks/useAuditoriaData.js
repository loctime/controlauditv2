import { useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
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
      
      console.log('[DEBUG Auditoria] ========== CARGANDO DESDE CACHE OFFLINE ==========');
      console.log('[DEBUG Auditoria] userId:', userProfile?.uid || 'NO DISPONIBLE');
      console.log('[DEBUG Auditoria] Navegador:', isChrome ? 'Chrome' : 'Edge/Firefox');
      console.log('[DEBUG Auditoria] Modo PWA:', isPWA);
      console.log('[DEBUG Auditoria] Estado conexión:', isOffline ? 'OFFLINE' : 'ONLINE');
      
      // En Chrome PWA offline, priorizar localStorage directamente
      if ((isChrome && isPWA && isOffline) || (!userProfile?.uid && isOffline)) {
        console.log('[DEBUG Auditoria] 🔄 Chrome PWA offline detectado, cargando desde localStorage primero...');
        try {
          const localCache = localStorage.getItem('complete_user_cache');
          if (localCache) {
            const cacheData = JSON.parse(localCache);
            
            // Verificar que el cache tiene datos válidos
            if (cacheData && (cacheData.empresas || cacheData.formularios || cacheData.sucursales)) {
              console.log('[DEBUG Auditoria] ✅ Cache encontrado en localStorage (Chrome PWA offline):', {
                userId: cacheData.userId,
                empresas: cacheData.empresas?.length || 0,
                formularios: cacheData.formularios?.length || 0,
                sucursales: cacheData.sucursales?.length || 0
              });
              
              // Cargar empresas
              if (cacheData.empresas && cacheData.empresas.length > 0) {
                console.log('[DEBUG Auditoria] ✅ Cargando empresas desde localStorage (Chrome PWA):', cacheData.empresas.length);
                setEmpresas(cacheData.empresas);
              }
              
              // Cargar formularios
              if (cacheData.formularios && cacheData.formularios.length > 0) {
                console.log('[DEBUG Auditoria] ✅ Cargando formularios desde localStorage (Chrome PWA):', cacheData.formularios.length);
                setFormularios(cacheData.formularios);
              }
              
              // Cargar sucursales
              if (cacheData.sucursales && cacheData.sucursales.length > 0) {
                console.log('[DEBUG Auditoria] ✅ Cargando sucursales desde localStorage (Chrome PWA):', cacheData.sucursales.length);
                setSucursales(cacheData.sucursales);
              }
              
              return cacheData;
            } else {
              console.log('[DEBUG Auditoria] ⚠️ Cache en localStorage pero sin datos válidos');
            }
          } else {
            console.log('[DEBUG Auditoria] ⚠️ No hay cache en localStorage');
          }
        } catch (localStorageError) {
          console.error('[DEBUG Auditoria] ❌ Error parseando cache de localStorage (Chrome PWA):', localStorageError);
        }
      }
      
      // Si hay userProfile.uid, intentar getCompleteUserCache (mejor opción para Edge y Chrome online)
      if (userProfile?.uid) {
        try {
          const cacheData = await getCompleteUserCache(userProfile.uid);
          
          if (cacheData) {
            console.log('[DEBUG Auditoria] ✅ Cache encontrado desde IndexedDB:', {
              userId: cacheData.userId,
              empresas: cacheData.empresas?.length || 0,
              formularios: cacheData.formularios?.length || 0,
              sucursales: cacheData.sucursales?.length || 0
            });
            
            // Cargar empresas
            if (cacheData.empresas && cacheData.empresas.length > 0) {
              console.log('[DEBUG Auditoria] ✅ Cargando empresas desde cache IndexedDB:', cacheData.empresas.length);
              setEmpresas(cacheData.empresas);
            }
            
            // Cargar formularios
            if (cacheData.formularios && cacheData.formularios.length > 0) {
              console.log('[DEBUG Auditoria] ✅ Cargando formularios desde cache IndexedDB:', cacheData.formularios.length);
              setFormularios(cacheData.formularios);
            }
            
            // Cargar sucursales
            if (cacheData.sucursales && cacheData.sucursales.length > 0) {
              console.log('[DEBUG Auditoria] ✅ Cargando sucursales desde cache IndexedDB:', cacheData.sucursales.length);
              setSucursales(cacheData.sucursales);
            }
            
            return cacheData;
          }
        } catch (indexedDBError) {
          console.warn('[DEBUG Auditoria] ⚠️ Error cargando desde IndexedDB, intentando localStorage:', indexedDBError.message);
        }
      }
      
      // Fallback final: Intentar localStorage directamente
      console.log('[DEBUG Auditoria] ⚠️ Intentando fallback final a localStorage...');
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          
          // Verificar que el cache tiene datos válidos
          if (cacheData && (cacheData.empresas || cacheData.formularios || cacheData.sucursales)) {
            console.log('[DEBUG Auditoria] ✅ Cache encontrado en localStorage (fallback):', {
              userId: cacheData.userId,
              empresas: cacheData.empresas?.length || 0,
              formularios: cacheData.formularios?.length || 0,
              sucursales: cacheData.sucursales?.length || 0
            });
            
            // Cargar empresas
            if (cacheData.empresas && cacheData.empresas.length > 0) {
              console.log('[DEBUG Auditoria] ✅ Cargando empresas desde localStorage (fallback):', cacheData.empresas.length);
              setEmpresas(cacheData.empresas);
            }
            
            // Cargar formularios
            if (cacheData.formularios && cacheData.formularios.length > 0) {
              console.log('[DEBUG Auditoria] ✅ Cargando formularios desde localStorage (fallback):', cacheData.formularios.length);
              setFormularios(cacheData.formularios);
            }
            
            // Cargar sucursales
            if (cacheData.sucursales && cacheData.sucursales.length > 0) {
              console.log('[DEBUG Auditoria] ✅ Cargando sucursales desde localStorage (fallback):', cacheData.sucursales.length);
              setSucursales(cacheData.sucursales);
            }
            
            return cacheData;
          }
        }
      } catch (localStorageError) {
        console.error('[DEBUG Auditoria] ❌ Error parseando cache de localStorage (fallback):', localStorageError);
      }
      
      console.log('[DEBUG Auditoria] ❌ No hay cache completo disponible en ningún almacenamiento');
      return null;
      
    } catch (error) {
      console.error('[DEBUG Auditoria] ❌ Error al cargar cache offline:', error);
      return null;
    }
  }, [userProfile, setEmpresas, setFormularios, setSucursales]);

  // Cargar datos SIEMPRE al montar el componente
  useEffect(() => {
    // Esperar a que userProfile esté disponible antes de cargar datos
    if (!userProfile) {
      console.log('[DEBUG Auditoria] ⏳ Esperando userProfile...');
      return;
    }
    
    console.log('[DEBUG Auditoria] ========== INICIANDO CARGA DE DATOS ==========');
    console.log('[DEBUG Auditoria] userProfile:', !!userProfile);
    console.log('[DEBUG Auditoria] userEmpresas:', userEmpresas?.length || 0);
    console.log('[DEBUG Auditoria] userFormularios:', userFormularios?.length || 0);
    console.log('[DEBUG Auditoria] userSucursales:', userSucursales?.length || 0);
    
    const cargarDatos = async () => {
      // 1. Intentar usar datos del contexto primero
      let datosCargados = false;
      
      if (userEmpresas && userEmpresas.length > 0) {
        console.log('[DEBUG Auditoria] ✅ Usando empresas del contexto:', userEmpresas.length);
        setEmpresas(userEmpresas);
        datosCargados = true;
      }
      
      if (userFormularios && userFormularios.length > 0) {
        console.log('[DEBUG Auditoria] ✅ Usando formularios del contexto:', userFormularios.length);
        setFormularios(userFormularios);
        datosCargados = true;
      }
      
      if (userSucursales && userSucursales.length > 0) {
        console.log('[DEBUG Auditoria] ✅ Usando sucursales del contexto:', userSucursales.length);
        setSucursales(userSucursales);
        datosCargados = true;
      }
      
      // 2. Si faltan datos, cargar desde cache SIEMPRE
      if (!datosCargados || 
          !userEmpresas || userEmpresas.length === 0 ||
          !userFormularios || userFormularios.length === 0 ||
          !userSucursales || userSucursales.length === 0) {
        
        console.log('[DEBUG Auditoria] ⚠️ Datos faltantes, cargando desde cache offline...');
        await cargarDatosDelCache();
      }
    };
    
    cargarDatos();
  }, [userProfile, userEmpresas, userFormularios, userSucursales, cargarDatosDelCache]);

  // Efecto para recargar datos si cambian en el contexto
  useEffect(() => {
    console.log('[DEBUG Auditoria] Datos del contexto cambiaron...');
    
    // Verificar si hay datos faltantes
    const faltanEmpresas = !userEmpresas || userEmpresas.length === 0;
    const faltanFormularios = !userFormularios || userFormularios.length === 0;
    const faltanSucursales = !userSucursales || userSucursales.length === 0;
    
    // Si hay datos en contexto, usarlos
    if (userEmpresas && userEmpresas.length > 0) {
      console.log('[DEBUG Auditoria] ✅ Actualizando empresas del contexto:', userEmpresas.length);
      setEmpresas(userEmpresas);
    }
    
    if (userFormularios && userFormularios.length > 0) {
      console.log('[DEBUG Auditoria] ✅ Actualizando formularios del contexto:', userFormularios.length);
      setFormularios(userFormularios);
    }
    
    if (userSucursales && userSucursales.length > 0) {
      console.log('[DEBUG Auditoria] ✅ Actualizando sucursales del contexto:', userSucursales.length);
      setSucursales(userSucursales);
    }
    
    // Si faltan datos y hay userProfile, cargar desde cache una sola vez
    if (userProfile && (faltanEmpresas || faltanFormularios || faltanSucursales)) {
      console.log('[DEBUG Auditoria] ⚠️ Datos faltantes en contexto, cargando desde cache...', {
        faltanEmpresas,
        faltanFormularios,
        faltanSucursales
      });
      
      cargarDatosDelCache().then(cacheData => {
        if (cacheData) {
          // Solo actualizar los que faltan
          if (faltanEmpresas && cacheData.empresas && cacheData.empresas.length > 0) {
            console.log('[DEBUG Auditoria] ✅ Empresas cargadas desde cache después de cambio de contexto:', cacheData.empresas.length);
            setEmpresas(cacheData.empresas);
          }
          
          if (faltanFormularios && cacheData.formularios && cacheData.formularios.length > 0) {
            console.log('[DEBUG Auditoria] ✅ Formularios cargados desde cache después de cambio de contexto:', cacheData.formularios.length);
            setFormularios(cacheData.formularios);
          }
          
          if (faltanSucursales && cacheData.sucursales && cacheData.sucursales.length > 0) {
            console.log('[DEBUG Auditoria] ✅ Sucursales cargadas desde cache después de cambio de contexto:', cacheData.sucursales.length);
            setSucursales(cacheData.sucursales);
          }
        }
      }).catch(err => {
        console.warn('[DEBUG Auditoria] Error al cargar datos desde cache:', err);
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
          console.log('[DEBUG Auditoria] Empresas con sucursales desde cache:', empresasFiltradas.length);
          return empresasFiltradas;
        }
      }
      
      // Si no hay cache, intentar cargar desde Firestore (solo si hay conexión)
      if (navigator.onLine) {
        console.log('[DEBUG Auditoria] No hay cache, cargando sucursales desde Firestore...');
        let sucursalesData = [];
        
        if (userProfile.role === 'supermax') {
          const sucursalesCollection = collection(db, "sucursales");
          const snapshot = await getDocs(sucursalesCollection);
          sucursalesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else if (userProfile.role === 'max') {
          // Cargar sucursales de empresas propias
          const empresasRef = collection(db, "empresas");
          const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
          const empresasSnapshot = await getDocs(empresasQuery);
          const misEmpresas = empresasSnapshot.docs.map(doc => doc.id);

          // Cargar usuarios operarios y sus empresas
          const usuariosRef = collection(db, "usuarios");
          const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
          const usuariosSnapshot = await getDocs(usuariosQuery);
          const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

          // Cargar empresas de operarios
          const empresasOperariosPromises = usuariosOperarios.map(async (operarioId) => {
            const operarioEmpresasQuery = query(empresasRef, where("propietarioId", "==", operarioId));
            const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
            return operarioEmpresasSnapshot.docs.map(doc => doc.id);
          });

          const empresasOperariosArrays = await Promise.all(empresasOperariosPromises);
          const empresasOperarios = empresasOperariosArrays.flat();
          const todasLasEmpresas = [...misEmpresas, ...empresasOperarios];

          // Cargar sucursales de todas las empresas
          if (todasLasEmpresas.length > 0) {
            const chunkSize = 10;
            const empresasChunks = [];
            for (let i = 0; i < todasLasEmpresas.length; i += chunkSize) {
              empresasChunks.push(todasLasEmpresas.slice(i, i + chunkSize));
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
        } else if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
          // Operario ve sucursales de su cliente admin
          const empresasRef = collection(db, "empresas");
          const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.clienteAdminId));
          const empresasSnapshot = await getDocs(empresasQuery);
          const empresasIds = empresasSnapshot.docs.map(doc => doc.id);

          if (empresasIds.length > 0) {
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
        }

        // Obtener IDs únicos de empresas que tienen sucursales
        const empresasConSucursales = [...new Set(sucursalesData.map(s => s.empresaId))];
        
        if (empresasConSucursales.length > 0) {
          // Cargar datos completos de las empresas
          const empresasRef = collection(db, "empresas");
          const empresasQuery = query(empresasRef, where("__name__", "in", empresasConSucursales));
          const empresasSnapshot = await getDocs(empresasQuery);
          const empresasData = empresasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('[DEBUG Auditoria] Empresas con sucursales desde Firestore:', empresasData.length);
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
      console.log('[DEBUG Auditoria] ⏳ No hay userProfile o Chrome PWA offline, intentando cargar desde localStorage...');
      console.log('[DEBUG Auditoria] Chrome:', isChrome, 'PWA:', isPWA, 'Offline:', isOffline);
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          if (cacheData && cacheData.empresas && cacheData.empresas.length > 0) {
            console.log('[DEBUG Auditoria] ✅ Empresas cargadas desde localStorage (sin userProfile/Chrome PWA offline):', cacheData.empresas.length);
            setEmpresas(cacheData.empresas);
            
            // También cargar formularios y sucursales si están disponibles
            if (cacheData.formularios && cacheData.formularios.length > 0) {
              console.log('[DEBUG Auditoria] ✅ Formularios cargados desde localStorage:', cacheData.formularios.length);
              setFormularios(cacheData.formularios);
            }
            if (cacheData.sucursales && cacheData.sucursales.length > 0) {
              console.log('[DEBUG Auditoria] ✅ Sucursales cargadas desde localStorage:', cacheData.sucursales.length);
              setSucursales(cacheData.sucursales);
            }
            return;
          } else {
            console.log('[DEBUG Auditoria] ⚠️ Cache en localStorage pero sin empresas válidas');
          }
        } else {
          console.log('[DEBUG Auditoria] ⚠️ No hay cache en localStorage');
        }
      } catch (e) {
        console.warn('[DEBUG Auditoria] Error cargando desde localStorage:', e);
      }
      // No retornar aquí, continuar con la lógica normal si localStorage falla
    }

    const cargarEmpresas = async () => {
      console.log('[DEBUG Auditoria] Iniciando carga de empresas desde sucursales...');
      
      try {
        // Prioridad 1: Usar userEmpresas del contexto (igual que /establecimiento)
        if (userEmpresas && userEmpresas.length > 0) {
          console.log('[DEBUG Auditoria] Usando empresas del contexto:', userEmpresas.length, 'empresas');
          setEmpresas(userEmpresas);
        } 
        // Prioridad 2: Datos del cache offline
        else {
          console.log('[DEBUG Auditoria] No hay empresas en contexto, cargando desde cache offline...');
          const cacheData = await cargarDatosDelCache();
          
          console.log('[DEBUG Auditoria] Cache data encontrado:', cacheData);
          
          if (cacheData && cacheData.empresas && cacheData.empresas.length > 0) {
            console.log('[DEBUG Auditoria] Empresas cargadas desde cache offline:', cacheData.empresas.length, 'empresas');
            console.log('[DEBUG Auditoria] Empresas del cache:', cacheData.empresas);
            setEmpresas(cacheData.empresas);
          } 
          // Prioridad 3: Cargar desde Firestore (solo si hay conexión)
          else if (userProfile && userProfile.uid && navigator.onLine) {
            console.log('[DEBUG Auditoria] No hay empresas en cache offline, cargando desde Firestore...');
            const empresasConSucursales = await obtenerEmpresasConSucursales();
            setEmpresas(empresasConSucursales);
            console.log('[DEBUG Auditoria] Empresas cargadas desde Firestore (con sucursales):', empresasConSucursales.length, 'empresas');
          } else {
            console.log('[DEBUG Auditoria] No hay empresas en cache offline ni conexión para cargar desde Firestore.');
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
      console.log('[DEBUG Auditoria] ⏳ No hay userProfile, intentando cargar sucursales desde localStorage...');
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          if (cacheData && cacheData.sucursales && cacheData.sucursales.length > 0) {
            console.log('[DEBUG Auditoria] ✅ Sucursales cargadas desde localStorage (sin userProfile):', cacheData.sucursales.length);
            setSucursales(cacheData.sucursales);
            return;
          }
        }
      } catch (e) {
        console.warn('[DEBUG Auditoria] Error cargando sucursales desde localStorage:', e);
      }
      return;
    }

    const cargarTodasLasSucursales = async () => {

      try {
        let sucursalesData = [];
        
        if (userProfile.role === 'supermax') {
          // Supermax ve todas las sucursales
          const sucursalesCollection = collection(db, "sucursales");
          const snapshot = await getDocs(sucursalesCollection);
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
            console.log('[DEBUG Auditoria] No hay userEmpresas, cargando desde cache para sucursales...');
            const cacheData = await cargarDatosDelCache();
            if (cacheData && cacheData.empresas && cacheData.empresas.length > 0) {
              empresasParaSucursales = cacheData.empresas;
              console.log('[DEBUG Auditoria] Empresas cargadas desde cache para sucursales:', empresasParaSucursales.length);
            }
          }
          
          if (empresasParaSucursales && empresasParaSucursales.length > 0) {
            const empresasIds = empresasParaSucursales.map(emp => emp.id);
            
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
        console.log(`[DEBUG Auditoria] Sucursales cargadas: ${sucursalesData.length}`);
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
      console.log('[DEBUG Auditoria] ⏳ No hay userProfile, intentando cargar formularios desde localStorage...');
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          if (cacheData && cacheData.formularios && cacheData.formularios.length > 0) {
            console.log('[DEBUG Auditoria] ✅ Formularios cargados desde localStorage (sin userProfile):', cacheData.formularios.length);
            setFormularios(cacheData.formularios);
            return;
          }
        }
      } catch (e) {
        console.warn('[DEBUG Auditoria] Error cargando formularios desde localStorage:', e);
      }
      return;
    }

    const cargarFormularios = async () => {
      console.log('[DEBUG Auditoria] Iniciando carga de formularios...');
      
      // Prioridad 1: Datos del contexto (online)
      if (userFormularios && userFormularios.length > 0) {
        setFormularios(userFormularios);
        console.log('[DEBUG Auditoria] Formularios desde contexto:', userFormularios.length, 'formularios');
      } 
      // Prioridad 2: Datos del cache offline
      else {
        console.log('[DEBUG Auditoria] No hay formularios en contexto, cargando desde cache offline...');
        const cacheData = await cargarDatosDelCache();
        
        if (cacheData && cacheData.formularios && cacheData.formularios.length > 0) {
          console.log('[DEBUG Auditoria] Formularios cargados desde cache offline:', cacheData.formularios.length, 'formularios');
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
          // Cargar desde Firestore cuando hay conectividad
          const formulariosCollection = collection(db, "formularios");
          const snapshot = await getDocs(formulariosCollection);
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
          console.log(`[DEBUG Auditoria] Formularios cargados desde Firestore: ${formulariosPermitidos.length} de ${todosLosFormularios.length}`);
        } else {
          // Cargar desde cache cuando está offline
          console.log('[DEBUG Auditoria] Sin conectividad, cargando formularios desde cache...');
          const cacheData = storageUtils.get('formularios_cache');
          
          if (cacheData && cacheData.formularios && cacheData.userId === userProfile.uid) {
            // Verificar que el cache no esté muy antiguo (máximo 24 horas)
            const cacheAge = Date.now() - cacheData.timestamp;
            const maxCacheAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (cacheAge < maxCacheAge) {
              setFormularios(cacheData.formularios);
              console.log(`[DEBUG Auditoria] Formularios cargados desde cache offline: ${cacheData.formularios.length}`);
            } else {
              console.log('[DEBUG Auditoria] Cache de formularios expirado');
              setFormularios([]);
            }
          } else {
            console.log('[DEBUG Auditoria] No hay cache de formularios disponible');
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
            console.log('[DEBUG Auditoria] Fallback: formularios cargados desde cache tras error');
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