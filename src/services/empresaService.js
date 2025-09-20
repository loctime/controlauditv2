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
        const q = query(empresasRef, where("propietarioId", "==", userId));
        snapshot = await getDocs(q);
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

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error al obtener empresas del usuario:", error);
      return [];
    }
  },

  // Listener reactivo para empresas
  subscribeToUserEmpresas(userProfile, role, setUserEmpresas, setLoadingEmpresas) {
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserEmpresas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingEmpresas(false);
    }, (error) => {
      console.error('[empresaService] Error en onSnapshot de empresas:', error);
      setUserEmpresas([]);
      setLoadingEmpresas(false);
    });

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
