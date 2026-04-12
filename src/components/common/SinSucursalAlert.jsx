import React from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useNavigate } from 'react-router-dom';

const SinSucursalAlert = ({ empresaId }) => {
  const navigate = useNavigate();

  const handleIr = () => {
    navigate('/establecimiento');
  };

  return (
    <Alert
      severity="warning"
      icon={false}
      sx={{
        mb: 3,
        py: 3,
        '& .MuiAlert-message': { width: '100%' }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <StorefrontIcon sx={{ fontSize: 48, color: 'warning.main', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Sin sucursales registradas
          </Typography>
          <Typography variant="body1">
            Esta empresa no tiene sucursales registradas. Creá una para poder operar.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="warning"
          size="large"
          onClick={handleIr}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Crear sucursal
        </Button>
      </Box>
    </Alert>
  );
};

export default SinSucursalAlert;
