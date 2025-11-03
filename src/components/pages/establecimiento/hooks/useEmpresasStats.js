import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

/**
 * Hook para cargar estadísticas de empresas
 */
export const useEmpresasStats = (userEmpresas) => {
  const [empresasStats, setEmpresasStats] = useState({});

  const loadEmpresasStats = useCallback(async (empresas) => {
    const stats = {};
    
    for (const empresa of empresas) {
      try {
        const sucursalesSnapshot = await getDocs(query(collection(db, 'sucursales'), where('empresaId', '==', empresa.id)));
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

        const [empleadosSnapshot, capacitacionesSnapshot, accidentesSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'empleados'), where('sucursalId', 'in', sucursalesIds))),
          getDocs(query(collection(db, 'capacitaciones'), where('sucursalId', 'in', sucursalesIds))),
          getDocs(query(collection(db, 'accidentes'), where('sucursalId', 'in', sucursalesIds)))
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
        console.error(`Error cargando stats para empresa ${empresa.id}:`, error);
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
  }, []);

  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0) {
      loadEmpresasStats(userEmpresas);
    }
  }, [userEmpresas, loadEmpresasStats]);

  return { empresasStats, loadEmpresasStats };
};




