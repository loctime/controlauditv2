import { useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import { storageUtils } from "../../../../../utils/utilitiesOptimization";
import { useAuth } from "../../../../context/AuthContext";
import { useOfflineData } from "../../../../../hooks/useOfflineData";

export const useAuditoriaData = (
  setEmpresas,
  setSucursales,
  setFormularios,
  empresaSeleccionada,
  userProfile,
  userEmpresas,
  userFormularios
) => {
  // Usar el hook de datos offline
  const { empresas: offlineEmpresas, formularios: offlineFormularios, loading: offlineLoading } = useOfflineData();
  // Cargar empresas desde el contexto, cache offline o Firestore como fallback
  useEffect(() => {
    const cargarEmpresas = async () => {
      // Prioridad 1: Datos del contexto (online)
      if (userEmpresas && userEmpresas.length > 0) {
        setEmpresas(userEmpresas);
        console.log('[DEBUG Auditoria] Empresas desde contexto:', userEmpresas);
      } 
      // Prioridad 2: Datos del cache offline
      else if (offlineEmpresas && offlineEmpresas.length > 0) {
        setEmpresas(offlineEmpresas);
        console.log('[DEBUG Auditoria] Empresas desde cache offline:', offlineEmpresas);
      }
      // Prioridad 3: Cargar desde Firestore (solo si hay conexión)
      else if (userProfile && userProfile.uid && navigator.onLine) {
        // Fallback: cargar empresas desde Firestore si no están en el contexto
        try {
          console.log('[DEBUG Auditoria] Cargando empresas desde Firestore como fallback...');
          let empresasData = [];
          
          if (userProfile.role === 'supermax') {
            const empresasSnapshot = await getDocs(collection(db, 'empresas'));
            empresasData = empresasSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } else if (userProfile.role === 'max') {
            // Cargar empresas propias
            const empresasRef = collection(db, "empresas");
            const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
            const empresasSnapshot = await getDocs(empresasQuery);
            const misEmpresas = empresasSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Cargar usuarios operarios y sus empresas
            const usuariosRef = collection(db, "usuarios");
            const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
            const usuariosSnapshot = await getDocs(usuariosQuery);
            const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

            // Cargar empresas de operarios
            const empresasOperariosPromises = usuariosOperarios.map(async (operarioId) => {
              const operarioEmpresasQuery = query(empresasRef, where("propietarioId", "==", operarioId));
              const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
              return operarioEmpresasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            });

            const empresasOperariosArrays = await Promise.all(empresasOperariosPromises);
            const empresasOperarios = empresasOperariosArrays.flat();

            empresasData = [...misEmpresas, ...empresasOperarios];
          } else if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
            // Operario ve empresas de su cliente admin
            const empresasRef = collection(db, "empresas");
            const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.clienteAdminId));
            const empresasSnapshot = await getDocs(empresasQuery);
            empresasData = empresasSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }

          setEmpresas(empresasData);
          console.log(`[DEBUG Auditoria] Empresas cargadas desde Firestore: ${empresasData.length}`);
        } catch (error) {
          console.error("Error al cargar empresas desde Firestore:", error);
          setEmpresas([]);
        }
      } else {
        setEmpresas([]);
      }
    };

    cargarEmpresas();
  }, [userProfile, userEmpresas, offlineEmpresas, setEmpresas]);

  // Cargar todas las sucursales disponibles al inicio
  useEffect(() => {
    const cargarTodasLasSucursales = async () => {
      if (!userProfile) {
        setSucursales([]);
        return;
      }

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
          // Para max y operario, cargar sucursales de sus empresas
          // Usar userEmpresas si están disponibles, sino cargar desde Firestore
          let empresasParaSucursales = userEmpresas;
          
          if (!empresasParaSucursales || empresasParaSucursales.length === 0) {
            // Cargar empresas para obtener sucursales
            if (userProfile.role === 'max') {
              const empresasRef = collection(db, "empresas");
              const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
              const empresasSnapshot = await getDocs(empresasQuery);
              const misEmpresas = empresasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));

              // Cargar empresas de operarios
              const usuariosRef = collection(db, "usuarios");
              const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
              const usuariosSnapshot = await getDocs(usuariosQuery);
              const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

              const empresasOperariosPromises = usuariosOperarios.map(async (operarioId) => {
                const operarioEmpresasQuery = query(empresasRef, where("propietarioId", "==", operarioId));
                const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
                return operarioEmpresasSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
              });

              const empresasOperariosArrays = await Promise.all(empresasOperariosPromises);
              const empresasOperarios = empresasOperariosArrays.flat();

              empresasParaSucursales = [...misEmpresas, ...empresasOperarios];
            } else if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
              const empresasRef = collection(db, "empresas");
              const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.clienteAdminId));
              const empresasSnapshot = await getDocs(empresasQuery);
              empresasParaSucursales = empresasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
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
    // Prioridad 1: Datos del contexto (online)
    if (userFormularios && userFormularios.length > 0) {
      setFormularios(userFormularios);
      console.log('[DEBUG Auditoria] Formularios desde contexto:', userFormularios);
    } 
    // Prioridad 2: Datos del cache offline
    else if (offlineFormularios && offlineFormularios.length > 0) {
      setFormularios(offlineFormularios);
      console.log('[DEBUG Auditoria] Formularios desde cache offline:', offlineFormularios);
    }
  }, [userFormularios, offlineFormularios, setFormularios]);

  // Cargar formularios desde Firestore si no están en el contexto ni en cache offline
  useEffect(() => {
    if ((!userFormularios || userFormularios.length === 0) && (!offlineFormularios || offlineFormularios.length === 0)) {
      const obtenerFormularios = async () => {
        try {
          if (!userProfile) return;
          
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
    }
  }, [userProfile, userFormularios, offlineFormularios, setFormularios]);
}; 