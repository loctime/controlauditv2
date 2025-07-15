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

// Modal para editar empresa
const EditarEmpresaModal = ({
  open,
  handleClose,
  handleEditEmpresa,
  empresa,
  handleInputChange,
  handleLogoChange,
  loading
}) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Empresa</DialogTitle>
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
          style={{ margin: '16px 0' }}
        />
        <Typography variant="caption" color="text.secondary">
          Si no seleccionas un nuevo logo, se mantendrá el actual.
        </Typography>
        {loading && <CircularProgress sx={{ ml: 2 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleEditEmpresa}
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

export default EditarEmpresaModal;