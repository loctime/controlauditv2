import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip
} from '@mui/material';
import {
  Public as PublicIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * Header con controles para EditarFormulario
 * Optimizado con React.memo
 */
const FormulariosHeader = React.memo(({
  isMobile,
  isSmallMobile,
  formularios,
  formularioSeleccionado,
  onFormularioChange,
  onCrear,
  onGaleríaPublica,
  onReload,
  recargando
}) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      justifyContent: 'space-between',
      mb: isSmallMobile ? 3 : 4,
      gap: isSmallMobile ? 2 : 3
    }}>
      <Typography
        variant={isSmallMobile ? "h5" : "h4"}
        sx={{
          fontWeight: 700,
          color: 'primary.main',
          textAlign: isMobile ? 'center' : 'left',
          mb: isMobile ? 2 : 0
        }}
      >
        📝 Editar Formularios
      </Typography>

      <Box sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: isSmallMobile ? 2 : 3,
        flexWrap: 'wrap'
      }}>
        <FormControl
          size={isSmallMobile ? "small" : "medium"}
          sx={{
            minWidth: isMobile ? '100%' : 250,
            mb: isMobile ? 2 : 0
          }}
        >
          <InputLabel id="select-formulario-label">Seleccionar Formulario</InputLabel>
          <Select
            labelId="select-formulario-label"
            id="select-formulario"
            value={formularioSeleccionado?.id || ""}
            onChange={onFormularioChange}
            label="Seleccionar Formulario"
          >
            <MenuItem value=""><em>Todos</em></MenuItem>
            {formularios.map((formulario) => (
              <MenuItem key={formulario.id} value={formulario.id}>
                {formulario.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isSmallMobile ? 1 : 2,
          flexWrap: 'wrap'
        }}>
          <Button
            variant="outlined"
            startIcon={<PublicIcon />}
            onClick={onGaleríaPublica}
            sx={{
              borderRadius: 2,
              px: isSmallMobile ? 2 : 3,
              py: isSmallMobile ? 1 : 1.5,
              fontSize: isSmallMobile ? '0.875rem' : '1rem',
              fontWeight: 600,
              minWidth: isMobile ? '100%' : 'auto',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
            title="Ver y copiar plantillas públicas"
          >
            🌐 Galería Pública
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onCrear}
            sx={{
              borderRadius: 2,
              px: isSmallMobile ? 2 : 3,
              py: isSmallMobile ? 1 : 1.5,
              fontSize: isSmallMobile ? '0.875rem' : '1rem',
              fontWeight: 600,
              minWidth: isMobile ? '100%' : 'auto',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
          >
            ➕ Crear
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={onReload}
            disabled={recargando}
            sx={{
              minWidth: isSmallMobile ? 40 : 48,
              width: isSmallMobile ? 40 : 48,
              height: isSmallMobile ? 40 : 48,
              borderRadius: '50%',
              p: 0,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
            title="Recargar lista de formularios"
          >
            <RefreshIcon
              sx={{
                animation: recargando ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
          </Button>

          {recargando && (
            <Chip
              label="Recargando..."
              color="primary"
              size="small"
              sx={{
                animation: 'pulse 1s infinite',
                fontWeight: 600
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.formularioSeleccionado?.id === nextProps.formularioSeleccionado?.id &&
    prevProps.recargando === nextProps.recargando &&
    prevProps.formularios.length === nextProps.formularios.length &&
    prevProps.isMobile === nextProps.isMobile
  );
});

FormulariosHeader.displayName = 'FormulariosHeader';

export default FormulariosHeader;

