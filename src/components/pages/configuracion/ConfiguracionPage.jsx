import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  useTheme, 
  useMediaQuery, 
  alpha,
  Button,
  Alert
} from '@mui/material';
import { Settings as SettingsIcon, Security as SecurityIcon, Storage as StorageIcon, Speed as SpeedIcon } from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';

const ConfiguracionPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { userProfile, role } = useAuth();

  // Solo supermax puede acceder a esta página
  if (role !== 'supermax') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Acceso denegado: Solo los Super Administradores (supermax) pueden acceder a la configuración del sistema.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: isSmallMobile ? 2 : 4,
      maxWidth: 1200,
      mx: 'auto'
    }}>
      <Box sx={{ 
        textAlign: 'center', 
        mb: isSmallMobile ? 4 : 6 
      }}>
        <Typography 
          variant={isSmallMobile ? "h5" : "h4"} 
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <SettingsIcon sx={{ fontSize: isSmallMobile ? '2rem' : '2.5rem' }} />
          Configuración del Sistema
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ lineHeight: 1.6 }}
        >
          Gestiona la configuración global del sistema de Control de Auditorías
        </Typography>
      </Box>

      <Grid container spacing={isSmallMobile ? 2 : 4}>
        {/* Configuración de Seguridad */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
              transition: 'all 0.3s ease'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: isSmallMobile ? 3 : 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                gap: 2
              }}>
                <SecurityIcon sx={{ 
                  fontSize: '2rem', 
                  color: 'primary.main' 
                }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Seguridad
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configuración de autenticación, permisos y políticas de seguridad del sistema.
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ 
                  borderRadius: 2,
                  py: 1.5
                }}
              >
                Configurar Seguridad
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuración de Base de Datos */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
              transition: 'all 0.3s ease'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: isSmallMobile ? 3 : 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                gap: 2
              }}>
                <StorageIcon sx={{ 
                  fontSize: '2rem', 
                  color: 'primary.main' 
                }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Base de Datos
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Gestión de Firestore, backups y optimización de consultas.
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ 
                  borderRadius: 2,
                  py: 1.5
                }}
              >
                Gestionar Base de Datos
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuración de Rendimiento */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
              transition: 'all 0.3s ease'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: isSmallMobile ? 3 : 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                gap: 2
              }}>
                <SpeedIcon sx={{ 
                  fontSize: '2rem', 
                  color: 'primary.main' 
                }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Rendimiento
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Optimización de velocidad, caché y monitoreo del sistema.
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ 
                  borderRadius: 2,
                  py: 1.5
                }}
              >
                Optimizar Rendimiento
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Información del Sistema */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
              transition: 'all 0.3s ease'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: isSmallMobile ? 3 : 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                gap: 2
              }}>
                <SettingsIcon sx={{ 
                  fontSize: '2rem', 
                  color: 'primary.main' 
                }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Información del Sistema
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Versión, estado y estadísticas del sistema.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Versión:</strong> 1.0.0
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Usuario:</strong> {userProfile?.displayName || 'N/A'}
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ 
                  borderRadius: 2,
                  py: 1.5
                }}
              >
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfiguracionPage; 