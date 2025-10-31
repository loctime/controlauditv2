import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

/**
 * Hook para cargar capacitaciones individuales y planes anuales
 * Optimizado con cleanup patterns y carga paralela
 */
export const useCapacitacionesData = (selectedEmpresa, selectedSucursal, sucursalesDisponibles, empresasCargadas) => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [planesAnuales, setPlanesAnuales] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCapacitaciones = useCallback(async () => {
    if (!empresasCargadas) return;

    let mounted = true;

    const loadData = async () => {
      if (!sucursalesDisponibles || sucursalesDisponibles.length === 0) {
        if (mounted) {
          setCapacitaciones([]);
          setPlanesAnuales([]);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }

      try {
        // Cargar capacitaciones individuales
        const capacitacionesRef = collection(db, 'capacitaciones');
        let qCap;
        
        if (selectedSucursal) {
          qCap = query(capacitacionesRef, where('sucursalId', '==', selectedSucursal));
        } else if (selectedEmpresa) {
          const sucursalesEmpresa = sucursalesDisponibles
            .filter(s => s.empresaId === selectedEmpresa)
            .map(s => s.id);
          
          if (sucursalesEmpresa.length === 0) {
            if (mounted) {
              setCapacitaciones([]);
              setPlanesAnuales([]);
              setLoading(false);
            }
            return;
          }
          
          qCap = query(capacitacionesRef, where('sucursalId', 'in', sucursalesEmpresa));
        } else {
          qCap = capacitacionesRef;
        }
        
        const snapshotCap = await getDocs(qCap);
        const capacitacionesData = snapshotCap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          tipo: 'individual'
        }));
        
        // Ordenar por fecha más reciente
        capacitacionesData.sort((a, b) => {
          const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada);
          const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada);
          return dateB - dateA;
        });

        // Cargar planes anuales
        const planesRef = collection(db, 'planes_capacitaciones_anuales');
        let planesQ;
        
        if (selectedSucursal) {
          planesQ = query(
            planesRef, 
            where('sucursalId', '==', selectedSucursal),
            where('año', '==', new Date().getFullYear())
          );
        } else if (selectedEmpresa) {
          planesQ = query(
            planesRef,
            where('empresaId', '==', selectedEmpresa),
            where('año', '==', new Date().getFullYear())
          );
        } else {
          planesQ = query(planesRef, where('año', '==', new Date().getFullYear()));
        }
        
        const planesSnapshot = await getDocs(planesQ);
        const planesData = planesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          tipo: 'plan_anual'
        }));

        if (mounted) {
          setCapacitaciones(capacitacionesData);
          setPlanesAnuales(planesData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [selectedEmpresa, selectedSucursal, sucursalesDisponibles, empresasCargadas]);

  useEffect(() => {
    if (sucursalesDisponibles && sucursalesDisponibles.length > 0) {
      loadCapacitaciones();
    }
  }, [sucursalesDisponibles, loadCapacitaciones]);

  return { capacitaciones, planesAnuales, loading, recargarDatos: loadCapacitaciones };
};

