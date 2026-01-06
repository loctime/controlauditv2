// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { getUserRole } from '../config/admin';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { isEnvironment } from '../config/environment';
import { setDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';

export const useUserProfile = (firebaseUser) => {
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [permisos, setPermisos] = useState({});
  const [bloqueado, setBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');
  
  const isDev = isEnvironment('development');

  // Crear o obtener perfil del usuario
  const createOrGetUserProfile = async (firebaseUser) => {
    try {
      // ✅ FIX OBLIGATORIO #1: Bloquear admins - useUserProfile es solo para operarios
      const tokenRole = await firebaseUser.getIdTokenResult()
        .then(t => t.claims.role)
        .catch(() => null);

      if (tokenRole === 'max' || tokenRole === 'supermax') {
        console.warn('[SECURITY] createOrGetUserProfile bloqueado para admin');
        return null;
      }

      // Usar la colección: /apps/auditoria/users/{uid}
      const userRef = doc(db, "apps", "auditoria", "users", firebaseUser.uid);
      let userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profileData = userSnap.data();
        if (isDev) {
          console.log('[AUDIT] User profile loaded from /apps/auditoria/users');
        }
        
        // ✅ Solo usar identidad global desde /users
        // NO usar: ownerId, empresasAsignadas, permisos, clienteAdminId (vienen de owner-centric)
        const cleanProfile = {
          uid: profileData.uid,
          email: profileData.email,
          displayName: profileData.displayName,
          role: profileData.role || null,
          appId: profileData.appId,
          createdAt: profileData.createdAt
        };
        
        setUserProfile(cleanProfile);
        setRole(cleanProfile.role || null);
        setPermisos({}); // Permisos vienen de owner-centric, no de /users
        return cleanProfile;
      }

      // Si no existe por UID, buscar por email (puede ser que el documento tenga UID temporal)
      // Esto ocurre cuando el email ya existía en Auth (compartido con otras apps)
      // y se creó el documento en Firestore con un UID temporal
      if (firebaseUser.email) {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const usuariosRef = collection(db, "apps", "auditoria", "users");
        const emailQuery = query(usuariosRef, where("email", "==", firebaseUser.email));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          // Encontrado por email - migrar al UID real
          const tempUserDoc = emailSnapshot.docs[0];
          const tempUserData = tempUserDoc.data();
          
          if (isDev) {
            console.log('[AUDIT] User profile found by email, migrating to real UID');
            console.log('[AUDIT] Temp UID:', tempUserDoc.id, 'Real UID:', firebaseUser.uid);
          }
          
          // ✅ Crear documento con UID real - SOLO identidad global
          // NO guardar: ownerId, empresasAsignadas, permisos, clienteAdminId (vienen de owner-centric)
          const migratedProfile = {
            uid: firebaseUser.uid,
            email: tempUserData.email || firebaseUser.email,
            displayName: tempUserData.displayName || firebaseUser.displayName || firebaseUser.email,
            role: tempUserData.role || getUserRole(firebaseUser.email),
            appId: 'auditoria',
            createdAt: serverTimestamp()
          };
          
          await setDocWithAppId(userRef, migratedProfile);
          
          // Eliminar documento temporal si el UID es diferente
          if (tempUserDoc.id !== firebaseUser.uid) {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(tempUserDoc.ref);
            if (isDev) {
              console.log('[AUDIT] Temporary document deleted:', tempUserDoc.id);
            }
          }
          
          setUserProfile(migratedProfile);
          setRole(migratedProfile.role || null);
          setPermisos({}); // Permisos vienen de owner-centric, no de /users
          return migratedProfile;
        }
      }

      // Si no existe, crear nuevo perfil
      if (isDev) {
        console.log('[AUDIT] User profile not found, creating in /apps/auditoria/users');
      }
      
      // ✅ Crear perfil SOLO con identidad global
      // NO guardar: ownerId, empresasAsignadas, permisos, clienteAdminId (vienen de owner-centric)
      const newProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email,
        createdAt: serverTimestamp(),
        appId: 'auditoria',
        role: getUserRole(firebaseUser.email)
        // ❌ NO incluir: clienteAdminId, empresas, auditorias, permisos, configuracion
        // Estos campos pertenecen a owner-centric, no a /users
      };

      await setDocWithAppId(userRef, newProfile);
      if (isDev) {
        console.log('[AUDIT] User profile created in /apps/auditoria/users');
      }
      
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
      // ✅ FIX OBLIGATORIO #2: Bloquear admins - no se actualizan en /users
      if (userProfile?.role === 'max' || userProfile?.role === 'supermax') {
        console.warn('[SECURITY] updateUserProfile bloqueado para admin');
        return false;
      }

      const userRef = doc(db, "apps", "auditoria", "users", firebaseUser.uid);
      await updateDocWithAppId(userRef, updates);
      
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

  // Sincronizar role y permisos cuando userProfile cambia (para admins que no pasan por createOrGetUserProfile)
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role && userProfile.role !== role) {
        setRole(userProfile.role);
      }
      if (userProfile.permisos && JSON.stringify(userProfile.permisos) !== JSON.stringify(permisos)) {
        setPermisos(userProfile.permisos || {});
      }
    }
  }, [userProfile, role, permisos]);

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

      // ✅ FIX OBLIGATORIO #3: Consultar owner desde owner-centric, no desde /users
      if (userProfile.role === 'operario' && userProfile.ownerId) {
        const adminRef = doc(db, 'apps', 'auditoria', 'owners', userProfile.ownerId);
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
