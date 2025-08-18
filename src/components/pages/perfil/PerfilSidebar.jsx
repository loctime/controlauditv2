import React from 'react';
import { 
  Paper, 
  Typography, 
  Divider, 
  List as MUIList, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  alpha,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  Draw as DrawIcon, 
  Share as ShareIcon, 
  Settings as SettingsIcon, 
  Group as GroupIcon, 
  Info as InfoIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

const sidebarItems = [
  { label: 'Empresas', icon: <BusinessIcon />, key: 'empresas' },
  { label: 'Formularios', icon: <DrawIcon />, key: 'formularios' },
  { label: 'Configuración', icon: <SettingsIcon />, key: 'configuracion' },
  { label: 'Usuarios', icon: <GroupIcon />, key: 'usuarios' },
  { label: 'Firma', icon: <DrawIcon />, key: 'firma' },
  { label: 'Sistema', icon: <InfoIcon />, key: 'info' },
];

const PerfilSidebar = ({ selectedSection, onSelectSection, userProfile }) => {
  const theme = useTheme();
  const isMobile = false; // Forzar siempre vista desktop
  
  // Log de depuración
  console.debug('[PerfilSidebar] selectedSection:', selectedSection, 'isMobile:', isMobile);
  
  // Componente de información del perfil
  const ProfileInfo = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 1, 
      mb: 3,
      p: 2,
      borderRadius: 2,
      bgcolor: alpha(theme.palette.primary.main, 0.05),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
    }}>
      {/* Avatar */}
      <Avatar sx={{ 
        bgcolor: 'primary.main', 
        width: isMobile ? 56 : 64, 
        height: isMobile ? 56 : 64,
        mb: 1
      }}>
        <PersonIcon sx={{ fontSize: isMobile ? 28 : 32 }} />
      </Avatar>
      
      {/* Email */}
      <Typography 
        variant={isMobile ? "body1" : "subtitle1"} 
        sx={{ 
          fontWeight: 600, 
          color: 'primary.main',
          textAlign: 'center',
          wordBreak: 'break-word',
          maxWidth: '100%'
        }}
      >
        {userProfile?.email || 'Usuario'}
      </Typography>
      
      {/* Fecha de membresía */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5 
      }}>
        <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Miembro desde: {userProfile?.createdAt?.seconds ? 
            new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 
            'N/A'
          }
        </Typography>
      </Box>
    </Box>
  );
  
  // Vista desktop - sidebar lateral
  return (
    <Paper elevation={2} sx={{ 
      width: 280, 
      minWidth: 250, 
      maxWidth: 320, 
      p: 3, 
      mr: 3, 
      position: 'sticky',
      top: 20,
      height: 'fit-content',
      display: 'block'
    }}>
      {/* Información del perfil */}
      <ProfileInfo />
      
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="subtitle1" align="center" sx={{ mb: 2, fontWeight: 600 }}>
        📋 Navegación
      </Typography>
      
      <MUIList>
        {sidebarItems.map(item => (
          <ListItemButton
            key={item.key}
            selected={selectedSection === item.key}
            onClick={() => onSelectSection(item.key)}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08)
              },
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.16)
                }
              }
            }}
          >
            <ListItemIcon sx={{ color: selectedSection === item.key ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              sx={{ 
                '& .MuiListItemText-primary': {
                  fontWeight: selectedSection === item.key ? 600 : 500
                }
              }}
            />
          </ListItemButton>
        ))}
      </MUIList>
    </Paper>
  );
};

export default PerfilSidebar;
