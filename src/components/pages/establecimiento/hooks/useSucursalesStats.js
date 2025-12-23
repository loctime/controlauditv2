import { useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';

/**
 * Hook para cargar estadísticas de sucursales
 */
export const useSucursalesStats = () => {
  const [sucursalesStats, setSucursalesStats] = useState({});

  const loadSucursalesStats = useCallback(async (sucursalesList) => {
    const stats = {};
    for (const sucursal of sucursalesList) {
      try {
        const [empleadosSnapshot, capacitacionesSnapshot, planesSnapshot, accidentesSnapshot] = await Promise.all([
          getDocs(query(collection(dbAudit, 'empleados'), where('sucursalId', '==', sucursal.id))),
          getDocs(query(collection(dbAudit, 'capacitaciones'), where('sucursalId', '==', sucursal.id))),
          getDocs(query(collection(dbAudit, 'planes_capacitaciones_anuales'), where('sucursalId', '==', sucursal.id))),
          getDocs(query(collection(dbAudit, 'accidentes'), where('sucursalId', '==', sucursal.id)))
        ]);
        
        // Cargar acciones requeridas desde subcolección
        let accionesRequeridasCount = 0;
        try {
          const accionesSnapshot = await getDocs(collection(dbAudit, 'sucursales', sucursal.id, 'acciones_requeridas'));
          accionesRequeridasCount = accionesSnapshot.docs.length;
        } catch (error) {
          console.warn(`Error cargando acciones requeridas para sucursal ${sucursal.id}:`, error);
        }
        
        const capacitacionesData = capacitacionesSnapshot.docs.map(doc => doc.data());
        const capacitacionesCompletadas = capacitacionesData.filter(cap => cap.estado === 'completada').length;
        
        // Contar capacitaciones de planes anuales
        const planesData = planesSnapshot.docs.map(doc => doc.data());
        const capacitacionesDePlanes = planesData.reduce((total, plan) => total + (plan.capacitaciones?.length || 0), 0);
        
        stats[sucursal.id] = {
          empleados: empleadosSnapshot.docs.length,
          capacitaciones: capacitacionesSnapshot.docs.length + capacitacionesDePlanes,
          capacitacionesCompletadas: capacitacionesCompletadas,
          accidentes: accidentesSnapshot.docs.length,
          accidentesAbiertos: accidentesSnapshot.docs.filter(doc => doc.data().estado === 'abierto').length,
          accionesRequeridas: accionesRequeridasCount
        };
      } catch (error) {
        console.error(`Error cargando stats para sucursal ${sucursal.id}:`, error);
        stats[sucursal.id] = { 
          empleados: 0, 
          capacitaciones: 0, 
          capacitacionesCompletadas: 0, 
          accidentes: 0, 
          accidentesAbiertos: 0, 
          accionesRequeridas: 0 
        };
      }
    }
    setSucursalesStats(stats);
  }, []);

  return { sucursalesStats, loadSucursalesStats };
};
