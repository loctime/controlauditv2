import React from "react";
import Swal from "sweetalert2";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { db } from "../../../firebaseControlFile";
import { doc, deleteDoc } from "firebase/firestore";

const EliminarEmpresa = ({ empresa, onEmpresaEliminada }) => {
  const handleDelete = async () => {
    // Validar que tenemos los datos necesarios
    if (!empresa || !empresa.id) {
      console.error("Empresa inválida:", empresa);
      await Swal.fire({
        title: 'Error',
        text: 'Datos de empresa inválidos',
        icon: 'error'
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Estás seguro de que deseas eliminar la empresa "${empresa.nombre}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espera mientras se elimina la empresa.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Validar que el ID de la empresa es válido
        if (!empresa.id || typeof empresa.id !== 'string' || empresa.id.trim() === '') {
          throw new Error('ID de empresa inválido');
        }

        // Eliminar la empresa
        const empresaRef = doc(db, "empresas", empresa.id);
        await deleteDoc(empresaRef);
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Eliminado!',
          text: `La empresa "${empresa.nombre}" ha sido eliminada exitosamente.`,
          icon: 'success',
          timer: 3000,
          timerProgressBar: true
        });

        // Llamar al callback para actualizar la lista
        if (onEmpresaEliminada) {
          onEmpresaEliminada();
        }
      }
    } catch (error) {
      console.error("Error al eliminar la empresa:", error);
      
      // Mostrar error específico
      let errorMessage = 'No se pudo eliminar la empresa.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'No tienes permisos para eliminar esta empresa.';
      } else if (error.code === 'not-found') {
        errorMessage = 'La empresa no fue encontrada.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Servicio no disponible. Intenta nuevamente.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Validar que tenemos los datos necesarios para renderizar
  if (!empresa || !empresa.id || !empresa.nombre) {
    console.warn("EliminarEmpresa: Datos de empresa incompletos", empresa);
    return null;
  }

  return (
    <IconButton 
      color="error" 
      aria-label={`Eliminar empresa ${empresa.nombre}`} 
      onClick={handleDelete}
      size="small"
    >
      <DeleteIcon />
    </IconButton>
  );
};

export default EliminarEmpresa;
