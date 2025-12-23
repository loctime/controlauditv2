import { useCallback } from 'react';
import { capacitacionService } from '../../../../services/capacitacionService';

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
        await capacitacionService.completarCapacitacion(userProfile.uid, capacitacionId, { uid: userProfile.uid });
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
        await capacitacionService.duplicarCapacitacion(userProfile.uid, capacitacion, { uid: userProfile.uid });
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

