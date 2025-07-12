import React, { useState, useEffect } from "react";
import { 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Box, 
  Typography, 
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  alpha
} from "@mui/material";
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SeleccionEmpresa = ({ empresas, empresaSeleccionada, onChange }) => {
  const theme = useTheme();
  const [empresaSeleccionadaLocal, setEmpresaSeleccionadaLocal] = useState(empresaSeleccionada);

  useEffect(() => {
    setEmpresaSeleccionadaLocal(empresaSeleccionada);
  }, [empresaSeleccionada]);

  const handleChange = (event) => {
    const selectedEmpresa = empresas.find((empresa) => empresa.nombre === event.target.value);
    setEmpresaSeleccionadaLocal(selectedEmpresa);
    onChange(selectedEmpresa);
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
        <BusinessIcon />
        Seleccionar Empresa
      </Typography>
      
      <FormControl fullWidth size="large">
        <InputLabel sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
          Empresa
        </InputLabel>
        <Select
          value={empresaSeleccionadaLocal ? empresaSeleccionadaLocal.nombre : ""}
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
            <em>Seleccione una empresa</em>
          </MenuItem>
          {empresas.map((empresa) => (
            <MenuItem key={empresa.nombre} value={empresa.nombre} sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                {empresa.logo && empresa.logo.trim() !== "" ? (
                  <Avatar
                    src={empresa.logo}
                    alt={`${empresa.nombre} logo`}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      mr: 2,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      mr: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontWeight: 600
                    }}
                  >
                    {empresa.nombre.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Box flex={1}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {empresa.nombre}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Información adicional */}
      {empresas.length === 0 && (
        <Card sx={{ 
          mt: 2, 
          background: alpha(theme.palette.warning.main, 0.1),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
        }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="warning.main">
              No hay empresas disponibles. Contacta a tu administrador.
            </Typography>
          </CardContent>
        </Card>
      )}

      {empresaSeleccionadaLocal && (
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
                  Empresa Seleccionada
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {empresaSeleccionadaLocal.nombre}
                </Typography>
              </Box>
              <Chip 
                label="Activa" 
                color="success" 
                size="small" 
                variant="filled"
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SeleccionEmpresa;
