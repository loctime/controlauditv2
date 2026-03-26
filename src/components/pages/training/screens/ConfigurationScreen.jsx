import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/components/context/AuthContext';
import CatalogScreenAdapter from '../components/configuration/CatalogScreenAdapter';

export default function ConfigurationScreen() {
  const navigate = useNavigate();
  const { userEmpresas = [], userSucursales = [] } = useAuth();

  return (
    <Box>
      {/* Header with back button */}
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Tooltip title="Volver a Matriz">
          <IconButton
            onClick={() => navigate('/training')}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ ml: 1 }}>
          Catálogo de Capacitaciones
        </Typography>
      </Stack>

      {/* Catalog only - no plans section */}
      <CatalogScreenAdapter onNavigateToPlans={() => navigate('/training')} />
    </Box>
  );
}

