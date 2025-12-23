import { useState, useEffect, useCallback } from 'react';
import { getDocs, query, where } from 'firebase/firestore';
import { auditUserCollection } from '../../../../firebaseControlFile';

/**
 * Hook para cargar estadísticas de empresas
 */
export const useEmpresasStats = (userEmpresas, userId = null) => {
  const [empresasStats, setEmpresasStats] = useState({});

  const loadEmpresasStats = useCallback(async (empresas, providedUserId = null) => {
    const uid = providedUserId || userId;
    if (!uid) {
      console.warn('⚠️ [useEmpresasStats] userId no proporcionado, retornando stats vacías');
      setEmpresasStats({});
      return;
    }

    const stats = {};
    
    for (const empresa of empresas) {
      try {
        // Las sucursales están en la colección del propietario de la empresa
        const propietarioId = empresa.propietarioId || uid;
        const sucursalesRef = auditUserCollection(propietarioId, 'sucursales');
        
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

        // Empleados, capacitaciones y accidentes están en la colección del propietario
        const [empleadosSnapshot, capacitacionesSnapshot, accidentesSnapshot] = await Promise.all([
          getDocs(query(auditUserCollection(propietarioId, 'empleados'), where('sucursalId', 'in', sucursalesIds))),
          getDocs(query(auditUserCollection(propietarioId, 'capacitaciones'), where('sucursalId', 'in', sucursalesIds))),
          getDocs(query(auditUserCollection(propietarioId, 'accidentes'), where('sucursalId', 'in', sucursalesIds)))
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
  }, [userId]);

  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && userId) {
      loadEmpresasStats(userEmpresas);
    }
  }, [userEmpresas, userId, loadEmpresasStats]);

  return { empresasStats, loadEmpresasStats };
};





