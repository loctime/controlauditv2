import React from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  useTheme, 
  useMediaQuery, 
  alpha, 
  Button,
  Avatar,
  IconButton
} from '@mui/material';
import { Group as GroupIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import UsuariosList from '../usuarios/UsuariosList';
import { useAuth } from '../../context/AuthContext';

const PerfilUsuarios = ({ usuariosCreados, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Log de depuración
  const { userProfile } = useAuth();
  const clienteAdminId = userProfile?.clienteAdminId || userProfile?.uid;
  console.debug('[PerfilUsuarios] usuariosCreados:', usuariosCreados);
  
  return (
    <Box sx={{ 
      p: isSmallMobile ? 1 : 3,
      bgcolor: 'background.paper',
      borderRadius: 3,
      border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      {/* Header con título y botón de agregar usuario */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: isSmallMobile ? 3 : 4,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isSmallMobile ? 2 : 3
      }}>
        <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
          <Typography 
            variant={isSmallMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 1
            }}
          >
            👥 Mis Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {usuariosCreados?.length || 0} usuario(s) registrado(s)
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => {
            console.log('[PerfilUsuarios] Navegando a agregar usuario');
            // Aquí puedes agregar la navegación para agregar usuario
          }}
          sx={{ 
            py: isSmallMobile ? 1.5 : 2,
            px: isSmallMobile ? 3 : 4,
            fontSize: isSmallMobile ? '0.875rem' : '1rem',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            },
            transition: 'all 0.2s ease'
          }}
        >
          ➕ Agregar Usuario
        </Button>
      </Box>
      
      {/* Contenido de usuarios */}
      {loading ? (
        <Box sx={{
          bgcolor: alpha(theme.palette.info.main, 0.05),
          borderRadius: 2,
          p: isSmallMobile ? 3 : 4,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          textAlign: 'center'
        }}>
          <Typography variant="body1" color="info.main">
            Cargando usuarios...
          </Typography>
        </Box>
      ) : !usuariosCreados || usuariosCreados.length === 0 ? (
        <Box sx={{
          bgcolor: alpha(theme.palette.warning.main, 0.05),
          borderRadius: 2,
          p: isSmallMobile ? 3 : 4,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
          textAlign: 'center'
        }}>
          <GroupIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" color="warning.main" sx={{ mb: 1 }}>
            No hay usuarios para mostrar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comienza agregando usuarios para gestionar tu equipo
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? 2 : 3 
        }}>
          <UsuariosList clienteAdminId={clienteAdminId} showAddButton={false} />
        </Box>
      )}
    </Box>
  );
};

export default PerfilUsuarios;
