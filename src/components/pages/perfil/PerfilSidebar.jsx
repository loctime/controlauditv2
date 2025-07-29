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
  Chip
} from '@mui/material';
import { Business as BusinessIcon, Draw as DrawIcon, Share as ShareIcon, Settings as SettingsIcon, Group as GroupIcon, Info as InfoIcon } from '@mui/icons-material';

const sidebarItems = [
  { label: 'Empresas', icon: <BusinessIcon />, key: 'empresas' },
  { label: 'Formularios', icon: <DrawIcon />, key: 'formularios' },
  { label: 'Configuración', icon: <SettingsIcon />, key: 'configuracion' },
  { label: 'Usuarios', icon: <GroupIcon />, key: 'usuarios' },
  { label: 'Firma', icon: <DrawIcon />, key: 'firma' },
  { label: 'Sistema', icon: <InfoIcon />, key: 'info' },
];

const PerfilSidebar = ({ selectedSection, onSelectSection }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Log de depuración
  console.debug('[PerfilSidebar] selectedSection:', selectedSection);
  
  if (isMobile) {
    // Vista móvil con Box de MUI
    return (
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        p: isSmallMobile ? 2 : 3,
        mb: 3
      }}>
        <Typography 
          variant={isSmallMobile ? "h6" : "h5"} 
          sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            textAlign: 'center',
            mb: isSmallMobile ? 2 : 3
          }}
        >
          📋 Navegación
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? 1 : 2 
        }}>
          {sidebarItems.map(item => (
            <Button
              key={item.key}
              variant={selectedSection === item.key ? "contained" : "outlined"}
              color={selectedSection === item.key ? "primary" : "inherit"}
              onClick={() => onSelectSection(item.key)}
              startIcon={item.icon}
              sx={{
                justifyContent: 'flex-start',
                py: isSmallMobile ? 1.5 : 2,
                px: isSmallMobile ? 2 : 3,
                borderRadius: 2,
                fontWeight: selectedSection === item.key ? 600 : 500,
                fontSize: isSmallMobile ? '0.875rem' : '1rem',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Box>
    );
  }
  
  // Vista desktop con Paper tradicional
  return (
    <Paper elevation={1} sx={{ width: 220, minWidth: 180, maxWidth: 260, p: 2, mr: 2, position: 'relative', height: 'fit-content', display: { xs: 'none', md: 'block' } }}>
      <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
        Navegación
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <MUIList>
        {sidebarItems.map(item => (
          <ListItemButton
            key={item.key}
            selected={selectedSection === item.key}
            onClick={() => onSelectSection(item.key)}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </MUIList>
    </Paper>
  );
};

export default PerfilSidebar;
