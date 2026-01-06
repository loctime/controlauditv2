// src/services/empresaService.js
import { 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  collection
} from 'firebase/firestore';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { addDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { dbAudit, auditUserCollection, auditUsersCollection, db } from '../firebaseControlFile';
import { getEmpresas } from '../core/services/ownerEmpresaService';

export const empresaService = {
  /**
   * LECTURA TEMPORAL POR MIGRACIÓN
   * 
   * Lee empresas legacy de /empresas (colección raíz)
   * Solo lectura - NO permite creación ni edición
   */
  async getLegacyEmpresas(userId, role, userProfile) {
    try {
      console.log('[empresaService][getLegacyEmpresas] 🔄 Leyendo empresas legacy de /empresas');
      const empresasLegacyRef = collection(dbAudit, 'empresas');
      
      let legacyEmpresas = [];
      
      if (role === 'supermax') {
        // Supermax: todas las empresas
        const snapshot = await getDocs(empresasLegacyRef);
        legacyEmpresas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          legacy: true // Marcar como legacy
        }));
      } else if (role === 'max' || !role) {
        // Max: empresas donde es propietario, creador o socio
        const queries = [
          query(empresasLegacyRef, where('propietarioId', '==', userId)),
          query(empresasLegacyRef, where('creadorId', '==', userId)),
          query(empresasLegacyRef, where('socios', 'array-contains', userId))
        ];
        
        const snapshots = await Promise.all(
          queries.map(q => getDocs(q).catch(() => ({ docs: [] })))
        );
        
        const empresasMap = new Map();
        snapshots.forEach(snap => {
          snap.docs.forEach(doc => {
            if (!empresasMap.has(doc.id)) {
              empresasMap.set(doc.id, {
                id: doc.id,
                ...doc.data(),
                legacy: true // Marcar como legacy
              });
            }
          });
        });
        
        legacyEmpresas = Array.from(empresasMap.values());
      } else if (role === 'operario' && userProfile?.clienteAdminId) {
        // Operario: empresas del admin
        const adminId = userProfile.clienteAdminId;
        const queries = [
          query(empresasLegacyRef, where('propietarioId', '==', adminId)),
          query(empresasLegacyRef, where('creadorId', '==', userId)),
          query(empresasLegacyRef, where('socios', 'array-contains', userId))
        ];
        
        const snapshots = await Promise.all(
          queries.map(q => getDocs(q).catch(() => ({ docs: [] })))
        );
        
        const empresasMap = new Map();
        snapshots.forEach(snap => {
          snap.docs.forEach(doc => {
            if (!empresasMap.has(doc.id)) {
              empresasMap.set(doc.id, {
                id: doc.id,
                ...doc.data(),
                legacy: true // Marcar como legacy
              });
            }
          });
        });
        
        legacyEmpresas = Array.from(empresasMap.values());
      }
      
      console.log(`[empresaService][getLegacyEmpresas] ✅ Encontradas ${legacyEmpresas.length} empresas legacy`);
      return legacyEmpresas;
    } catch (error) {
      console.error('[empresaService][getLegacyEmpresas] ❌ Error al leer empresas legacy:', error);
      return [];
    }
  },

  /**
   * LECTURA TEMPORAL POR MIGRACIÓN
   * 
   * Lee empresas owner-centric de /apps/auditoria/owners/{ownerId}/empresas
   */
  async getOwnerCentricEmpresas(ownerId) {
    try {
      if (!ownerId) {
        console.log('[empresaService][getOwnerCentricEmpresas] ownerId no proporcionado');
        return [];
      }
      
      console.log('[empresaService][getOwnerCentricEmpresas] 🔄 Leyendo empresas owner-centric');
      const empresas = await getEmpresas(ownerId);
      
      // Normalizar formato para compatibilidad
      const empresasNormalizadas = empresas.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        ownerId: emp.ownerId,
        activa: emp.activa,
        createdAt: emp.createdAt,
        legacy: false // No es legacy
      }));
      
      console.log(`[empresaService][getOwnerCentricEmpresas] ✅ Encontradas ${empresasNormalizadas.length} empresas owner-centric`);
      return empresasNormalizadas;
    } catch (error) {
      console.error('[empresaService][getOwnerCentricEmpresas] ❌ Error al leer empresas owner-centric:', error);
      return [];
    }
  },

  /**
   * LECTURA TEMPORAL POR MIGRACIÓN
   * 
   * Método interno para leer empresas user-centric (código original)
   * Separado para mantener compatibilidad durante la migración
   */
  async _getUserCentricEmpresas(userId, roleToUse, userProfile) {
    try {
      // Construir rutas internamente
      const empresasRef = auditUserCollection(userId, 'empresas');
      const userRef = doc(auditUsersCollection(), userId);
      
      console.log('[empresaService][_getUserCentricEmpresas] usando path:', empresasRef.path);
      console.log('[empresaService][_getUserCentricEmpresas] userId:', userId, 'role:', roleToUse);

      let snapshot;

      if (roleToUse === 'supermax') {
        snapshot = await getDocs(empresasRef);
      } else if (roleToUse === 'max' || !roleToUse) {
        // Si role es null/undefined, usar lógica de 'max' como fallback
        // Buscar empresas por el UID actual Y por el UID migrado (si existe)
        const userSnap = await getDoc(userRef);
        let migratedFromUid = null;
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          migratedFromUid = userData.migratedFromUid;
        }
        
        // Si hay UID migrado, buscar empresas con ambos UIDs
        if (migratedFromUid) {
          console.log('[empresaService] 🔍 Buscando empresas con UID nuevo:', userId, 'y UID antiguo:', migratedFromUid);
          const qNuevo = query(empresasRef, where("propietarioId", "==", userId));
          const qAntiguo = query(empresasRef, where("propietarioId", "==", migratedFromUid));
          
          const [snapshotNuevo, snapshotAntiguo] = await Promise.all([
            getDocs(qNuevo),
            getDocs(qAntiguo)
          ]);
          
          // Combinar resultados y eliminar duplicados
          const empresasNuevas = snapshotNuevo.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const empresasAntiguas = snapshotAntiguo.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Si hay empresas antiguas, migrarlas automáticamente
          if (empresasAntiguas.length > 0 && empresasNuevas.length === 0) {
            console.log(`[empresaService] 🔄 Encontradas ${empresasAntiguas.length} empresas con UID antiguo, migrando...`);
            const empresasUpdatePromises = empresasAntiguas.map(async (empresa) => {
              await updateDocWithAppId(doc(empresasRef, empresa.id), {
                propietarioId: userId,
                lastUidUpdate: new Date(),
                migratedFromUid: migratedFromUid
              });
            });
            await Promise.all(empresasUpdatePromises);
            console.log('[empresaService] ✅ Empresas migradas automáticamente');
            return empresasAntiguas;
          }
          
          // Combinar sin duplicados
          const todasEmpresas = [...empresasNuevas];
          empresasAntiguas.forEach(emp => {
            if (!todasEmpresas.find(e => e.id === emp.id)) {
              todasEmpresas.push(emp);
            }
          });
          
          return todasEmpresas;
        } else {
          // Búsqueda múltiple: propietarioId, creadorId, socios, migratedFromUid
          console.log('[empresaService] 🔍 Buscando empresas para userId:', userId);
          
          const queries = [
            query(empresasRef, where("propietarioId", "==", userId)),
            query(empresasRef, where("creadorId", "==", userId)),
            query(empresasRef, where("migratedFromUid", "==", userId)),
            query(empresasRef, where("socios", "array-contains", userId))
          ];
          
          const snapshots = await Promise.all(queries.map(q => getDocs(q).catch(() => ({ empty: true, docs: [] }))));
          
          // Combinar todos los resultados sin duplicados
          const todasEmpresasMap = new Map();
          snapshots.forEach(snap => {
            snap.docs.forEach(doc => {
              if (!todasEmpresasMap.has(doc.id)) {
                todasEmpresasMap.set(doc.id, { id: doc.id, ...doc.data() });
              }
            });
          });
          
          const todasEmpresas = Array.from(todasEmpresasMap.values());
          console.log(`[empresaService] 📦 Encontradas ${todasEmpresas.length} empresas (propietario: ${snapshots[0].docs.length}, creador: ${snapshots[1].docs.length}, migradas: ${snapshots[2].docs.length}, socios: ${snapshots[3].docs.length})`);
          
          return todasEmpresas;
        }
      } else if (roleToUse === 'operario') {
        // Operario: buscar empresas del cliente admin Y empresas donde es creador/socio
        const userSnap = await getDoc(userRef);
        let todasEmpresasOperario = [];
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const adminId = userData.clienteAdminId || userProfile?.clienteAdminId;
          
          if (adminId) {
            // Buscar empresas del admin (en su propia colección)
            const empresasAdminRef = auditUserCollection(adminId, 'empresas');
            console.log('[empresaService] Operario buscando empresas del admin, usando path:', empresasAdminRef.path);
            const qAdmin = query(empresasAdminRef, where("propietarioId", "==", adminId));
            const snapAdmin = await getDocs(qAdmin);
            todasEmpresasOperario.push(...snapAdmin.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
          
          // También buscar empresas donde el operario es creador o socio (en su propia colección)
          const queriesOperario = [
            query(empresasRef, where("creadorId", "==", userId)),
            query(empresasRef, where("socios", "array-contains", userId))
          ];
          
          const snapshotsOperario = await Promise.all(
            queriesOperario.map(q => getDocs(q).catch(() => ({ docs: [] })))
          );
          
          snapshotsOperario.forEach(snap => {
            snap.docs.forEach(doc => {
              if (!todasEmpresasOperario.find(e => e.id === doc.id)) {
                todasEmpresasOperario.push({ id: doc.id, ...doc.data() });
              }
            });
          });
        }
        
        return todasEmpresasOperario;
      } else {
        // Fallback: si el role no es reconocido, usar lógica de 'max'
        console.warn('[empresaService] Role no reconocido:', roleToUse, '- usando lógica de fallback');
        const userSnap = await getDoc(userRef);
        let migratedFromUid = null;
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          migratedFromUid = userData.migratedFromUid;
        }
        
        // Búsqueda múltiple: propietarioId, creadorId, socios, migratedFromUid
        console.log('[empresaService] 🔍 [Fallback] Buscando empresas para userId:', userId);
        
        const queries = [
          query(empresasRef, where("propietarioId", "==", userId)),
          query(empresasRef, where("creadorId", "==", userId)),
          query(empresasRef, where("migratedFromUid", "==", userId)),
          query(empresasRef, where("socios", "array-contains", userId))
        ];
        
        const snapshots = await Promise.all(queries.map(q => getDocs(q).catch(() => ({ empty: true, docs: [] }))));
        
        // Combinar todos los resultados sin duplicados
        const todasEmpresasMap = new Map();
        snapshots.forEach(snap => {
          snap.docs.forEach(doc => {
            if (!todasEmpresasMap.has(doc.id)) {
              todasEmpresasMap.set(doc.id, { id: doc.id, ...doc.data() });
            }
          });
        });
        
        const todasEmpresas = Array.from(todasEmpresasMap.values());
        console.log(`[empresaService] 📦 [Fallback] Encontradas ${todasEmpresas.length} empresas`);
        
        return todasEmpresas;
      }

      // Este código ya no debería ejecutarse para role 'max' porque retornamos antes
      // Pero lo mantenemos por compatibilidad con otros roles
      if (snapshot && snapshot.docs) {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Si ya es un array (de la migración)
      if (Array.isArray(snapshot)) {
        return snapshot;
      }
      
      return [];
    } catch (error) {
      console.error("[empresaService][_getUserCentricEmpresas] Error al obtener empresas user-centric:", error);
      return [];
    }
  },

  // Obtener empresas del usuario (multi-tenant)
  // Construye internamente las rutas: /apps/auditoria/users/{uid}/empresas
  // LECTURA TEMPORAL POR MIGRACIÓN: Ahora también lee de owner-centric y legacy
  async getUserEmpresas(params) {
    try {
      // Soporte para objeto o parámetros posicionales (compatibilidad)
      const { userId, role, clienteAdminId, userProfile } = 
        typeof params === 'object' && params !== null && !Array.isArray(params)
          ? params
          : { userId: params, role: arguments[1], clienteAdminId: arguments[2] };
      
      if (!userId) {
        console.log('[empresaService] getUserEmpresas: userId no proporcionado');
        return [];
      }

      // Obtener role del userProfile si no está proporcionado
      let roleToUse = role;
      if (!roleToUse && userProfile?.role) {
        roleToUse = userProfile.role;
        console.log('[empresaService] Role obtenido del userProfile:', roleToUse);
      }

      // LECTURA TEMPORAL POR MIGRACIÓN: Determinar ownerId para leer empresas owner-centric
      const ownerId = userProfile?.clienteAdminId || userProfile?.uid || userId;
      
      // LECTURA TEMPORAL POR MIGRACIÓN: Leer empresas de ambas ubicaciones en paralelo
      console.log('[empresaService][getUserEmpresas] 🔄 Leyendo empresas de múltiples fuentes (migración)');
      const [empresasLegacy, empresasOwnerCentric, empresasUserCentric] = await Promise.all([
        this.getLegacyEmpresas(userId, roleToUse, userProfile).catch(() => []),
        this.getOwnerCentricEmpresas(ownerId).catch(() => []),
        this._getUserCentricEmpresas(userId, roleToUse, userProfile).catch(() => [])
      ]);

      // Unificar todas las empresas evitando duplicados por id
      const empresasUnificadasMap = new Map();
      
      // Agregar empresas legacy primero (tienen prioridad en caso de duplicados)
      empresasLegacy.forEach(emp => {
        empresasUnificadasMap.set(emp.id, emp);
      });
      
      // Agregar empresas owner-centric (no sobrescriben legacy)
      empresasOwnerCentric.forEach(emp => {
        if (!empresasUnificadasMap.has(emp.id)) {
          empresasUnificadasMap.set(emp.id, emp);
        }
      });
      
      // Agregar empresas user-centric (no sobrescriben las anteriores)
      empresasUserCentric.forEach(emp => {
        if (!empresasUnificadasMap.has(emp.id)) {
          empresasUnificadasMap.set(emp.id, emp);
        }
      });
      
      const empresasUnificadas = Array.from(empresasUnificadasMap.values());
      console.log(`[empresaService][getUserEmpresas] ✅ Total unificado: ${empresasUnificadas.length} empresas (legacy: ${empresasLegacy.length}, owner-centric: ${empresasOwnerCentric.length}, user-centric: ${empresasUserCentric.length})`);
      
      return empresasUnificadas;
    } catch (error) {
      console.error("[empresaService] Error al obtener empresas del usuario:", error);
      return [];
    }
  },

  // Listener reactivo para empresas
  // Construye internamente las rutas: /apps/auditoria/users/{uid}/empresas
  subscribeToUserEmpresas(userProfile, role, setUserEmpresas, setLoadingEmpresas, loadUserFromCache = null) {
    if (!userProfile?.uid || !role) {
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return () => {};
    }

    const userId = userProfile.uid;
    
    // Construir rutas internamente
    const empresasRef = auditUserCollection(userId, 'empresas');
    console.log('[empresaService] subscribeToUserEmpresas usando path:', empresasRef.path);

    setLoadingEmpresas(true);
    const unsubscribes = [];
    const empresasMaps = []; // Array de Maps, uno por cada query

    // Función para unificar resultados de todas las queries y actualizar estado
    const updateEmpresas = () => {
      const empresasUnificadasMap = new Map();
      // Combinar todos los Maps en uno solo (elimina duplicados por id)
      empresasMaps.forEach(map => {
        map.forEach((empresa, id) => {
          empresasUnificadasMap.set(id, empresa);
        });
      });
      const empresasUnificadas = Array.from(empresasUnificadasMap.values());
      setUserEmpresas(empresasUnificadas);
      setLoadingEmpresas(false);
    };

    // Función para manejar errores
    const handleError = async (error) => {
      console.error('[empresaService] ❌ Error en listener de empresas:', error);
      
      // Fallback al cache offline
      if (loadUserFromCache) {
        try {
          const cachedData = await loadUserFromCache();
          if (cachedData?.empresas && cachedData.empresas.length > 0) {
            console.log('[empresaService] 🔄 [Offline] Usando empresas del cache IndexedDB:', cachedData.empresas.length);
            setUserEmpresas(cachedData.empresas);
            setLoadingEmpresas(false);
            return;
          }
        } catch (cacheError) {
          console.error('[empresaService] Error cargando empresas desde cache:', cacheError);
        }
      }
      
      setUserEmpresas([]);
      setLoadingEmpresas(false);
    };

    if (role === 'supermax') {
      // Supermax ve todas las empresas
      const empresasMap = new Map();
      empresasMaps.push(empresasMap);
      const unsubscribe = onSnapshot(empresasRef, 
        (snapshot) => {
          empresasMap.clear(); // Limpiar antes de agregar nuevos
          snapshot.docs.forEach(doc => {
            empresasMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateEmpresas();
        }, 
        handleError
      );
      unsubscribes.push(unsubscribe);
    } else if (role === 'max') {
      // Max: buscar por propietarioId, creadorId y socios
      
      // Query 1: propietarioId
      const empresasMap1 = new Map();
      empresasMaps.push(empresasMap1);
      const qPropietario = query(empresasRef, where("propietarioId", "==", userId));
      const unsubscribe1 = onSnapshot(qPropietario,
        (snapshot) => {
          empresasMap1.clear(); // Limpiar antes de agregar nuevos
          snapshot.docs.forEach(doc => {
            empresasMap1.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateEmpresas();
        },
        handleError
      );
      unsubscribes.push(unsubscribe1);

      // Query 2: creadorId
      const empresasMap2 = new Map();
      empresasMaps.push(empresasMap2);
      const qCreador = query(empresasRef, where("creadorId", "==", userId));
      const unsubscribe2 = onSnapshot(qCreador,
        (snapshot) => {
          empresasMap2.clear(); // Limpiar antes de agregar nuevos
          snapshot.docs.forEach(doc => {
            empresasMap2.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateEmpresas();
        },
        handleError
      );
      unsubscribes.push(unsubscribe2);

      // Query 3: socios (array-contains)
      const empresasMap3 = new Map();
      empresasMaps.push(empresasMap3);
      const qSocios = query(empresasRef, where("socios", "array-contains", userId));
      const unsubscribe3 = onSnapshot(qSocios,
        (snapshot) => {
          empresasMap3.clear(); // Limpiar antes de agregar nuevos
          snapshot.docs.forEach(doc => {
            empresasMap3.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateEmpresas();
        },
        handleError
      );
      unsubscribes.push(unsubscribe3);
    } else if (role === 'operario' && userProfile.clienteAdminId) {
      // Operario: buscar por propietarioId del admin Y empresas donde es creador/socio
      const adminId = userProfile.clienteAdminId;
      
      // Construir referencia a empresas del admin
      const empresasAdminRef = auditUserCollection(adminId, 'empresas');
      console.log('[empresaService] Operario escuchando empresas del admin, usando path:', empresasAdminRef.path);
      
      // Query 1: propietarioId del admin
      const empresasMapOp1 = new Map();
      empresasMaps.push(empresasMapOp1);
      const qPropietarioAdmin = query(empresasAdminRef, where("propietarioId", "==", adminId));
      const unsubscribe1 = onSnapshot(qPropietarioAdmin,
        (snapshot) => {
          empresasMapOp1.clear(); // Limpiar antes de agregar nuevos
          snapshot.docs.forEach(doc => {
            empresasMapOp1.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateEmpresas();
        },
        handleError
      );
      unsubscribes.push(unsubscribe1);

      // Query 2: creadorId del usuario actual (en su propia colección)
      const empresasMapOp2 = new Map();
      empresasMaps.push(empresasMapOp2);
      const qCreadorUsuario = query(empresasRef, where("creadorId", "==", userId));
      const unsubscribe2 = onSnapshot(qCreadorUsuario,
        (snapshot) => {
          empresasMapOp2.clear(); // Limpiar antes de agregar nuevos
          snapshot.docs.forEach(doc => {
            empresasMapOp2.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateEmpresas();
        },
        handleError
      );
      unsubscribes.push(unsubscribe2);

      // Query 3: socios contiene userId (en su propia colección)
      const empresasMapOp3 = new Map();
      empresasMaps.push(empresasMapOp3);
      const qSociosUsuario = query(empresasRef, where("socios", "array-contains", userId));
      const unsubscribe3 = onSnapshot(qSociosUsuario,
        (snapshot) => {
          empresasMapOp3.clear(); // Limpiar antes de agregar nuevos
          snapshot.docs.forEach(doc => {
            empresasMapOp3.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateEmpresas();
        },
        handleError
      );
      unsubscribes.push(unsubscribe3);
    } else {
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return () => {};
    }

    // Retornar función que cancela todos los listeners
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  },

  // Crear empresa (multi-tenant)
  // Construye internamente las rutas: /apps/auditoria/users/{uid}/empresas y /apps/auditoria/users/{uid}/sucursales
  async crearEmpresa(empresaData, user, role, userProfile) {
    try {
      if (!user?.uid) throw new Error('Usuario no autenticado');
      
      let propietarioId, propietarioEmail, propietarioRole;
      let creadorId, creadorEmail, creadorRole;
      
      if (role === 'operario' && userProfile?.clienteAdminId) {
        propietarioId = userProfile.clienteAdminId;
        
        // Construir referencia al admin internamente
        const adminRef = doc(auditUsersCollection(), propietarioId);
        const adminSnap = await getDoc(adminRef);
        propietarioEmail = adminSnap.exists() ? adminSnap.data().email : 'admin@empresa.com';
        propietarioRole = 'max';
        
        creadorId = user.uid;
        creadorEmail = user.email;
        creadorRole = role;
      } else {
        propietarioId = user.uid;
        propietarioEmail = user.email;
        propietarioRole = role;
        
        creadorId = user.uid;
        creadorEmail = user.email;
        creadorRole = role;
      }
      
      // Construir rutas internamente para el propietario
      const empresasRef = auditUserCollection(propietarioId, 'empresas');
      const sucursalesRef = auditUserCollection(propietarioId, 'sucursales');
      const propietarioRef = doc(auditUsersCollection(), propietarioId);
      
      console.log('[empresaService] crearEmpresa usando path empresas:', empresasRef.path);
      console.log('[empresaService] crearEmpresa usando path sucursales:', sucursalesRef.path);
      
      const nuevaEmpresa = {
        ...empresaData,
        propietarioId,
        propietarioEmail,
        propietarioRole,
        creadorId,
        creadorEmail,
        creadorRole,
        createdAt: new Date(),
        socios: [propietarioId]
      };
      
      const docRef = await addDocWithAppId(empresasRef, nuevaEmpresa);
      
      // Crear automáticamente sucursal "Casa Central"
      const sucursalCasaCentral = {
        nombre: "Casa Central",
        empresaId: docRef.id,
        direccion: empresaData.direccion || "",
        telefono: empresaData.telefono || "",
        horasSemanales: 40,
        createdAt: new Date(),
        propietarioId,
        creadorId,
        activa: true
      };
      
      await addDocWithAppId(sucursalesRef, sucursalCasaCentral);
      
      // Actualizar perfil del propietario
      const propietarioSnap = await getDoc(propietarioRef);
      
      if (propietarioSnap.exists()) {
        const propietarioData = propietarioSnap.data();
        const empresasActuales = propietarioData.empresas || [];
        
        await updateDocWithAppId(propietarioRef, {
          empresas: [...empresasActuales, docRef.id]
        });
      }
      
      await registrarAccionSistema(
        user.uid,
        `Crear empresa: ${empresaData.nombre}`,
        { empresaData, empresaId: docRef.id, propietarioId, creadorId },
        'crear',
        'empresa',
        docRef.id
      );
      
      return docRef.id;
    } catch (error) {
      console.error("[empresaService] Error al crear empresa:", error);
      throw error;
    }
  },

  // Crear empresa legacy (compatibilidad con código antiguo)
  // Adapta datos legacy al formato nuevo y llama a crearEmpresa
  async crearEmpresaLegacy(empresaDataLegacy, userId) {
    try {
      if (!userId) throw new Error('userId es requerido');
      
      // Obtener datos del usuario desde Firestore
      const userRef = doc(auditUsersCollection(), userId);
      const userSnap = await getDoc(userRef);
      
      let userData = {};
      let userEmail = empresaDataLegacy.emailContacto;
      let userRole = 'max';
      let clienteAdminId = null;
      
      if (userSnap.exists()) {
        userData = userSnap.data();
        userEmail = userData.email || empresaDataLegacy.emailContacto;
        userRole = userData.role || 'max';
        clienteAdminId = userData.clienteAdminId || null;
      } else {
        // Usuario no existe aún (puede estar en estado "pending" o ser un uid temporal)
        // Usar datos del formulario como fallback
        console.warn(`[empresaService] Usuario ${userId} no encontrado en Firestore, usando datos del formulario`);
        userEmail = empresaDataLegacy.emailContacto;
        userRole = 'max';
      }
      
      // Construir objeto user mínimo
      const user = {
        uid: userId,
        email: userEmail
      };
      
      // Construir userProfile mínimo
      const userProfile = {
        uid: userId,
        email: userEmail,
        role: userRole,
        clienteAdminId: clienteAdminId
      };
      
      // Adaptar datos legacy al formato nuevo
      const empresaData = {
        nombre: empresaDataLegacy.nombre,
        direccion: empresaDataLegacy.direccion || '',
        telefono: empresaDataLegacy.telefono || '',
        emailContacto: empresaDataLegacy.emailContacto,
        usuariosMaximos: empresaDataLegacy.usuariosMaximos,
        usuariosActuales: empresaDataLegacy.usuariosActuales || 1,
        usuarios: empresaDataLegacy.usuarios || [],
        estadoPago: empresaDataLegacy.estadoPago || 'al_dia',
        fechaUltimoPago: empresaDataLegacy.fechaUltimoPago,
        fechaVencimiento: empresaDataLegacy.fechaVencimiento,
        plan: empresaDataLegacy.plan || 'estandar'
      };
      
      // Llamar a crearEmpresa con los datos adaptados
      return await this.crearEmpresa(empresaData, user, userProfile.role, userProfile);
    } catch (error) {
      console.error("[empresaService] Error al crear empresa legacy:", error);
      throw error;
    }
  },

  // Actualizar empresa
  // Construye internamente las rutas: /apps/auditoria/users/{uid}/empresas
  async updateEmpresa(empresaId, updateData, userProfile) {
    try {
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      
      // Construir ruta internamente
      const empresasRef = auditUserCollection(userProfile.uid, 'empresas');
      const empresaRef = doc(empresasRef, empresaId);
      
      console.log('[empresaService] updateEmpresa usando path:', empresaRef.path);
      
      await updateDocWithAppId(empresaRef, {
        ...updateData,
        ultimaModificacion: new Date(),
      });

      await registrarAccionSistema(
        userProfile?.uid,
        `Actualización de empresa (${empresaId})`,
        { ...updateData },
        'update',
        'empresa',
        empresaId
      );

      return true;
    } catch (error) {
      console.error('[empresaService] Error al actualizar empresa:', error);
      throw error;
    }
  },

  // Verificar y corregir empresas sin propietarioId
  // Construye internamente las rutas: /apps/auditoria/users/{uid}/empresas
  async verificarYCorregirEmpresas(userEmpresas, userProfile) {
    try {
      if (!userProfile?.uid) return { empresasCorregidas: 0, empresasActualizadas: [] };

      // Construir ruta internamente
      const empresasRef = auditUserCollection(userProfile.uid, 'empresas');
      console.log('[empresaService] verificarYCorregirEmpresas usando path:', empresasRef.path);

      const empresasAVerificar = userEmpresas || [];
      let empresasCorregidas = 0;
      const empresasActualizadas = [...userEmpresas];

      for (const empresa of empresasAVerificar) {
        if (!empresa.propietarioId) {
          const empresaRef = doc(empresasRef, empresa.id);
          await updateDocWithAppId(empresaRef, {
            propietarioId: userProfile.uid,
            propietarioEmail: userProfile.email,
            propietarioRole: userProfile.role,
            creadorId: userProfile.uid,
            creadorEmail: userProfile.email,
            creadorRole: userProfile.role,
            ultimaModificacion: new Date()
          });

          const index = empresasActualizadas.findIndex(e => e.id === empresa.id);
          if (index !== -1) {
            empresasActualizadas[index] = {
              ...empresasActualizadas[index],
              propietarioId: userProfile.uid,
              propietarioEmail: userProfile.email,
              propietarioRole: userProfile.role,
              creadorId: userProfile.uid,
              creadorEmail: userProfile.email,
              creadorRole: userProfile.role,
              ultimaModificacion: new Date()
            };
          }

          empresasCorregidas++;
        }
      }

      return { empresasCorregidas, empresasActualizadas };
    } catch (error) {
      console.error("[empresaService] Error al verificar empresas:", error);
      throw error;
    }
  },

  // Verificar si el usuario puede ver una empresa
  canViewEmpresa(empresaId, userProfile) {
    if (!userProfile) return false;
    
    if (userProfile.role === 'supermax') {
      return true;
    }
    
    if (userProfile.role === 'max') {
      if (userProfile.empresas && userProfile.empresas.includes(empresaId)) {
        return true;
      }
      return false;
    }
    
    if (userProfile.role === 'operario') {
      if (userProfile.empresas && userProfile.empresas.includes(empresaId)) {
        return true;
      }
      return false;
    }
    
    return false;
  },

};
