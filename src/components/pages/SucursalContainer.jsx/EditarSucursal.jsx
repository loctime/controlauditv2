import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography
} from '@mui/material';

// Modal para editar sucursal
const EditarSucursalModal = ({
  open,
  handleClose,
  handleEditSucursal,
  sucursal,
  handleInputChange,
  loading
}) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Sucursal</DialogTitle>
      <DialogContent>
        <TextField
          variant="outlined"
          label="Nombre de la Sucursal"
          name="nombre"
          value={sucursal.nombre}
          onChange={handleInputChange}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          variant="outlined"
          label="Dirección"
          name="direccion"
          value={sucursal.direccion}
          onChange={handleInputChange}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          variant="outlined"
          label="Teléfono"
          name="telefono"
          value={sucursal.telefono}
          onChange={handleInputChange}
          required
          fullWidth
          margin="normal"
        />
        {loading && <CircularProgress sx={{ ml: 2 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleEditSucursal}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarSucursalModal; 