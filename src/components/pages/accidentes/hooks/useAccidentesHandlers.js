import { useCallback } from 'react';
import {
  crearAccidente,
  crearIncidente,
  actualizarEstadoAccidente
} from '../../../../services/accidenteService';
import Swal from 'sweetalert2';

/**
 * Hook para handlers de accidentes
 */
export const useAccidentesHandlers = (userProfile, recargarAccidentes) => {
  const handleCrearAccidente = useCallback(async (accidenteData) => {
    try {
      await crearAccidente(
        {
          ...accidenteData,
          reportadoPor: userProfile.uid
        },
        accidenteData.empleadosSeleccionados,
        accidenteData.imagenes
      );
      Swal.fire('Éxito', 'Accidente reportado correctamente', 'success');
      recargarAccidentes();
    } catch (error) {
      console.error('Error creando accidente:', error);
      throw error;
    }
  }, [userProfile, recargarAccidentes]);

  const handleCrearIncidente = useCallback(async (incidenteData) => {
    try {
      await crearIncidente(
        {
          ...incidenteData,
          reportadoPor: userProfile.uid
        },
        incidenteData.testigos,
        incidenteData.imagenes
      );
      Swal.fire('Éxito', 'Incidente reportado correctamente', 'success');
      recargarAccidentes();
    } catch (error) {
      console.error('Error creando incidente:', error);
      throw error;
    }
  }, [userProfile, recargarAccidentes]);

  const handleCambiarEstado = useCallback(async (accidenteId, nuevoEstado) => {
    try {
      const result = await Swal.fire({
        title: '¿Cambiar estado?',
        text: `¿Desea marcar este registro como ${nuevoEstado}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await actualizarEstadoAccidente(accidenteId, nuevoEstado, userProfile?.uid);
        Swal.fire('Éxito', 'Estado actualizado correctamente', 'success');
        recargarAccidentes();
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  }, [recargarAccidentes, userProfile]);

  return {
    handleCrearAccidente,
    handleCrearIncidente,
    handleCambiarEstado
  };
};

