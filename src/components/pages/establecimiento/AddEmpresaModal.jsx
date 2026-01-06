import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box
} from '@mui/material';

/**
 * Modal para crear una nueva empresa
 * 
 * Responsabilidad ÚNICA: Crear empresa usando ownerEmpresaService.createEmpresa
 * 
 * NO gestiona:
 * - Asignación de usuarios
 * - Permisos
 * - Selección de operarios
 */
const AddEmpresaModal = ({
  open,
  handleClose,
  handleAddEmpresa,
  empresa,
  handleInputChange,
  handleLogoChange,
  loading
}) => {
  const handleClickAdd = () => {
    console.log('[AddEmpresaModal][handleClickAdd] Evento: Usuario hizo clic en "Agregar Empresa"');
    console.log('[AddEmpresaModal][handleClickAdd] Datos del formulario:', {
      nombre: empresa.nombre,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      tieneLogo: !!empresa.logo
    });
    handleAddEmpresa();
  };

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
          fullWidth
          margin="normal"
        />
        <TextField
          variant="outlined"
          label="Teléfono"
          name="telefono"
          value={empresa.telefono}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          style={{ margin: '16px 0' }}
        />
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleClickAdd}
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
