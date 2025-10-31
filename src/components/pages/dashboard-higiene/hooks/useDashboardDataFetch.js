import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

/**
 * Hook para cargar datos del dashboard de seguridad
 */
export const useDashboardDataFetch = (
  selectedEmpresa,
  selectedSucursal,
  selectedPeriodo,
  sucursalesFiltradas,
  calcularPeriodo
) => {
  const [empleados, setEmpleados] = useState([]);
  const [accidentes, setAccidentes] = useState([]);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos de empleados
  const cargarEmpleados = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      const empleadosRef = collection(db, 'empleados');
      let empleadosData = [];
      
      if (selectedSucursal === 'todas') {
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        if (sucursalesIds.length === 0) return [];
        
        const chunkSize = 10;
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
        
        empleadosData = empleadosData.sort((a, b) => {
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
        empleadosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return empleadosData;
    } catch (error) {
      console.error('Error cargando empleados:', error);
      return [];
    }
  }, [selectedSucursal, sucursalesFiltradas]);

  // Cargar datos de accidentes
  const cargarAccidentes = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedPeriodo);
      const accidentesRef = collection(db, 'accidentes');
      let accidentesData = [];
      
      if (selectedSucursal === 'todas') {
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        if (sucursalesIds.length === 0) return [];
        
        const chunkSize = 10;
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
        
        // Si inicio es null (histórico), no filtrar por fecha
        if (inicio) {
          accidentesData = accidentesData.filter(a => {
            const fecha = a.fechaHora?.toDate ? a.fechaHora.toDate() : new Date(0);
            return fecha >= inicio && fecha <= fin;
          });
        }
        
        accidentesData = accidentesData.sort((a, b) => {
          const fechaA = a.fechaHora?.toDate ? a.fechaHora.toDate() : new Date(0);
          const fechaB = b.fechaHora?.toDate ? b.fechaHora.toDate() : new Date(0);
          return fechaB - fechaA;
        });
      } else {
        // Si inicio es null (histórico), no filtrar por fecha
        if (inicio) {
          const q = query(
            accidentesRef,
            where('sucursalId', '==', selectedSucursal),
            where('fechaHora', '>=', inicio),
            where('fechaHora', '<=', fin),
            orderBy('fechaHora', 'desc')
          );
          const snapshot = await getDocs(q);
          accidentesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else {
          const q = query(
            accidentesRef,
            where('sucursalId', '==', selectedSucursal),
            orderBy('fechaHora', 'desc')
          );
          const snapshot = await getDocs(q);
          accidentesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
      }
      
      return accidentesData;
    } catch (error) {
      console.error('Error cargando accidentes:', error);
      return [];
    }
  }, [selectedSucursal, selectedPeriodo, calcularPeriodo, sucursalesFiltradas]);

  // Cargar datos de capacitaciones
  const cargarCapacitaciones = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedPeriodo);
      const capacitacionesRef = collection(db, 'capacitaciones');
      let capacitacionesData = [];
      
      if (selectedSucursal === 'todas') {
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        if (sucursalesIds.length === 0) return [];
        
        const chunkSize = 10;
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
        
        // Si inicio es null (histórico), no filtrar por fecha
        if (inicio) {
          capacitacionesData = capacitacionesData.filter(c => {
            const fecha = c.fechaRealizada?.toDate ? c.fechaRealizada.toDate() : new Date(0);
            return fecha >= inicio && fecha <= fin;
          });
        }
        
        capacitacionesData = capacitacionesData.sort((a, b) => {
          const fechaA = a.fechaRealizada?.toDate ? a.fechaRealizada.toDate() : new Date(0);
          const fechaB = b.fechaRealizada?.toDate ? b.fechaRealizada.toDate() : new Date(0);
          return fechaB - fechaA;
        });
      } else {
        // Si inicio es null (histórico), no filtrar por fecha
        if (inicio) {
          const q = query(
            capacitacionesRef,
            where('sucursalId', '==', selectedSucursal),
            where('fechaRealizada', '>=', inicio),
            where('fechaRealizada', '<=', fin),
            orderBy('fechaRealizada', 'desc')
          );
          const snapshot = await getDocs(q);
          capacitacionesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else {
          const q = query(
            capacitacionesRef,
            where('sucursalId', '==', selectedSucursal),
            orderBy('fechaRealizada', 'desc')
          );
          const snapshot = await getDocs(q);
          capacitacionesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
      }
      
      return capacitacionesData;
    } catch (error) {
      console.error('Error cargando capacitaciones:', error);
      return [];
    }
  }, [selectedSucursal, selectedPeriodo, calcularPeriodo, sucursalesFiltradas]);

  // Recargar datos cuando cambian los parámetros
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!selectedEmpresa || !selectedSucursal) {
        if (mounted) {
          setEmpleados([]);
          setAccidentes([]);
          setCapacitaciones([]);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }
      
      try {
        const [empleadosData, accidentesData, capacitacionesData] = await Promise.all([
          cargarEmpleados(),
          cargarAccidentes(),
          cargarCapacitaciones()
        ]);
        
        if (mounted) {
          setEmpleados(empleadosData);
          setAccidentes(accidentesData);
          setCapacitaciones(capacitacionesData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [selectedEmpresa, selectedSucursal, selectedPeriodo, cargarEmpleados, cargarAccidentes, cargarCapacitaciones]);

  // Función manual para recargar (opcional, para usar desde fuera)
  const recargarDatos = useCallback(async () => {
    if (!selectedEmpresa || !selectedSucursal) return;
    
    setLoading(true);
    try {
      const [empleadosData, accidentesData, capacitacionesData] = await Promise.all([
        cargarEmpleados(),
        cargarAccidentes(),
        cargarCapacitaciones()
      ]);
      
      setEmpleados(empleadosData);
      setAccidentes(accidentesData);
      setCapacitaciones(capacitacionesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresa, selectedSucursal, cargarEmpleados, cargarAccidentes, cargarCapacitaciones]);

  return { empleados, accidentes, capacitaciones, loading, recargarDatos };
};

