import { useCallback } from 'react';
import { addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { auditUserCollection } from '../../../../firebaseControlFile';

/**
 * Hook para manejar las acciones de capacitaciones
 * Usa arquitectura multi-tenant: apps/auditoria/users/{uid}/{coleccion}
 */
export const useCapacitacionesHandlers = (userProfile, recargarDatos, navigate) => {
  const handleRegistrarAsistencia = useCallback((capacitacionId) => {
    navigate(`/capacitacion/${capacitacionId}/asistencia`);
  }, [navigate]);

  const handleMarcarCompletada = useCallback(async (capacitacionId) => {
    if (!userProfile?.uid) {
      alert('Error: Usuario no autenticado');
      return;
    }

    if (window.confirm('¿Marcar esta capacitación como completada?')) {
      try {
        const capacitacionRef = doc(auditUserCollection(userProfile.uid, 'capacitaciones'), capacitacionId);
        await updateDoc(capacitacionRef, {
          estado: 'completada',
          updatedAt: Timestamp.now()
        });
        recargarDatos();
      } catch (error) {
        console.error('Error al marcar completada:', error);
        alert('Error al actualizar la capacitación');
      }
    }
  }, [userProfile?.uid, recargarDatos]);

  const handleDuplicar = useCallback(async (capacitacion) => {
    if (!userProfile?.uid) {
      alert('Error: Usuario no autenticado');
      return;
    }

    if (window.confirm(`¿Crear nueva instancia de "${capacitacion.nombre}"?`)) {
      try {
        const nuevaCapacitacion = {
          ...capacitacion,
          estado: 'activa',
          empleados: [],
          fechaRealizada: Timestamp.now(),
          createdAt: Timestamp.now()
        };
        delete nuevaCapacitacion.id;
        delete nuevaCapacitacion.updatedAt;
        // Eliminar campos de identidad legacy
        delete nuevaCapacitacion.createdBy;
        delete nuevaCapacitacion.creadoPor;
        delete nuevaCapacitacion.clienteAdminId;
        delete nuevaCapacitacion.usuarioId;
        
        const capacitacionesRef = auditUserCollection(userProfile.uid, 'capacitaciones');
        await addDoc(capacitacionesRef, nuevaCapacitacion);
        recargarDatos();
      } catch (error) {
        console.error('Error al duplicar:', error);
        alert('Error al duplicar la capacitación');
      }
    }
  }, [userProfile?.uid, recargarDatos]);

  return {
    handleRegistrarAsistencia,
    handleMarcarCompletada,
    handleDuplicar
  };
};

