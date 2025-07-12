import React from "react";
import { 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Box, 
  Typography, 
  Card,
  CardContent,
  Chip,
  useTheme,
  alpha
} from "@mui/material";
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

const SeleccionFormulario = ({ formularios, formularioSeleccionadoId, onChange, disabled }) => {
  const theme = useTheme();

  const handleChange = (event) => {
    onChange(event);
  };

  const getFormularioSeleccionado = () => {
    return formularios.find(formulario => formulario.id === formularioSeleccionadoId);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ 
        color: 'primary.main', 
        mb: 3, 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <AssignmentIcon />
        Seleccionar Formulario
      </Typography>
      
      <FormControl fullWidth size="large" disabled={disabled}>
        <InputLabel sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
          Formulario de Auditoría
        </InputLabel>
        <Select
          value={formularioSeleccionadoId}
          onChange={handleChange}
          sx={{ 
            minHeight: '56px',
            '& .MuiSelect-select': {
              fontSize: '1rem',
              padding: '16px 14px'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            }
          }}
        >
          <MenuItem value="">
            <em>Seleccione un formulario</em>
          </MenuItem>
          {formularios.map((formulario) => (
            <MenuItem key={formulario.id} value={formulario.id} sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <AssignmentIcon color="primary" />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formulario.nombre}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formulario.creadorEmail}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  {formulario.esPublico ? (
                    <Chip 
                      icon={<PublicIcon />} 
                      label="Público" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                  ) : (
                    <Chip 
                      icon={<LockIcon />} 
                      label="Privado" 
                      size="small" 
                      color="default" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Información del formulario seleccionado */}
      {getFormularioSeleccionado() && (
        <Card sx={{ 
          mt: 2, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
          border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircleIcon color="info" />
              <Box flex={1}>
                <Typography variant="subtitle2" color="info.main" sx={{ fontWeight: 600 }}>
                  Formulario Seleccionado
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {getFormularioSeleccionado().nombre}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip 
                    label={`${getFormularioSeleccionado().secciones?.length || 0} secciones`} 
                    size="small" 
                    variant="outlined"
                  />
                  {getFormularioSeleccionado().esPublico ? (
                    <Chip 
                      icon={<PublicIcon />} 
                      label="Público" 
                      size="small" 
                      color="success" 
                      variant="filled"
                    />
                  ) : (
                    <Chip 
                      icon={<LockIcon />} 
                      label="Privado" 
                      size="small" 
                      color="default" 
                      variant="filled"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay formularios */}
      {formularios.length === 0 && (
        <Card sx={{ 
          mt: 2, 
          background: alpha(theme.palette.warning.main, 0.1),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
        }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="warning.main">
              No hay formularios disponibles. Crea un formulario primero.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SeleccionFormulario;
