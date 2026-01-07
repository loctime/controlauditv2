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
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import UsuariosList from '../usuarios/UsuariosList';
import OwnerUserCreateDialog from '../usuarios/OwnerUserCreateDialog';
import { useAuth } from '@/components/context/AuthContext';

const PerfilUsuarios = ({ usuariosCreados, loading, onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  // Estado para el modal de agregar usuario
  const [openModal, setOpenModal] = useState(false);

  // Validación de límite de usuarios
  // Nota: UsuariosList maneja su propia carga con el servicio de migración
  const limiteUsuarios = userProfile?.limiteUsuarios ?? 0;
  const puedeAgregar = limiteUsuarios === 0 || true; // UsuariosList valida el límite internamente
  
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
          {limiteUsuarios > 0 && (
            <Typography variant="body2" color="text.secondary">
              Límite: {limiteUsuarios} usuario(s)
            </Typography>
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
      
      {/* Contenido de usuarios - UsuariosList maneja su propia carga con servicio de migración */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isSmallMobile ? 2 : 3 
      }}>
        <UsuariosList ownerId={ownerId} showAddButton={false} />
      </Box>

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
