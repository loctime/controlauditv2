import { useCallback } from 'react';
import {
  crearAccidente,
  crearIncidente,
  actualizarEstadoAccidente,
  eliminarAccidente,
  actualizarAccidente
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

  const handleEliminarAccidente = useCallback(async (accidenteId) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar registro?',
        text: 'Esta acción eliminará el registro permanentemente. No se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await eliminarAccidente(accidenteId, userProfile?.uid);
        Swal.fire('Éxito', 'Registro eliminado correctamente', 'success');
        recargarAccidentes();
      }
    } catch (error) {
      console.error('Error eliminando accidente:', error);
      Swal.fire('Error', 'No se pudo eliminar el registro', 'error');
    }
  }, [recargarAccidentes, userProfile]);

  const handleActualizarAccidente = useCallback(async (accidenteId, datos, imagenesNuevas = []) => {
    try {
      await actualizarAccidente(accidenteId, datos, imagenesNuevas, userProfile?.uid);
      Swal.fire('Éxito', 'Accidente actualizado correctamente', 'success');
      recargarAccidentes();
    } catch (error) {
      console.error('Error actualizando accidente:', error);
      Swal.fire('Error', 'No se pudo actualizar el registro', 'error');
      throw error;
    }
  }, [recargarAccidentes, userProfile]);

  return {
    handleCrearAccidente,
    handleCrearIncidente,
    handleCambiarEstado,
    handleEliminarAccidente,
    handleActualizarAccidente
  };
};

