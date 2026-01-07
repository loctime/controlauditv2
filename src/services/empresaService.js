// src/services/empresaService.js
import { 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  collection,
  collectionGroup
} from 'firebase/firestore';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { addDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { dbAudit, auditUserCollection, auditUsersCollection, db } from '../firebaseControlFile';
import { getEmpresas } from '../core/services/ownerEmpresaService';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { logger } from '../utils/logger';

export const empresaService = {


  /**
   * ✅ MODELO OWNER-CENTRIC PARA OPERARIOS - FETCH PURO
   * 
   * Obtiene empresas para un operario usando el modelo owner-centric.
   * Este es un método de FETCH PURO, sin listeners reactivos.
   * 
   * ⚠️ IMPORTANTE: Para listeners reactivos, usar useEmpresasQuery (única fuente reactiva)
   * 
   * Flujo CORRECTO (SIN QUERIES PARA EMPRESAS):
   * 1. Recibir ownerId como parámetro requerido (NO inferir desde userProfile)
   * 2. Leer documento del operario directamente con getDoc():
   *    apps/auditoria/owners/{ownerId}/usuarios/{userId}
   * 3. Extraer empresasAsignadas[] desde el documento
   * 4. Para cada empresaId, usar getDoc() directo:
   *    apps/auditoria/owners/{ownerId}/empresas/{empresaId}
   * 
   * ⚠️ NO usa:
   * - Inferencia de ownerId desde userProfile (no confiable)
   * - Queries para empresas (prohibido para operarios)
   * - Solo getDoc() directo está permitido
   * 
   * @param {string} userId - ID del usuario operario
   * @param {string} ownerId - ID del owner (REQUERIDO, no se infiere)
   */
  async getEmpresasForOperario(userId, ownerId) {
    try {
      if (!userId) {
        logger.debugProd('[empresaService][getEmpresasForOperario] userId no proporcionado');
        return { ownerId: null, empresas: [], empresasAsignadas: [], userDocRef: null, empresasQueryRef: null };
      }

      if (!ownerId) {
        console.error('[empresaService][getEmpresasForOperario] ❌ ERROR: ownerId es requerido');
        console.error('[empresaService][getEmpresasForOperario] userId:', userId);
        console.error('[empresaService][getEmpresasForOperario] ownerId recibido:', ownerId);
        return { ownerId: null, empresas: [], empresasAsignadas: [], userDocRef: null, empresasQueryRef: null };
      }

      // ✅ 2. Leer documento del operario directamente con getDoc() (SIN QUERIES)
      // Path: apps/auditoria/owners/{ownerId}/usuarios/{userId}
      const userRef = doc(db, ...firestoreRoutesCore.usuario(ownerId, userId));
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        console.error('[empresaService][getEmpresasForOperario] ❌ ERROR DE PROVISIONING: Operario no encontrado en owner-centric');
        console.error('[empresaService][getEmpresasForOperario] Path:', userRef.path);
        console.error('[empresaService][getEmpresasForOperario] userId:', userId);
        console.error('[empresaService][getEmpresasForOperario] ownerId:', ownerId);
        return { ownerId: null, empresas: [], empresasAsignadas: [], userDocRef: null, empresasQueryRef: null };
      }

      const userData = userSnapshot.data();
      
      // ✅ 3. Obtener empresasAsignadas desde el documento
      const empresasAsignadas = userData.empresasAsignadas || [];

      logger.debugProd('[getUserEmpresas][OPERARIO] ownerId efectivo:', ownerId);
      logger.debugProd('[getUserEmpresas][OPERARIO] userId:', userId, 'ownerId:', ownerId);

      if (!empresasAsignadas || empresasAsignadas.length === 0) {
        logger.debugProd('[empresaService][getEmpresasForOperario] No hay empresas asignadas para el operario');
        // ⚠️ NO crear query para operarios (prohibido por reglas)
        // Retornar null en empresasQueryRef para indicar que no se puede escuchar
        return { 
          ownerId, 
          empresas: [], 
          empresasAsignadas: [],
          userDocRef: userRef, 
          empresasQueryRef: null // ⚠️ Operarios NO pueden usar queries
        };
      }

      logger.debugProd(`[empresaService][getEmpresasForOperario] 🔄 Resolviendo ${empresasAsignadas.length} empresas para operario ${userId} (ownerId: ${ownerId})`);

      // ✅ 4. Para cada empresaId, usar getDoc() directo (SIN QUERIES)
      const empresasPromises = empresasAsignadas.map(async (empresaId) => {
        try {
          const empresaRef = doc(db, ...firestoreRoutesCore.empresa(ownerId, empresaId));
          const empresaSnap = await getDoc(empresaRef);

          if (!empresaSnap.exists()) {
            console.warn(`[empresaService][getEmpresasForOperario] Empresa ${empresaId} no encontrada`);
            return null;
          }

          const empresaData = empresaSnap.data();
          return {
            id: empresaSnap.id,
            ownerId: empresaData.ownerId || ownerId,
            nombre: empresaData.nombre,
            activa: empresaData.activa !== undefined ? empresaData.activa : true,
            createdAt: empresaData.createdAt?.toDate() || new Date()
          };
        } catch (error) {
          console.error(`[empresaService][getEmpresasForOperario] Error al leer empresa ${empresaId}:`, error);
          return null;
        }
      });

      const empresas = (await Promise.all(empresasPromises)).filter(emp => emp !== null);

      logger.debugProd(`[empresaService][getEmpresasForOperario] ✅ Resueltas ${empresas.length} empresas para operario`);
      
      // ⚠️ NO crear query para operarios (prohibido por reglas de Firestore)
      // Los operarios solo pueden usar getDoc() directo
      // Retornar null en empresasQueryRef para indicar que no se puede escuchar
      
      return { 
        ownerId, 
        empresas, 
        empresasAsignadas,
        userDocRef: userRef,
        empresasQueryRef: null // ⚠️ Operarios NO pueden usar queries
      };
      } catch (error) {
        console.error('[empresaService][getEmpresasForOperario] ❌ Error:', error);
        return { ownerId: null, empresas: [], empresasAsignadas: [], userDocRef: null, empresasQueryRef: null };
      }
    },

  /**
   * Mapea snapshots de empresas a array de empresas normalizadas
   * Filtra por empresasAsignadas si se proporciona
   * Única fuente de verdad para la estructura de una empresa
   */
  mapEmpresasSnapshots(snapshots, ownerId, empresasAsignadas = null) {
    const empresas = snapshots
      .map(snapshot => {
        if (!snapshot.exists()) {
          return null;
        }
        
        const empresaData = snapshot.data();
        return {
          id: snapshot.id,
          ownerId: empresaData.ownerId || ownerId,
          nombre: empresaData.nombre,
          activa: empresaData.activa !== undefined ? empresaData.activa : true,
          createdAt: empresaData.createdAt?.toDate() || new Date()
        };
      })
      .filter(emp => emp !== null);
    
    // Filtrar por empresasAsignadas si se proporciona
    if (empresasAsignadas && empresasAsignadas.length > 0) {
      const empresasAsignadasSet = new Set(empresasAsignadas);
      return empresas.filter(emp => empresasAsignadasSet.has(emp.id));
    }
    
    return empresas;
  },

  /**
   * ✅ MODELO OWNER-CENTRIC PARA OWNERS
   * 
   * Obtiene todas las empresas del owner usando el servicio owner-centric.
   */
  async getEmpresasForOwner(ownerId) {
    try {
      if (!ownerId) {
        console.log('[empresaService][getEmpresasForOwner] ownerId no proporcionado');
        return [];
      }

      console.log(`[empresaService][getEmpresasForOwner] 🔄 Leyendo empresas del owner ${ownerId}`);
      const empresas = await getEmpresas(ownerId);

      const empresasNormalizadas = empresas.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        ownerId: emp.ownerId,
        activa: emp.activa,
        createdAt: emp.createdAt
      }));

      console.log(`[empresaService][getEmpresasForOwner] ✅ Encontradas ${empresasNormalizadas.length} empresas`);
      return empresasNormalizadas;
    } catch (error) {
      console.error('[empresaService][getEmpresasForOwner] ❌ Error:', error);
      return [];
    }
  },


  // Obtener empresas del usuario usando modelo owner-centric
  async getUserEmpresas(params) {
    try {
      const { userId, role, userProfile } = 
        typeof params === 'object' && params !== null && !Array.isArray(params)
          ? params
          : { userId: params, role: arguments[1] };
      
      if (!userId) {
        logger.debugProd('[empresaService] getUserEmpresas: userId no proporcionado');
        return [];
      }

      // Para operarios: usar getEmpresasForOperario con ownerId desde token claims
      if (role === 'operario' || userProfile?.role === 'operario') {
        // ownerId debe venir del token claims, no de userProfile
        // Por ahora, si no está disponible, retornar vacío (se obtendrá desde token en AuthContext)
        const ownerId = userProfile?.ownerId;
        if (!ownerId) {
          console.error('[empresaService][getUserEmpresas] ❌ ownerId no disponible para operario');
          return [];
        }
        
        const resultadoOperario = await this.getEmpresasForOperario(userId, ownerId);
        return resultadoOperario.empresas || [];
      }

      // Para owners: usar getEmpresasForOwner
      const ownerId = userProfile?.uid || userId;
      return await this.getEmpresasForOwner(ownerId);
    } catch (error) {
      console.error("[empresaService] Error al obtener empresas del usuario:", error);
      return [];
    }
  },

  /**
   * Listener reactivo para empresas (SOLO max/supermax - legacy)
   * 
   * ⚠️ OPERARIOS NO DEBEN USAR ESTE MÉTODO
   * Los operarios usan useEmpresasQuery como única fuente reactiva
   * 
   * Este método solo maneja listeners legacy para max/supermax
   */
  subscribeToUserEmpresas(userProfile, role, setUserEmpresas, setLoadingEmpresas, loadUserFromCache = null) {
    if (!userProfile?.uid || !role) {
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return () => {};
    }

    const userId = userProfile.uid;
    
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
      // ✅ Solo max/supermax construyen auditUserCollection
      const empresasRef = auditUserCollection(userId, 'empresas');
      console.log('[empresaService] subscribeToUserEmpresas usando path:', empresasRef.path);
      
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
      // ✅ Solo max/supermax construyen auditUserCollection
      const empresasRef = auditUserCollection(userId, 'empresas');
      console.log('[empresaService] subscribeToUserEmpresas usando path:', empresasRef.path);
      
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
    } else if (role === 'operario') {
      // ✅ OPERARIO: NO usar subscribeToUserEmpresas
      // Los operarios usan useEmpresasQuery como única fuente reactiva
      // Este método solo maneja listeners para max/supermax (legacy)
      console.warn('[empresaService] subscribeToUserEmpresas: Operarios deben usar useEmpresasQuery');
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return () => {};
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

  // Crear empresa
  // NOTA: Esta función aún usa rutas legacy y debe migrarse a owner-centric
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


  // Actualizar empresa
  // NOTA: Esta función aún usa rutas legacy y debe migrarse a owner-centric
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
  // NOTA: Esta función aún usa rutas legacy y debe migrarse a owner-centric
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
  /**
   * Verifica si un usuario puede ver una empresa
   * 
   * Para operarios: usa empresas ya resueltas (no userProfile)
   * Para max/supermax: usa userProfile.empresas (legacy)
   */
  canViewEmpresa(empresaId, userProfile, empresasResueltas = null) {
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
    
    // ✅ OPERARIO: usar empresas ya resueltas, NO userProfile
    if (userProfile.role === 'operario') {
      // Si se proporcionan empresas resueltas, usar esas
      if (empresasResueltas && Array.isArray(empresasResueltas)) {
        return empresasResueltas.some(emp => emp.id === empresaId);
      }
      // Fallback: NO usar userProfile.empresas (no debe existir en /users)
      return false;
    }
    
    return false;
  },

};
