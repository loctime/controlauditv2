import React from "react";
import Swal from "sweetalert2";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { db } from "../../../firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";

const EliminarEmpresa = ({ empresaId, eliminarEmpresa }) => {
  const handleDelete = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás deshacer esta acción!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "empresas", empresaId));
        await Swal.fire('¡Eliminado!', 'La empresa ha sido eliminada.', 'success');
        eliminarEmpresa(); // Actualiza la lista de empresas
      }
    } catch (error) {
      console.error("Error al eliminar la empresa:", error);
      await Swal.fire('Error', 'No se pudo eliminar la empresa.', 'error');
    }
  };

  return (
    <IconButton color="error" aria-label="Eliminar empresa" onClick={handleDelete}>
      <DeleteIcon />
    </IconButton>
  );
};

export default EliminarEmpresa;
