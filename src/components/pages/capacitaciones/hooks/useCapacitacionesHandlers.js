import { useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

/**
 * Hook para manejar las acciones de capacitaciones
 */
export const useCapacitacionesHandlers = (userProfile, recargarDatos, navigate) => {
  const handleRegistrarAsistencia = useCallback((capacitacionId) => {
    navigate(`/capacitacion/${capacitacionId}/asistencia`);
  }, [navigate]);

  const handleMarcarCompletada = useCallback(async (capacitacionId) => {
    if (window.confirm('¿Marcar esta capacitación como completada?')) {
      try {
        await updateDoc(doc(db, 'capacitaciones', capacitacionId), {
          estado: 'completada',
          updatedAt: Timestamp.now()
        });
        recargarDatos();
      } catch (error) {
        console.error('Error al marcar completada:', error);
        alert('Error al actualizar la capacitación');
      }
    }
  }, [recargarDatos]);

  const handleDuplicar = useCallback(async (capacitacion) => {
    if (window.confirm(`¿Crear nueva instancia de "${capacitacion.nombre}"?`)) {
      try {
        const nuevaCapacitacion = {
          ...capacitacion,
          estado: 'activa',
          empleados: [],
          fechaRealizada: Timestamp.now(),
          createdAt: Timestamp.now(),
          createdBy: userProfile?.uid
        };
        delete nuevaCapacitacion.id;
        delete nuevaCapacitacion.updatedAt;
        
        await addDoc(collection(db, 'capacitaciones'), nuevaCapacitacion);
        recargarDatos();
      } catch (error) {
        console.error('Error al duplicar:', error);
        alert('Error al duplicar la capacitación');
      }
    }
  }, [userProfile, recargarDatos]);

  return {
    handleRegistrarAsistencia,
    handleMarcarCompletada,
    handleDuplicar
  };
};

