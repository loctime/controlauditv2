import logger from '@/utils/logger';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StorefrontIcon from '@mui/icons-material/Storefront';

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
  loading,
  onCrearSucursal
}) => {
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [createdEmpresaId, setCreatedEmpresaId] = useState(null);

  const handleClickAdd = async () => {
    logger.debug('[AddEmpresaModal][handleClickAdd] Evento: Usuario hizo clic en "Agregar Empresa"');
    logger.debug('[AddEmpresaModal][handleClickAdd] Datos del formulario:', {
      nombre: empresa.nombre,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      tieneLogo: !!empresa.logo
    });
    try {
      const empresaId = await handleAddEmpresa();
      if (empresaId) {
        setCreatedEmpresaId(empresaId);
        setStep('success');
      }
    } catch (error) {
      // Error ya manejado por el hook con Swal
    }
  };

  const handleDespues = () => {
    setStep('form');
    setCreatedEmpresaId(null);
    handleClose();
  };

  const handleClickCrearSucursal = () => {
    const id = createdEmpresaId;
    setStep('form');
    setCreatedEmpresaId(null);
    handleClose();
    if (onCrearSucursal) onCrearSucursal(id);
  };

  const handleDialogClose = () => {
    setStep('form');
    setCreatedEmpresaId(null);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
      {step === 'form' ? (
        <>
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
            <Button onClick={handleDialogClose} variant="outlined" disabled={loading}>
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
        </>
      ) : (
        <>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutlineIcon color="success" />
              ¡Empresa creada!
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <StorefrontIcon sx={{ fontSize: 56, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                ¿Querés agregar una sucursal ahora?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Necesitás al menos una sucursal para poder operar en el sistema.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ gap: 1, px: 3, pb: 3 }}>
            <Button onClick={handleDespues} variant="outlined" fullWidth>
              Después
            </Button>
            <Button
              onClick={handleClickCrearSucursal}
              variant="contained"
              color="primary"
              fullWidth
            >
              Crear sucursal
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default AddEmpresaModal;
