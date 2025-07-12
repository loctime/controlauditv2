// components/SeleccionSucursal.js
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SeleccionSucursal = ({ sucursales, sucursalSeleccionada, onChange }) => {
  const theme = useTheme();

  const handleChange = (event) => {
    onChange(event);
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
        <LocationOnIcon />
        Seleccionar Ubicación
      </Typography>
      
      <FormControl fullWidth size="large">
        <InputLabel sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
          Ubicación
        </InputLabel>
        <Select
          value={sucursalSeleccionada}
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
            <em>Casa Central</em>
          </MenuItem>
          {sucursales.map((sucursal) => (
            <MenuItem key={sucursal.id} value={sucursal.nombre} sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                <LocationOnIcon color="primary" sx={{ mr: 2 }} />
                <Box flex={1}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {sucursal.nombre}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Sucursal
                  </Typography>
                </Box>
                <Chip 
                  label="Sucursal" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Información de la ubicación seleccionada */}
      {sucursalSeleccionada && (
        <Card sx={{ 
          mt: 2, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
          border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircleIcon color="success" />
              <Box flex={1}>
                <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 600 }}>
                  Ubicación Seleccionada
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {sucursalSeleccionada === "" ? "Casa Central" : sucursalSeleccionada}
                </Typography>
                <Box display="flex" gap={1}>
                  {sucursalSeleccionada === "" ? (
                    <Chip 
                      icon={<BusinessIcon />} 
                      label="Casa Central" 
                      size="small" 
                      color="primary" 
                      variant="filled"
                    />
                  ) : (
                    <Chip 
                      icon={<LocationOnIcon />} 
                      label="Sucursal" 
                      size="small" 
                      color="secondary" 
                      variant="filled"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card sx={{ 
        mt: 2, 
        background: alpha(theme.palette.info.main, 0.1),
        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
      }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="body2" color="info.main" sx={{ fontWeight: 500, mb: 1 }}>
            Opciones disponibles:
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
            • <strong>Casa Central:</strong> Auditoría en la sede principal
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • <strong>Sucursales:</strong> Auditoría en ubicaciones específicas
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SeleccionSucursal;