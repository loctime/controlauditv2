// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const useUserProfile = (firebaseUser) => {
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');

  // Leer perfil del usuario desde owner-centric
  // NO crea perfiles - solo lee desde apps/auditoria/owners/{ownerId}/usuarios/{userId}
  // Para operarios: ownerIdFromToken viene del token (custom claims)
  // Para admin: ownerIdFromToken es null, se usa firebaseUser.uid como ownerId
  // El auth debe validarse solo con custom claims + owner-centric user doc
  const getUserProfile = async (firebaseUser, ownerIdFromToken) => {
    // Resolver ownerId: operario usa token, admin usa su propio uid
    const resolvedOwnerId = ownerIdFromToken || firebaseUser.uid;

    try {
      // Limpiar estado previo para evitar perfiles colgados
      setUserProfile(null);
      setRole(null);
      
      // Leer SOLO desde owner-centric: apps/auditoria/owners/{ownerId}/usuarios/{userId}
      const userRef = doc(db, "apps", "auditoria", "owners", resolvedOwnerId, "usuarios", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log('[useUserProfile] Usuario no encontrado en owner-centric');
        return null;
      }

      const profileData = userSnap.data();
      
      // Validar que el role sea válido (admin u operario)
      if (profileData.role !== 'admin' && profileData.role !== 'operario') {
        console.error('[useUserProfile] ❌ Role inválido:', profileData.role);
        return null;
      }

      const cleanProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email,
        role: profileData.role,
        appId: profileData.appId || 'auditoria',
        createdAt: profileData.createdAt,
        ownerId: resolvedOwnerId,
        empresasAsignadas: profileData.empresasAsignadas || []
      };
      
      setUserProfile(cleanProfile);
      setRole(cleanProfile.role);
      return cleanProfile;
    } catch (error) {
      console.error("[useUserProfile] Error al leer perfil:", error);
      return null;
    }
  };

  // Actualizar perfil del usuario en owner-centric
  const updateUserProfile = async (updates) => {
    if (!userProfile?.ownerId) {
      console.error('[useUserProfile] ownerId no disponible');
      return false;
    }

    try {
      const userRef = doc(db, "apps", "auditoria", "owners", userProfile.ownerId, "usuarios", firebaseUser.uid);
      await updateDocWithAppId(userRef, updates);
      
      setUserProfile({ ...userProfile, ...updates });
      
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

  // Sincronizar role cuando userProfile cambia
  useEffect(() => {
    if (userProfile?.role && userProfile.role !== role) {
      setRole(userProfile.role);
    }
  }, [userProfile, role]);

  // Verificar bloqueo por estado del owner
  useEffect(() => {
    const verificarBloqueo = async () => {
      if (!userProfile) {
        setBloqueado(false);
        setMotivoBloqueo('');
        return;
      }

      // Admin: verificar su propio documento
      if (userProfile.role === 'admin') {
        const adminRef = doc(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'usuarios', userProfile.ownerId);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const adminData = adminSnap.data();
          if (
            adminData.activo === false ||
            adminData.estadoPago === 'vencido' ||
            (adminData.fechaVencimiento?.toDate && new Date(adminData.fechaVencimiento.toDate()) < new Date())
          ) {
            setBloqueado(true);
            setMotivoBloqueo('Tu suscripción está vencida o inactiva. Contacta al administrador para regularizar tu acceso.');
            return;
          }
        }
      }

      // Operario: verificar estado del owner
      if (userProfile.role === 'operario' && userProfile.ownerId) {
        const ownerRef = doc(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'usuarios', userProfile.ownerId);
        const ownerSnap = await getDoc(ownerRef);
        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          if (
            ownerData.activo === false ||
            ownerData.estadoPago === 'vencido' ||
            (ownerData.fechaVencimiento?.toDate && new Date(ownerData.fechaVencimiento.toDate()) < new Date())
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
    bloqueado,
    motivoBloqueo,
    getUserProfile,
    updateUserProfile
  };
};
