import React from 'react';
import { Box, Chip, Typography, IconButton, Tooltip } from '@mui/material';
import { CloudUpload, CloudOff, Refresh, CheckCircle, Error } from '@mui/icons-material';
import { useControlFile } from '../../hooks/useControlFile.js';

const ControlFileStatus = ({ showDetails = false }) => {
  const { isAvailable, isLoading, error, refreshAvailability } = useControlFile();

  const getStatusColor = () => {
    if (isLoading) return 'default';
    if (isAvailable) return 'success';
    if (error) return 'error';
    return 'warning';
  };

  const getStatusIcon = () => {
    if (isLoading) return <Refresh sx={{ fontSize: 16 }} />;
    if (isAvailable) return <CheckCircle sx={{ fontSize: 16 }} />;
    if (error) return <Error sx={{ fontSize: 16 }} />;
    return <CloudOff sx={{ fontSize: 16 }} />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Verificando...';
    if (isAvailable) return 'ControlFile disponible';
    if (error) return 'Error de conexión';
    return 'ControlFile no disponible';
  };

  const getStatusTooltip = () => {
    if (isLoading) return 'Verificando disponibilidad de ControlFile...';
    if (isAvailable) return 'ControlFile está funcionando correctamente. Las imágenes se subirán automáticamente.';
    if (error) return `Error: ${error}. Las imágenes se guardarán localmente.`;
    return 'ControlFile no está disponible. Las imágenes se guardarán localmente.';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={getStatusTooltip()} arrow>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          variant="outlined"
        />
      </Tooltip>
      
      <Tooltip title="Refrescar estado" arrow>
        <IconButton 
          size="small" 
          onClick={refreshAvailability}
          disabled={isLoading}
          sx={{ 
            color: isLoading ? 'text.disabled' : 'primary.main',
            '&:hover': { 
              transform: isLoading ? 'none' : 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }
          }}
        >
          <Refresh sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      {showDetails && (
        <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Estado: {isAvailable ? 'Conectado' : 'Desconectado'}
          </Typography>
          {error && (
            <Typography variant="caption" color="error.main">
              Error: {error}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Modo: {isAvailable ? 'ControlFile + Local' : 'Solo Local'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ControlFileStatus;
