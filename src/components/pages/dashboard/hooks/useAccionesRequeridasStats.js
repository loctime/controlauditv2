import { useState, useEffect } from 'react';
import AccionesRequeridasService from '../../../../services/accionesRequeridasService';
import { useAuth } from '@/components/context/AuthContext';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import { doc, collection } from 'firebase/firestore';

export const useAccionesRequeridasStats = (sucursales, selectedSucursal) => {
  const { userProfile } = useAuth();
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const cargarEstadisticas = async () => {
      if (!sucursales || sucursales.length === 0) {
        if (isMounted) {
          setEstadisticas({});
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
      }

      try {
        let sucursalesACalcular = sucursales;
        if (selectedSucursal && selectedSucursal !== 'todas') {
          sucursalesACalcular = sucursales.filter((s) => s.id === selectedSucursal);
        }

        if (sucursalesACalcular.length === 0) {
          if (isMounted) {
            setEstadisticas({});
            setLoading(false);
          }
          return;
        }

        const estadisticasPorSucursal = {};
        let totalPendientes = 0;
        let totalVencidas = 0;
        let totalCompletadas = 0;
        let totalEnProceso = 0;
        let totalCanceladas = 0;

        for (const sucursal of sucursalesACalcular) {
          try {
            if (!userProfile?.ownerId) {
              throw new Error('ownerId no disponible');
            }
            const ownerId = userProfile.ownerId;
            const sucursalDocRef = doc(dbAudit, ...firestoreRoutesCore.sucursal(ownerId, sucursal.id));
            const accionesCollectionRef = collection(sucursalDocRef, 'acciones_requeridas');
            
            const stats = await AccionesRequeridasService.obtenerEstadisticas(accionesCollectionRef);
            estadisticasPorSucursal[sucursal.id] = stats;
            totalPendientes += stats.pendientes;
            totalVencidas += stats.vencidas;
            totalCompletadas += stats.completadas;
            totalEnProceso += stats.enProceso;
            totalCanceladas += stats.canceladas;
          } catch (error) {
            console.warn(`Error cargando estadísticas para sucursal ${sucursal.id}:`, error);
            estadisticasPorSucursal[sucursal.id] = {
              total: 0,
              pendientes: 0,
              enProceso: 0,
              completadas: 0,
              canceladas: 0,
              vencidas: 0
            };
          }
        }

        if (isMounted) {
          setEstadisticas({
            total: totalPendientes + totalEnProceso + totalCompletadas + totalCanceladas,
            pendientes: totalPendientes,
            enProceso: totalEnProceso,
            completadas: totalCompletadas,
            canceladas: totalCanceladas,
            vencidas: totalVencidas,
            porSucursal: estadisticasPorSucursal
          });
        }
      } catch (error) {
        console.error('Error cargando estadísticas de acciones requeridas:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    cargarEstadisticas();

    return () => {
      isMounted = false;
    };
  }, [sucursales, selectedSucursal, userProfile?.ownerId]);

  return { estadisticas, loading };
};

