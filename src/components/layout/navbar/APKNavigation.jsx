import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import BugReportIcon from '@mui/icons-material/BugReport';
import HistoryIcon from '@mui/icons-material/History';
import PublicIcon from '@mui/icons-material/Public';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

const APKNavigation = ({ children }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, userProfile, logoutContext } = useAuth();

  const userEmail = user?.email || userProfile?.email || 'Usuario';
  const userRole = userProfile?.role || 'user';

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuClick = async (action) => {
    setDrawerOpen(false);
    switch (action) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'home':
        navigate('/home');
        break;
      case 'establecimiento':
        navigate('/establecimiento');
        break;
      case 'sucursales':
        navigate('/sucursales');
        break;
      case 'auditoria':
        navigate('/auditoria');
        break;
      case 'formulario':
        navigate('/formulario');
        break;
      case 'editar':
        navigate('/editar');
        break;
      case 'reporte':
        navigate('/reporte');
        break;
      case 'perfil':
        navigate('/perfil');
        break;
      case 'debug':
        navigate('/debug');
        break;
      case 'logs':
        navigate('/usuarios/logs');
        break;
      case 'formularios-publicos':
        navigate('/formularios-publicos');
        break;
      case 'configuracion':
        navigate('/configuracion');
        break;
      case 'logout':
        await logoutContext();
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'home', label: 'Inicio', icon: <HomeIcon /> },
    { id: 'establecimiento', label: 'Establecimientos', icon: <BusinessIcon /> },
    { id: 'sucursales', label: 'Sucursales', icon: <StoreIcon /> },
    { id: 'auditoria', label: 'Auditoría', icon: <AssessmentIcon /> },
    { id: 'formulario', label: 'Formularios', icon: <AssignmentIcon /> },
    { id: 'editar', label: 'Editar', icon: <EditIcon /> },
    { id: 'reporte', label: 'Reportes', icon: <AssessmentIcon /> },
    { id: 'perfil', label: 'Perfil', icon: <PersonIcon /> },
    { id: 'debug', label: 'Debug', icon: <BugReportIcon /> },
    { id: 'logs', label: 'Logs', icon: <HistoryIcon /> },
    { id: 'formularios-publicos', label: 'Formularios Públicos', icon: <PublicIcon /> },
    { id: 'configuracion', label: 'Configuración', icon: <SettingsIcon /> },
  ];

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header de navegación */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: theme.palette.primary.main,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          pt: isMobile ? 'env(safe-area-inset-top, 20px)' : 0,
          height: isMobile ? '120px' : '110px',
          minHeight: isMobile ? '120px' : '110px'
        }}
      >
        <Toolbar sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Control Audit APK
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              {userEmail}
            </Typography>
            <Typography variant="caption" sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              px: 1, 
              py: 0.5, 
              borderRadius: 1,
              fontSize: '0.7rem'
            }}>
              {userRole}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer de navegación */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Mejor rendimiento en móviles
        }}
        sx={{
          display: { xs: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            pt: isMobile ? 'env(safe-area-inset-top, 20px)' : 0
          },
        }}
      >
        <Box sx={{ width: 280 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" noWrap>
              Menú de Navegación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userEmail}
            </Typography>
          </Box>
          
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            
            <Divider sx={{ my: 1 }} />
            
            <ListItem 
              button 
              onClick={() => handleMenuClick('logout')}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(211, 47, 47, 0.08)',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Contenido principal */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        pt: isMobile ? 'env(safe-area-inset-top, 20px)' : 0,
        pb: isMobile ? 'env(safe-area-inset-bottom, 20px)' : 0
      }}>
        {children}
      </Box>
    </div>
  );
};

export default APKNavigation;
