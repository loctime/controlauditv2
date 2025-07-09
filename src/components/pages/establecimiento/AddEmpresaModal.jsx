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
import Swal from 'sweetalert2';

const AddEmpresaModal = ({
  open,
  handleClose,
  handleAddEmpresa,
  empresa,
  handleInputChange,
  handleLogoChange,
  loading
}) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Nueva Empresa</DialogTitle>
      <DialogContent>
        <TextField
          variant="outlined"
          label="Nombre de la Empresa"
          name="nombre"
          value={empresa.nombre}
          onChange={handleInputChange}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          variant="outlined"
          label="Dirección"
          name="direccion"
          value={empresa.direccion}
          onChange={handleInputChange}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          variant="outlined"
          label="Teléfono"
          name="telefono"
          value={empresa.telefono}
          onChange={handleInputChange}
          required
          fullWidth
          margin="normal"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          required
          style={{ margin: '16px 0' }}
        />
        {loading && <CircularProgress />}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleAddEmpresa}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Agregando..." : "Agregar Empresa"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEmpresaModal;
