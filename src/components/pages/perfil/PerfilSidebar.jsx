import React from 'react';
import { Paper, Typography, Divider, List as MUIList, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Business as BusinessIcon, Draw as DrawIcon, Share as ShareIcon, Settings as SettingsIcon, Group as GroupIcon, Info as InfoIcon } from '@mui/icons-material';

const sidebarItems = [
  { label: 'Empresas', icon: <BusinessIcon />, key: 'empresas' },
  { label: 'Formularios', icon: <DrawIcon />, key: 'formularios' },
  { label: 'Formularios Compartidos', icon: <ShareIcon />, key: 'compartidas' },
  { label: 'Configuración', icon: <SettingsIcon />, key: 'configuracion' },
  { label: 'Usuarios', icon: <GroupIcon />, key: 'usuarios' },
  { label: 'Firma', icon: <DrawIcon />, key: 'firma' },
  { label: 'Sistema', icon: <InfoIcon />, key: 'info' },
];

const PerfilSidebar = ({ selectedSection, onSelectSection }) => {
  // Log de depuración
  console.debug('[PerfilSidebar] selectedSection:', selectedSection);
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
