import { useState, useEffect, useCallback } from 'react';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';

/**
 * Normaliza una capacitación unificando campos legacy
 * Preserva todos los campos originales
 */
const normalizeCapacitacion = (doc) => ({
  id: doc.id,
  ...doc.data(),
  fechaCreacion: doc.data().fechaCreacion ?? doc.data().createdAt ?? null,
  activa: doc.data().activa ?? true,
});

/**
 * Normaliza un plan anual unificando campos legacy
 * Preserva todos los campos originales
 */
const normalizePlanAnual = (doc) => ({
  id: doc.id,
  ...doc.data(),
  fechaCreacion: doc.data().fechaCreacion ?? doc.data().createdAt ?? null,
  activa: doc.data().activa ?? true,
});

/**
 * Hook para cargar capacitaciones individuales y planes anuales
 * Optimizado con cleanup patterns y carga paralela
 * Usa arquitectura owner-centric: apps/auditoria/owners/{ownerId}/{coleccion}
 */
export const useCapacitacionesData = (selectedEmpresa, selectedSucursal, sucursalesDisponibles, empresasCargadas) => {
  const { userProfile } = useAuth();
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [planesAnuales, setPlanesAnuales] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCapacitaciones = useCallback(async () => {
    if (!userProfile?.ownerId) return;

    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        setLoading(true);
      }

      try {
        const ownerId = userProfile.ownerId;

        // Cargar capacitaciones individuales desde arquitectura owner-centric
        // NO se aplican filtros por identidad - solo filtros funcionales de UI
        const capacitacionesRef = collection(dbAudit, ...firestoreRoutesCore.capacitaciones(ownerId));
        let qCap;
        
        if (selectedSucursal) {
          // Filtro funcional: solo por sucursal
          qCap = query(capacitacionesRef, where('sucursalId', '==', selectedSucursal));
        } else if (selectedEmpresa && sucursalesDisponibles && sucursalesDisponibles.length > 0) {
          // Filtro funcional: solo por empresa
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
          
          // Usar 'in' para múltiples sucursales (máximo 10)
          const chunkSize = 10;
          const capacitacionesData = [];
          
          for (let i = 0; i < sucursalesEmpresa.length; i += chunkSize) {
            const chunk = sucursalesEmpresa.slice(i, i + chunkSize);
            const chunkQuery = query(capacitacionesRef, where('sucursalId', 'in', chunk));
            const chunkSnapshot = await getDocs(chunkQuery);
            chunkSnapshot.docs.forEach(doc => {
              capacitacionesData.push({
                ...normalizeCapacitacion(doc),
                tipo: 'individual'
              });
            });
          }
          
          // Ordenar por fecha más reciente
          capacitacionesData.sort((a, b) => {
            const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada);
            const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada);
            return dateB - dateA;
          });

          // Cargar planes anuales
          await loadPlanesAnuales(ownerId, mounted);

          if (mounted) {
            setCapacitaciones(capacitacionesData);
            setLoading(false);
          }
          return;
        } else {
          // Sin filtros funcionales: cargar todas las capacitaciones del usuario
          qCap = capacitacionesRef;
        }
        
        const snapshotCap = await getDocs(qCap);
        const capacitacionesData = snapshotCap.docs.map(doc => ({
          ...normalizeCapacitacion(doc),
          tipo: 'individual'
        }));
        
        // Ordenar por fecha más reciente
        capacitacionesData.sort((a, b) => {
          const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada);
          const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada);
          return dateB - dateA;
        });

        // Cargar planes anuales
        await loadPlanesAnuales(userId, mounted);

        if (mounted) {
          setCapacitaciones(capacitacionesData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const loadPlanesAnuales = async (ownerId, mounted) => {
      try {
        // Cargar planes anuales desde arquitectura owner-centric
        const planesRef = collection(dbAudit, ...firestoreRoutesCore.planesCapacitacionesAnuales(ownerId));
        let planesQ;
        
        // Solo filtros funcionales: empresa, sucursal, año
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
          ...normalizePlanAnual(doc),
          tipo: 'plan_anual'
        }));

        if (mounted) {
          setPlanesAnuales(planesData);
        }
      } catch (error) {
        console.error('Error al cargar planes anuales:', error);
        if (mounted) {
          setPlanesAnuales([]);
        }
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [selectedEmpresa, selectedSucursal, sucursalesDisponibles, userProfile?.ownerId]);

  useEffect(() => {
    if (userProfile?.ownerId) {
      loadCapacitaciones();
    }
  }, [loadCapacitaciones, userProfile?.ownerId]);

  return { capacitaciones, planesAnuales, loading, recargarDatos: loadCapacitaciones };
};

