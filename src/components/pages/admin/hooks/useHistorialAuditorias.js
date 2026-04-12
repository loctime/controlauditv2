import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';

export const useHistorialAuditorias = (año = new Date().getFullYear()) => {
  const { userProfile } = useAuth();
  const [historial, setHistorial] = useState({});
  // estructura: { [sucursalId]: { [mes_1_a_12]: number } }
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.ownerId) return;
    cargarHistorial();
  }, [userProfile?.ownerId, año]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const ownerId = userProfile.ownerId;

      // 1. Cargar sucursales
      const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));
      const sucursalesSnap = await getDocs(sucursalesRef);
      const sucursalesData = sucursalesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSucursales(sucursalesData);

      // 2. Cargar todos los reportes del año
      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));
      const inicioAño = new Date(año, 0, 1);
      const finAño = new Date(año, 11, 31, 23, 59, 59, 999);
      const reportesSnap = await getDocs(reportesRef);

      const reportes = reportesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => {
          const fechaRef = r.fechaCreacion || r.timestamp || r.fecha;
          if (!fechaRef) return false;
          const fecha = fechaRef?.toDate ? fechaRef.toDate() : new Date(fechaRef);
          return fecha >= inicioAño && fecha <= finAño && r.estado !== 'cancelada';
        });

      // 3. Agrupar por sucursal y mes
      const resultado = {};
      sucursalesData.forEach(suc => {
        resultado[suc.id] = {};
        for (let m = 1; m <= 12; m++) resultado[suc.id][m] = 0;
      });

      reportes.forEach(r => {
        const sucursalId = r.sucursalId;
        if (!sucursalId || !resultado[sucursalId]) return;

        const fechaRef = r.fechaCreacion || r.timestamp || r.fecha;
        const fecha = fechaRef?.toDate ? fechaRef.toDate() : new Date(fechaRef);
        const mes = fecha.getMonth() + 1; // 1-12

        resultado[sucursalId][mes] = (resultado[sucursalId][mes] || 0) + 1;
      });

      setHistorial(resultado);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  return { historial, sucursales, loading };
};
