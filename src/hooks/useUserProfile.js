// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getUserRole } from '../config/admin';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const useUserProfile = (firebaseUser) => {
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [permisos, setPermisos] = useState({});
  const [bloqueado, setBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');

  // Crear o obtener perfil del usuario
  const createOrGetUserProfile = async (firebaseUser) => {
    try {
      // 1. Intentar buscar por UID nuevo primero
      const userRef = doc(db, "usuarios", firebaseUser.uid);
      let userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profileData = userSnap.data();
        
        // Verificar si hay datos antiguos aunque el perfil exista con el nuevo UID
        // Si no tiene migratedFromUid, buscar por email para ver si hay un perfil antiguo
        if (!profileData.migratedFromUid && firebaseUser.email) {
          console.log('[useUserProfile] Perfil existe pero sin migratedFromUid, verificando si hay datos antiguos...');
          const usuariosRef = collection(db, 'usuarios');
          const emailQuery = query(usuariosRef, where('email', '==', firebaseUser.email));
          const emailSnapshot = await getDocs(emailQuery);
          
          if (!emailSnapshot.empty) {
            const usuariosConEmail = emailSnapshot.docs.filter(doc => doc.id !== firebaseUser.uid);
            if (usuariosConEmail.length > 0) {
              const oldUserDoc = usuariosConEmail[0];
              const oldUid = oldUserDoc.id;
              console.log('[useUserProfile] ⚠️ Encontrado usuario antiguo por email:', oldUid);
              console.log('[useUserProfile] 🔄 Actualizando perfil con migratedFromUid y migrando datos...');
              
              // Actualizar el perfil actual con migratedFromUid
              await updateDoc(userRef, {
                migratedFromUid: oldUid,
                lastUidUpdate: new Date()
              });
              
              // Migrar todos los datos
              try {
                const { migrateAllUserData } = await import('../services/migrationService');
                const migrationResult = await migrateAllUserData(oldUid, firebaseUser.uid);
                console.log('[useUserProfile] ✅ Migración completa exitosa:', migrationResult);
                
                // Actualizar profileData con el migratedFromUid
                profileData.migratedFromUid = oldUid;
                profileData.lastUidUpdate = new Date();
              } catch (migrationError) {
                console.error('[useUserProfile] ⚠️ Error en migración completa (no crítico):', migrationError);
              }
            }
          }
        }
        
        setUserProfile(profileData);
        setRole(profileData.role || null);
        setPermisos(profileData.permisos || {});
        return profileData;
      }

      // 2. Si no existe por UID, buscar por email (migración desde Auth antiguo)
      console.log('[useUserProfile] Usuario no encontrado por UID, buscando por email...');
      const usuariosRef = collection(db, 'usuarios');
      const emailQuery = query(usuariosRef, where('email', '==', firebaseUser.email));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        // Usuario encontrado por email (perfil antiguo)
        const oldUserDoc = emailSnapshot.docs[0];
        const oldProfileData = oldUserDoc.data();
        const oldUid = oldUserDoc.id;

        console.log('[useUserProfile] ✅ Usuario encontrado por email con UID antiguo:', oldUid);
        console.log('[useUserProfile] 🔄 Migrando perfil al nuevo UID:', firebaseUser.uid);

        // Actualizar el documento con el nuevo UID
        // Opción 1: Actualizar el documento existente con el nuevo UID en el campo uid
        await updateDoc(doc(db, "usuarios", oldUid), {
          uid: firebaseUser.uid,
          lastUidUpdate: new Date(),
          migratedFromUid: oldUid
        });

        // Opción 2: Crear un nuevo documento con el nuevo UID y copiar datos
        const migratedProfile = {
          ...oldProfileData,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || oldProfileData.displayName || firebaseUser.email,
          lastUidUpdate: new Date(),
          migratedFromUid: oldUid
        };

        // Crear nuevo documento con nuevo UID
        await setDoc(userRef, migratedProfile);

        // Migrar TODOS los datos relacionados con el UID antiguo
        console.log('[useUserProfile] 🔄 Migrando todos los datos al nuevo UID...');
        try {
          const { migrateAllUserData } = await import('../services/migrationService');
          const migrationResult = await migrateAllUserData(oldUid, firebaseUser.uid);
          console.log('[useUserProfile] ✅ Migración completa exitosa:', migrationResult);
        } catch (migrationError) {
          console.error('[useUserProfile] ⚠️ Error en migración completa (no crítico):', migrationError);
          // Fallback: intentar migrar solo empresas (método anterior)
          try {
            const empresasRef = collection(db, 'empresas');
            const empresasQueryResult = query(empresasRef, where('propietarioId', '==', oldUid));
            const empresasSnapshot = await getDocs(empresasQueryResult);
            
            if (!empresasSnapshot.empty) {
              console.log(`[useUserProfile] 📦 Fallback: Migrando ${empresasSnapshot.docs.length} empresas...`);
              const empresasUpdatePromises = empresasSnapshot.docs.map(async (empresaDocSnap) => {
                await updateDoc(doc(db, 'empresas', empresaDocSnap.id), {
                  propietarioId: firebaseUser.uid,
                  lastUidUpdate: new Date(),
                  migratedFromUid: oldUid
                });
              });
              await Promise.all(empresasUpdatePromises);
              console.log('[useUserProfile] ✅ Empresas migradas (fallback)');
            }
          } catch (fallbackError) {
            console.error('[useUserProfile] ❌ Error en migración fallback:', fallbackError);
          }
        }

        console.log('[useUserProfile] ✅ Perfil migrado exitosamente');

        setUserProfile(migratedProfile);
        setRole(migratedProfile.role || null);
        setPermisos(migratedProfile.permisos || {});
        return migratedProfile;
      }

      // 3. Si no existe por email tampoco, crear nuevo perfil
      console.log('[useUserProfile] Usuario no encontrado, creando nuevo perfil...');
      const newProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email,
        createdAt: new Date(),
        role: getUserRole(firebaseUser.email),
        clienteAdminId: getUserRole(firebaseUser.email) === 'max' ? firebaseUser.uid : null,
        empresas: [],
        auditorias: [],
        permisos: {
          puedeCrearEmpresas: true,
          puedeCrearSucursales: true,
          puedeCrearAuditorias: true,
          puedeCompartirFormularios: true,
          puedeAgregarSocios: true,
          puedeGestionarUsuarios: true,
          puedeVerLogs: true,
          puedeGestionarSistema: true,
          puedeEliminarUsuarios: true
        },
        configuracion: {
          notificaciones: true,
          tema: 'light'
        }
      };

      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);
      setRole(newProfile.role);
      setPermisos(newProfile.permisos);
      return newProfile;
    } catch (error) {
      console.error("Error al crear/obtener perfil de usuario:", error);
      return null;
    }
  };

  // Actualizar perfil del usuario
  const updateUserProfile = async (updates) => {
    try {
      const userRef = doc(db, "usuarios", firebaseUser.uid);
      await updateDoc(userRef, updates);
      
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
      
      await registrarAccionSistema(
        firebaseUser.uid,
        `Actualizar perfil de usuario`,
        { updates },
        'editar',
        'usuario',
        firebaseUser.uid
      );
      
      return true;
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      throw error;
    }
  };

  // Verificar bloqueo por estado de pago
  useEffect(() => {
    const verificarBloqueo = async () => {
      if (!userProfile) {
        setBloqueado(false);
        setMotivoBloqueo('');
        return;
      }

      if (userProfile.role === 'supermax') {
        setBloqueado(false);
        setMotivoBloqueo('');
        return;
      }

      if (userProfile.role === 'max') {
        if (
          userProfile.activo === false ||
          userProfile.estadoPago === 'vencido' ||
          (userProfile.fechaVencimiento && userProfile.fechaVencimiento.toDate && new Date(userProfile.fechaVencimiento.toDate()) < new Date())
        ) {
          setBloqueado(true);
          setMotivoBloqueo('Tu suscripción está vencida o inactiva. Contacta al administrador para regularizar tu acceso.');
          return;
        }
      }

      if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
        const adminRef = doc(db, 'usuarios', userProfile.clienteAdminId);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const adminData = adminSnap.data();
          if (
            adminData.activo === false ||
            adminData.estadoPago === 'vencido' ||
            (adminData.fechaVencimiento && adminData.fechaVencimiento.toDate && new Date(adminData.fechaVencimiento.toDate()) < new Date())
          ) {
            setBloqueado(true);
            setMotivoBloqueo('El cliente administrador de tu cuenta tiene la suscripción vencida o inactiva. No puedes acceder al sistema.');
            return;
          }
        }
      }

      setBloqueado(false);
      setMotivoBloqueo('');
    };
    verificarBloqueo();
  }, [userProfile]);

  return {
    userProfile,
    setUserProfile,
    role,
    permisos,
    bloqueado,
    motivoBloqueo,
    createOrGetUserProfile,
    updateUserProfile
  };
};
