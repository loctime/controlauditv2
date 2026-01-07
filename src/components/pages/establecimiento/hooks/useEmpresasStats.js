import { useState, useEffect, useCallback } from 'react';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';

/**
 * Hook para cargar estadísticas de empresas (owner-centric)
 */
export const useEmpresasStats = (userEmpresas, ownerId = null) => {
  const [empresasStats, setEmpresasStats] = useState({});

  const loadEmpresasStats = useCallback(async (empresas, providedOwnerId = null) => {
    const ownerIdToUse = providedOwnerId || ownerId;
    if (!ownerIdToUse) {
      console.warn('⚠️ [useEmpresasStats] ownerId no proporcionado, retornando stats vacías');
      setEmpresasStats({});
      return;
    }

    const stats = {};
    
    for (const empresa of empresas) {
      try {
        // Las sucursales están en la colección del owner
        const ownerIdForEmpresa = empresa.ownerId || ownerIdToUse;
        const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerIdForEmpresa));
        
        console.log('[useEmpresasStats] Buscando sucursales para empresa', empresa.id, 'en path:', sucursalesRef.path);
        
        const sucursalesSnapshot = await getDocs(query(sucursalesRef, where('empresaId', '==', empresa.id)));
        const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
        
        if (sucursalesIds.length === 0) {
          stats[empresa.id] = {
            sucursales: 0,
            empleados: 0,
            capacitaciones: 0,
            capacitacionesCompletadas: 0,
            accidentes: 0,
            accidentesAbiertos: 0
          };
          continue;
        }

        // Empleados, capacitaciones y accidentes están en la colección del owner
        const [empleadosSnapshot, capacitacionesSnapshot, accidentesSnapshot] = await Promise.all([
          getDocs(query(collection(dbAudit, ...firestoreRoutesCore.empleados(ownerIdForEmpresa)), where('sucursalId', 'in', sucursalesIds))),
          getDocs(query(collection(dbAudit, ...firestoreRoutesCore.capacitaciones(ownerIdForEmpresa)), where('sucursalId', 'in', sucursalesIds))),
          getDocs(query(collection(dbAudit, ...firestoreRoutesCore.accidentes(ownerIdForEmpresa)), where('sucursalId', 'in', sucursalesIds)))
        ]);
        
        stats[empresa.id] = {
          sucursales: sucursalesIds.length,
          empleados: empleadosSnapshot.docs.length,
          capacitaciones: capacitacionesSnapshot.docs.length,
          capacitacionesCompletadas: capacitacionesSnapshot.docs.filter(doc => doc.data().estado === 'completada').length,
          accidentes: accidentesSnapshot.docs.length,
          accidentesAbiertos: accidentesSnapshot.docs.filter(doc => doc.data().estado === 'abierto').length
        };
      } catch (error) {
        console.error(`[useEmpresasStats] Error cargando stats para empresa ${empresa.id}:`, error);
        stats[empresa.id] = {
          sucursales: 0,
          empleados: 0,
          capacitaciones: 0,
          capacitacionesCompletadas: 0,
          accidentes: 0,
          accidentesAbiertos: 0
        };
      }
    }
    
    setEmpresasStats(stats);
  }, [ownerId]);

  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && ownerId) {
      loadEmpresasStats(userEmpresas);
    }
  }, [userEmpresas, ownerId, loadEmpresasStats]);

  return { empresasStats, loadEmpresasStats };
};





