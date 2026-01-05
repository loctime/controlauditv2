import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  useTheme, 
  useMediaQuery, 
  alpha, 
  Button
} from '@mui/material';
import { Group as GroupIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import UsuariosList from '../usuarios/UsuariosList';
import OwnerUserCreateDialog from '../usuarios/OwnerUserCreateDialog';
import { useAuth } from '../../context/AuthContext';

const PerfilUsuarios = ({ usuariosCreados, loading, onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { userProfile } = useAuth();
  const clienteAdminId = userProfile?.clienteAdminId || userProfile?.uid;

  // Estado para el modal de agregar usuario
  const [openModal, setOpenModal] = useState(false);

  // Validación de límite de usuarios
  const limiteUsuarios = userProfile?.limiteUsuarios ?? 0;
  const usuariosActuales = usuariosCreados?.length || 0;
  const puedeAgregar = usuariosActuales < limiteUsuarios || !limiteUsuarios;
  
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
          {!puedeAgregar && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Has alcanzado el límite de usuarios permitidos para tu plan ({limiteUsuarios}). Contacta a soporte para ampliarlo.
            </Alert>
          )}
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenModal(true)}
          disabled={!puedeAgregar}
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

      {/* Modal Core para agregar usuario */}
      <OwnerUserCreateDialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          if (onRefresh) {
            onRefresh();
          } else {
            window.location.reload();
          }
        }}
      />
    </Box>
  );
};

export default PerfilUsuarios;
