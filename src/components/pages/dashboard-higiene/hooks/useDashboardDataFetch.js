import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebaseAudit.js';

/**
 * Hook para cargar datos del dashboard de seguridad
 */
export const useDashboardDataFetch = (
  selectedEmpresa,
  selectedSucursal,
  selectedYear,
  sucursalesFiltradas,
  calcularPeriodo,
  empresasDisponibles
) => {
  const [empleados, setEmpleados] = useState([]);
  const [accidentes, setAccidentes] = useState([]);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [ausencias, setAusencias] = useState([]);
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
      const { inicio, fin } = calcularPeriodo(selectedYear);
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
  }, [selectedSucursal, selectedYear, calcularPeriodo, sucursalesFiltradas]);

  // Cargar datos de ausencias de salud ocupacional
  const cargarAusencias = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedYear);
      const ausenciasRef = collection(db, 'ausencias');
      let ausenciasData = [];

      const overlapsPeriodo = (ausencia) => {
        const parseDate = (valor) => {
          if (!valor) return null;
          if (valor?.toDate) {
            try {
              return valor.toDate();
            } catch (error) {
              return null;
            }
          }
          const parsed = new Date(valor);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const fechaInicio =
          parseDate(ausencia.fechaInicio || ausencia.inicio || ausencia.fecha) ||
          parseDate(ausencia.createdAt);
        const fechaFin = parseDate(
          ausencia.fechaFin || ausencia.fin || ausencia.fechaCierre
        );

        if (!fechaInicio) return false;

        const cierre = fechaFin || new Date();

        if (inicio && cierre < inicio) return false;
        if (fin && fechaInicio > fin) return false;

        return true;
      };

      if (selectedSucursal === 'todas') {
        const sucursalesIds = (sucursalesFiltradas || [])
          .map((s) => s.id)
          .filter(Boolean);
        if (sucursalesIds.length === 0) return [];

        const chunkSize = 10;
        for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
          const chunk = sucursalesIds.slice(i, i + chunkSize);
          const snapshot = await getDocs(
            query(ausenciasRef, where('sucursalId', 'in', chunk))
          );
          snapshot.forEach((docSnapshot) => {
            ausenciasData.push({
              id: docSnapshot.id,
              ...docSnapshot.data()
            });
          });
        }
      } else {
        const q = query(
          ausenciasRef,
          where('sucursalId', '==', selectedSucursal)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnapshot) => {
          ausenciasData.push({
            id: docSnapshot.id,
            ...docSnapshot.data()
          });
        });
      }

      if (inicio || fin) {
        ausenciasData = ausenciasData.filter(overlapsPeriodo);
      }

      ausenciasData.sort((a, b) => {
        const parseDate = (valor) => {
          if (!valor) return 0;
          if (valor?.toDate) {
            try {
              return valor.toDate().getTime();
            } catch (error) {
              return 0;
            }
          }
          const parsed = new Date(valor).getTime();
          return Number.isNaN(parsed) ? 0 : parsed;
        };

        return parseDate(b.fechaInicio || b.inicio) - parseDate(a.fechaInicio || a.inicio);
      });

      return ausenciasData;
    } catch (error) {
      console.error('Error cargando ausencias:', error);
      return [];
    }
  }, [selectedSucursal, selectedYear, calcularPeriodo, sucursalesFiltradas]);

  // Cargar datos de capacitaciones
  const cargarCapacitaciones = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedYear);
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
  }, [selectedSucursal, selectedYear, calcularPeriodo, sucursalesFiltradas]);

  // Cargar datos de auditorías
  const cargarAuditorias = useCallback(async () => {
    if (!selectedEmpresa || !selectedSucursal) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedYear);
      const auditoriasRef = collection(db, 'auditorias');
      let auditoriasData = [];

      const empresasIds = selectedEmpresa === 'todas'
        ? [...new Set([
            ...(sucursalesFiltradas || []).map(s => s.empresaId).filter(Boolean),
            ...(empresasDisponibles || []).map(e => e.id).filter(Boolean)
          ])]
        : [selectedEmpresa];

      if (empresasIds.length === 0) return [];

      const fetchAuditoriasByEmpresa = async (empresaId) => {
        try {
          const baseQuery = query(auditoriasRef, where('empresaId', '==', empresaId));
          const snapshot = await getDocs(baseQuery);

          if (!snapshot.empty) {
            snapshot.forEach(doc => {
              auditoriasData.push({
                id: doc.id,
                ...doc.data()
              });
            });
          } else {
            // Fallback a campo legacy `empresa`
            const empresaNombre =
              sucursalesFiltradas?.find(s => s.empresaId === empresaId)?.empresaNombre ||
              empresasDisponibles?.find(e => e.id === empresaId)?.nombre;
            if (empresaNombre) {
              const fallbackQuery = query(auditoriasRef, where('empresa', '==', empresaNombre));
              const fallbackSnapshot = await getDocs(fallbackQuery);
              fallbackSnapshot.forEach(doc => {
                auditoriasData.push({
                  id: doc.id,
                  ...doc.data()
                });
              });
            }
          }
        } catch (error) {
          console.warn('Error consultando auditorías para empresa', empresaId, error);
        }
      };

      for (const empresaId of empresasIds) {
        await fetchAuditoriasByEmpresa(empresaId);
      }

      // Filtrar por sucursal seleccionada
      let auditoriasFiltradas = auditoriasData;
      if (selectedSucursal !== 'todas') {
        const sucursalSeleccionada = sucursalesFiltradas?.find(s => s.id === selectedSucursal);
        const sucursalNombre = sucursalSeleccionada?.nombre;

        auditoriasFiltradas = auditoriasFiltradas.filter(auditoria => {
          if (auditoria.sucursalId) {
            return auditoria.sucursalId === selectedSucursal;
          }
          if (sucursalNombre) {
            return auditoria.sucursal?.toLowerCase?.() === sucursalNombre.toLowerCase();
          }
          return true;
        });
      }

      // Filtrar por período seleccionado
      if (inicio) {
        auditoriasFiltradas = auditoriasFiltradas.filter(auditoria => {
          const fechaReferencia = auditoria.fechaCreacion || auditoria.fecha || auditoria.timestamp;
          if (!fechaReferencia) return false;
          const fecha = fechaReferencia?.toDate ? fechaReferencia.toDate() : new Date(fechaReferencia);
          return fecha >= inicio && fecha <= fin;
        });
      }

      auditoriasFiltradas.sort((a, b) => {
        const fechaARef = a.fechaCreacion || a.fecha || a.timestamp;
        const fechaBRef = b.fechaCreacion || b.fecha || b.timestamp;
        const fechaA = fechaARef?.toDate ? fechaARef.toDate() : new Date(fechaARef || 0);
        const fechaB = fechaBRef?.toDate ? fechaBRef.toDate() : new Date(fechaBRef || 0);
        return fechaB - fechaA;
      });

      return auditoriasFiltradas;
    } catch (error) {
      console.error('Error cargando auditorías:', error);
      return [];
    }
  }, [selectedEmpresa, selectedSucursal, selectedYear, calcularPeriodo, sucursalesFiltradas, empresasDisponibles]);

  // Memoizar IDs de sucursales para estabilizar dependencias
  const sucursalesIdsString = useMemo(() => 
    JSON.stringify(sucursalesFiltradas?.map(s => s.id).sort() || []),
    [sucursalesFiltradas]
  );

  // Recargar datos cuando cambian los parámetros
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!selectedEmpresa || !selectedSucursal) {
        if (mounted) {
          setEmpleados([]);
          setAccidentes([]);
          setCapacitaciones([]);
          setAuditorias([]);
          setAusencias([]);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }
      
      try {
        const [
          empleadosData,
          accidentesData,
          capacitacionesData,
          auditoriasData,
          ausenciasData
        ] = await Promise.all([
          cargarEmpleados(),
          cargarAccidentes(),
          cargarCapacitaciones(),
          cargarAuditorias(),
          cargarAusencias()
        ]);
        
        if (mounted) {
          setEmpleados(empleadosData);
          setAccidentes(accidentesData);
          setCapacitaciones(capacitacionesData);
          setAuditorias(auditoriasData);
          setAusencias(ausenciasData);
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
  }, [selectedEmpresa, selectedSucursal, selectedYear, sucursalesIdsString, cargarEmpleados, cargarAccidentes, cargarCapacitaciones, cargarAuditorias, cargarAusencias]);

  // Función manual para recargar (opcional, para usar desde fuera)
  const recargarDatos = useCallback(async () => {
    if (!selectedEmpresa || !selectedSucursal) return;
    
    setLoading(true);
    try {
      const [
        empleadosData,
        accidentesData,
        capacitacionesData,
        auditoriasData,
        ausenciasData
      ] = await Promise.all([
        cargarEmpleados(),
        cargarAccidentes(),
        cargarCapacitaciones(),
        cargarAuditorias(),
        cargarAusencias()
      ]);
      
      setEmpleados(empleadosData);
      setAccidentes(accidentesData);
      setCapacitaciones(capacitacionesData);
      setAuditorias(auditoriasData);
      setAusencias(ausenciasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresa, selectedSucursal, cargarEmpleados, cargarAccidentes, cargarCapacitaciones, cargarAuditorias, cargarAusencias]);

  return { empleados, accidentes, capacitaciones, auditorias, ausencias, loading, recargarDatos };
};

