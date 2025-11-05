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
import { db } from '../firebaseConfig';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const empresaService = {
  // Obtener empresas del usuario (multi-tenant)
  async getUserEmpresas(userId, role, clienteAdminId) {
    try {
      if (!userId) return [];

      const empresasRef = collection(db, "empresas");
      let snapshot;

      if (role === 'supermax') {
        snapshot = await getDocs(empresasRef);
      } else if (role === 'max') {
        // Buscar empresas por el UID actual Y por el UID migrado (si existe)
        const userRef = doc(db, "usuarios", userId);
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
              await updateDoc(doc(db, "empresas", empresa.id), {
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
          // Búsqueda normal por UID
          const q = query(empresasRef, where("propietarioId", "==", userId));
          snapshot = await getDocs(q);
          
          // Si no encuentra empresas y hay email, buscar por email del propietario (fallback)
          if (snapshot.empty && userEmail) {
            console.log('[empresaService] 🔍 No se encontraron empresas por UID, buscando por email del propietario...');
            // Buscar usuarios con este email y obtener sus UIDs
            const usuariosRef = collection(db, 'usuarios');
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
              const todasEmpresas = empresasArrays.flat();
              
              if (todasEmpresas.length > 0) {
                console.log(`[empresaService] 📦 Encontradas ${todasEmpresas.length} empresas, migrando al nuevo UID...`);
                // Migrar todas las empresas al nuevo UID
                const empresasUpdatePromises = todasEmpresas.map(async (empresa) => {
                  await updateDoc(doc(db, "empresas", empresa.id), {
                    propietarioId: userId,
                    lastUidUpdate: new Date(),
                    migratedFromUid: empresa.propietarioId
                  });
                });
                await Promise.all(empresasUpdatePromises);
                console.log('[empresaService] ✅ Empresas migradas exitosamente');
                return todasEmpresas;
              }
            }
          }
        }
      } else {
        const userRef = doc(db, "usuarios", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const adminId = userData.clienteAdminId;
          if (adminId) {
            const q = query(empresasRef, where("propietarioId", "==", adminId));
            snapshot = await getDocs(q);
          } else {
            snapshot = { docs: [] };
          }
        } else {
          snapshot = { docs: [] };
        }
      }

      // Si snapshot es un objeto con docs (no es un array de empresas)
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
    let q;
    const empresasRef = collection(db, "empresas");

    if (role === 'supermax') {
      q = empresasRef;
    } else if (role === 'max') {
      q = query(empresasRef, where("propietarioId", "==", userProfile.uid));
    } else if (role === 'operario' && userProfile.clienteAdminId) {
      q = query(empresasRef, where("propietarioId", "==", userProfile.clienteAdminId));
    } else {
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return () => {};
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setUserEmpresas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingEmpresas(false);
      }, 
      async (error) => {
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
      }
    );

    return unsubscribe;
  },

  // Crear empresa (multi-tenant)
  async crearEmpresa(empresaData, user, role, userProfile) {
    try {
      const empresaRef = collection(db, "empresas");
      
      let propietarioId, propietarioEmail, propietarioRole;
      let creadorId, creadorEmail, creadorRole;
      
      if (role === 'operario' && userProfile?.clienteAdminId) {
        propietarioId = userProfile.clienteAdminId;
        
        const adminRef = doc(db, "usuarios", userProfile.clienteAdminId);
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
      const sucursalesRef = collection(db, "sucursales");
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
      const propietarioRef = doc(db, "usuarios", propietarioId);
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
      const empresaRef = doc(db, 'empresas', empresaId);
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
          const empresaRef = doc(db, "empresas", empresa.id);
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
