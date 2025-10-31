import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

/**
 * Hook para cargar datos del dashboard de seguridad
 */
export const useDashboardData = (selectedEmpresa, selectedSucursal, selectedPeriodo, sucursalesFiltradas, calcularPeriodo) => {
  const [datos, setDatos] = useState({
    empleados: [],
    accidentes: [],
    capacitaciones: []
  });
  const [loading, setLoading] = useState(false);

  // Cargar datos de empleados
  const cargarEmpleados = useCallback(async () => {
    if (!selectedSucursal || !selectedEmpresa) return [];

    try {
      const empleadosRef = collection(db, 'empleados');
      let empleados = [];
      
      if (selectedSucursal === 'todas') {
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        if (sucursalesIds.length === 0) return [];
        
        const chunkSize = 10;
        const empleadosData = [];
        
        for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
          const chunk = sucursalesIds.slice(i, i + chunkSize);
          const snapshot = await getDocs(
            query(empleadosRef, where('sucursalId', 'in', chunk))
          );
          empleadosData.push(...snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
        
        empleados = empleadosData.sort((a, b) => {
          const fechaA = a.fechaIngreso?.toDate ? a.fechaIngreso.toDate() : new Date(0);
          const fechaB = b.fechaIngreso?.toDate ? b.fechaIngreso.toDate() : new Date(0);
          return fechaB - fechaA;
        });
      } else {
        const q = query(
          empleadosRef,
          where('sucursalId', '==', selectedSucursal),
          orderBy('fechaIngreso', 'desc')
        );
        const snapshot = await getDocs(q);
        empleados = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return empleados;
    } catch (error) {
      console.error('Error cargando empleados:', error);
      return [];
    }
  }, [selectedSucursal, selectedEmpresa, sucursalesFiltradas]);

  // Cargar datos de accidentes
  const cargarAccidentes = useCallback(async () => {
    if (!selectedSucursal || !selectedEmpresa) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedPeriodo);
      const accidentesRef = collection(db, 'accidentes');
      let accidentes = [];
      
      if (selectedSucursal === 'todas') {
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        if (sucursalesIds.length === 0) return [];
        
        const chunkSize = 10;
        const accidentesData = [];
        
        for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
          const chunk = sucursalesIds.slice(i, i + chunkSize);
          const snapshot = await getDocs(
            query(accidentesRef, where('sucursalId', 'in', chunk))
          );
          accidentesData.push(...snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
        
        accidentes = accidentesData.filter(a => {
          const fecha = a.fechaHora?.toDate ? a.fechaHora.toDate() : new Date(0);
          return fecha >= inicio && fecha <= fin;
        });
        accidentes.sort((a, b) => {
          const fechaA = a.fechaHora?.toDate ? a.fechaHora.toDate() : new Date(0);
          const fechaB = b.fechaHora?.toDate ? b.fechaHora.toDate() : new Date(0);
          return fechaB - fechaA;
        });
      } else {
        const q = query(
          accidentesRef,
          where('sucursalId', '==', selectedSucursal),
          where('fechaHora', '>=', inicio),
          where('fechaHora', '<=', fin),
          orderBy('fechaHora', 'desc')
        );
        const snapshot = await getDocs(q);
        accidentes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return accidentes;
    } catch (error) {
      console.error('Error cargando accidentes:', error);
      return [];
    }
  }, [selectedSucursal, selectedEmpresa, selectedPeriodo, calcularPeriodo, sucursalesFiltradas]);

  // Cargar datos de capacitaciones
  const cargarCapacitaciones = useCallback(async () => {
    if (!selectedSucursal || !selectedEmpresa) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedPeriodo);
      const capacitacionesRef = collection(db, 'capacitaciones');
      let capacitaciones = [];
      
      if (selectedSucursal === 'todas') {
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        if (sucursalesIds.length === 0) return [];
        
        const chunkSize = 10;
        const capacitacionesData = [];
        
        for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
          const chunk = sucursalesIds.slice(i, i + chunkSize);
          const snapshot = await getDocs(
            query(capacitacionesRef, where('sucursalId', 'in', chunk))
          );
          capacitacionesData.push(...snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
        
        capacitaciones = capacitacionesData.filter(c => {
          const fecha = c.fechaRealizada?.toDate ? c.fechaRealizada.toDate() : new Date(0);
          return fecha >= inicio && fecha <= fin;
        });
        capacitaciones.sort((a, b) => {
          const fechaA = a.fechaRealizada?.toDate ? a.fechaRealizada.toDate() : new Date(0);
          const fechaB = b.fechaRealizada?.toDate ? b.fechaRealizada.toDate() : new Date(0);
          return fechaB - fechaA;
        });
      } else {
        const q = query(
          capacitacionesRef,
          where('sucursalId', '==', selectedSucursal),
          where('fechaRealizada', '>=', inicio),
          where('fechaRealizada', '<=', fin),
          orderBy('fechaRealizada', 'desc')
        );
        const snapshot = await getDocs(q);
        capacitaciones = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return capacitaciones;
    } catch (error) {
      console.error('Error cargando capacitaciones:', error);
      return [];
    }
  }, [selectedSucursal, selectedEmpresa, selectedPeriodo, calcularPeriodo, sucursalesFiltradas]);

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    if (!selectedEmpresa || !selectedSucursal) {
      setDatos({ empleados: [], accidentes: [], capacitaciones: [] });
      return;
    }

    setLoading(true);
    
    try {
      const [empleados, accidentes, capacitaciones] = await Promise.all([
        cargarEmpleados(),
        cargarAccidentes(),
        cargarCapacitaciones()
      ]);

      setDatos({ empleados, accidentes, capacitaciones });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresa, selectedSucursal, cargarEmpleados, cargarAccidentes, cargarCapacitaciones]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return { datos, loading };
};

