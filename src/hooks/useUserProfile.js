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

  // Crear o obtener perfil del usuario desde owner-centric
  const createOrGetUserProfile = async (firebaseUser, ownerIdFromToken = null) => {
    try {
      // ✅ CRÍTICO: Para operarios, ownerId DEBE venir del token (custom claims)
      if (!ownerIdFromToken) {
        console.error('[useUserProfile] ❌ ownerId no proporcionado desde token claims');
        return null;
      }

      // Leer perfil desde owner-centric: apps/auditoria/owners/{ownerId}/usuarios/{userId}
      const userRef = doc(db, "apps", "auditoria", "owners", ownerIdFromToken, "usuarios", firebaseUser.uid);
      let userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profileData = userSnap.data();
        if (isDev) {
          console.log('[AUDIT] User profile loaded from owner-centric');
        }
        
        const cleanProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          role: profileData.role || null,
          appId: profileData.appId || 'auditoria',
          createdAt: profileData.createdAt,
          ownerId: ownerIdFromToken, // Usar ownerId del token
          empresasAsignadas: profileData.empresasAsignadas || []
        };
        
        setUserProfile(cleanProfile);
        setRole(cleanProfile.role || null);
        setPermisos({});
        return cleanProfile;
      }

      // Si no existe, el operario aún no ha sido creado por el admin
      // Retornar null para que el sistema maneje el error
      if (isDev) {
        console.log('[AUDIT] User profile not found in owner-centric - operario no creado aún');
      }
      
      return null;
    } catch (error) {
      console.error("Error al crear/obtener perfil de usuario:", error);
      return null;
    }
  };

  // Actualizar perfil del usuario (solo para operarios en owner-centric)
  const updateUserProfile = async (updates) => {
    try {
      if (!userProfile?.ownerId) {
        console.error('[useUserProfile] ownerId no disponible para actualizar perfil');
        return false;
      }

      const userRef = doc(db, "apps", "auditoria", "owners", userProfile.ownerId, "usuarios", firebaseUser.uid);
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

      // Verificar estado del owner para operarios
      if (userProfile.role === 'operario' && userProfile.ownerId) {
        // Leer documento del owner desde owner-centric
        const ownerUserRef = doc(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'usuarios', userProfile.ownerId);
        const ownerSnap = await getDoc(ownerUserRef);
        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          if (
            ownerData.activo === false ||
            ownerData.estadoPago === 'vencido' ||
            (ownerData.fechaVencimiento && ownerData.fechaVencimiento.toDate && new Date(ownerData.fechaVencimiento.toDate()) < new Date())
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
