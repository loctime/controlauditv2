// src/services/empresaService.js
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  getDoc, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db, auditUserCollection } from '../firebaseControlFile';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const empresaService = {
  // Obtener empresas del usuario (multi-tenant)
  async getUserEmpresas(userId, role, clienteAdminId) {
    try {
      if (!userId) return [];

      const empresasRef = auditUserCollection(userId, "empresas");
      let snapshot;

      if (role === 'supermax') {
        snapshot = await getDocs(empresasRef);
      } else if (role === 'max') {
        // Buscar empresas por el UID actual Y por el UID migrado (si existe)
        const userRef = doc(db, "apps", "audit", "users", userId);
        const userSnap = await getDoc(userRef);
        let migratedFromUid = null;
        let userEmail = null;
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          migratedFromUid = userData.migratedFromUid;
          userEmail = userData.email;
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
              await updateDoc(doc(empresasRef, empresa.id), {
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
          
          // Si encuentra empresas, retornarlas
          if (todasEmpresas.length > 0) {
            return todasEmpresas;
          }
          
          // Si no encuentra empresas y hay email, buscar por email del propietario (fallback)
          if (userEmail) {
            console.log('[empresaService] 🔍 No se encontraron empresas por UID, buscando por email del propietario...');
            // Buscar usuarios con este email y obtener sus UIDs
            // NOTA: apps/audit/users es una colección global compartida, no multi-tenant
            const usuariosRef = collection(db, 'apps', 'audit', 'users');
            const emailQuery = query(usuariosRef, where('email', '==', userEmail));
            const usuariosSnapshot = await getDocs(emailQuery);
            
            if (!usuariosSnapshot.empty) {
              // Buscar empresas con todos los UIDs encontrados
              const uidsEncontrados = usuariosSnapshot.docs.map(doc => doc.id);
              console.log('[empresaService] 📋 UIDs encontrados para este email:', uidsEncontrados);
              
              const empresasPromises = uidsEncontrados.map(async (uid) => {
                const qEmpresas = query(empresasRef, where("propietarioId", "==", uid));
                const empresasSnap = await getDocs(qEmpresas);
                return empresasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              });
              
              const empresasArrays = await Promise.all(empresasPromises);
              const empresasPorEmail = empresasArrays.flat();
              
              if (empresasPorEmail.length > 0) {
                console.log(`[empresaService] 📦 Encontradas ${empresasPorEmail.length} empresas por email, migrando al nuevo UID...`);
                // Migrar todas las empresas al nuevo UID
                const empresasUpdatePromises = empresasPorEmail.map(async (empresa) => {
                  await updateDoc(doc(empresasRef, empresa.id), {
                    propietarioId: userId,
                    lastUidUpdate: new Date(),
                    migratedFromUid: empresa.propietarioId
                  });
                });
                await Promise.all(empresasUpdatePromises);
                console.log('[empresaService] ✅ Empresas migradas exitosamente');
                return empresasPorEmail;
              }
            }
          }
          
          return [];
        }
      } else {
        // Operario: buscar empresas del cliente admin Y empresas donde es creador/socio
        const userRef = doc(db, "apps", "audit", "users", userId);
        const userSnap = await getDoc(userRef);
        let todasEmpresasOperario = [];
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const adminId = userData.clienteAdminId;
          
          if (adminId) {
            // Buscar empresas del admin
            const qAdmin = query(empresasRef, where("propietarioId", "==", adminId));
            const snapAdmin = await getDocs(qAdmin);
            todasEmpresasOperario.push(...snapAdmin.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
          
          // También buscar empresas donde el operario es creador o socio
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
      console.error("Error al obtener empresas del usuario:", error);
      return [];
    }
  },

  // Listener reactivo para empresas
  subscribeToUserEmpresas(userProfile, role, setUserEmpresas, setLoadingEmpresas, loadUserFromCache = null) {
    if (!userProfile?.uid || !role) {
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return () => {};
    }

    setLoadingEmpresas(true);
    const empresasRef = auditUserCollection(userProfile.uid, "empresas");
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
      console.error('❌ Error en listener de empresas:', error);
      
      // Fallback al cache offline
      if (loadUserFromCache) {
        try {
          const cachedData = await loadUserFromCache();
          if (cachedData?.empresas && cachedData.empresas.length > 0) {
            console.log('🔄 [Offline] Usando empresas del cache IndexedDB:', cachedData.empresas.length);
            setUserEmpresas(cachedData.empresas);
            setLoadingEmpresas(false);
            return;
          }
        } catch (cacheError) {
          console.error('Error cargando empresas desde cache:', cacheError);
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
      const userId = userProfile.uid;
      
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
      // Operario: buscar por propietarioId, creadorId y socios del clienteAdminId
      const adminId = userProfile.clienteAdminId;
      const userId = userProfile.uid;
      
      // Query 1: propietarioId del admin
      const empresasMapOp1 = new Map();
      empresasMaps.push(empresasMapOp1);
      const qPropietarioAdmin = query(empresasRef, where("propietarioId", "==", adminId));
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

      // Query 2: creadorId del usuario actual
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

      // Query 3: socios contiene userId
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
  async crearEmpresa(empresaData, user, role, userProfile) {
    try {
      if (!user?.uid) throw new Error('Usuario no autenticado');
      const empresaRef = auditUserCollection(user.uid, "empresas");
      
      let propietarioId, propietarioEmail, propietarioRole;
      let creadorId, creadorEmail, creadorRole;
      
      if (role === 'operario' && userProfile?.clienteAdminId) {
        propietarioId = userProfile.clienteAdminId;
        
        const adminRef = doc(db, "apps", "audit", "users", userProfile.clienteAdminId);
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
      
      const docRef = await addDoc(empresaRef, nuevaEmpresa);
      
      // Crear automáticamente sucursal "Casa Central"
      const sucursalesRef = auditUserCollection(user.uid, "sucursales");
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
      
      await addDoc(sucursalesRef, sucursalCasaCentral);
      
      // Actualizar perfil del propietario
      const propietarioRef = doc(db, "apps", "audit", "users", propietarioId);
      const propietarioSnap = await getDoc(propietarioRef);
      
      if (propietarioSnap.exists()) {
        const propietarioData = propietarioSnap.data();
        const empresasActuales = propietarioData.empresas || [];
        
        await updateDoc(propietarioRef, {
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
      console.error("Error al crear empresa:", error);
      throw error;
    }
  },

  // Actualizar empresa
  async updateEmpresa(empresaId, updateData, userProfile) {
    try {
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      const empresasRef = auditUserCollection(userProfile.uid, "empresas");
      const empresaRef = doc(empresasRef, empresaId);
      await updateDoc(empresaRef, {
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
  async verificarYCorregirEmpresas(userEmpresas, userProfile) {
    try {
      if (!userProfile) return 0;

      const empresasAVerificar = userEmpresas || [];
      let empresasCorregidas = 0;
      const empresasActualizadas = [...userEmpresas];

      for (const empresa of empresasAVerificar) {
        if (!empresa.propietarioId) {
          const empresasRef = auditUserCollection(userProfile.uid, "empresas");
          const empresaRef = doc(empresasRef, empresa.id);
          await updateDoc(empresaRef, {
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
      console.error("Error al verificar empresas:", error);
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
  }
};
