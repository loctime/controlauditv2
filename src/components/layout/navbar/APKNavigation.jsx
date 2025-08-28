import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/apk-scroll-fixes.css';
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
  useMediaQuery,
  Button
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
import UpdateNotification from '../../common/UpdateNotification.jsx';

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
    <div 
      className="apk-navigation-container flex-scroll-container"
      style={{ 
        width: '100vw', 
        height: '100vh', 
        overflow: 'visible',
        position: 'relative',
        top: 0,
        left: 0,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Notificación de actualización */}
      <UpdateNotification />
      {/* Header de navegación */}
             <AppBar 
         position="fixed" 
         sx={{ 
           bgcolor: theme.palette.primary.main,
           boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
           pt: isMobile ? 'env(safe-area-inset-top, 20px)' : 0,
           height: isMobile ? '140px' : '130px',
           minHeight: isMobile ? '140px' : '130px',
           top: 0,
           left: 0,
           right: 0,
           zIndex: 1200
         }}
       >
                                      <Toolbar sx={{ 
             display: 'flex', 
             flexDirection: 'column',
             justifyContent: 'flex-start',
             alignItems: 'stretch',
             height: '100%',
             py: 0.5
           }}>
                         {/* Fila superior: Título centrado y usuario */}
             <Box sx={{ 
               display: 'flex', 
               justifyContent: 'space-between',
               alignItems: 'center',
               width: '100%',
               position: 'relative',
               mb: 0.25,
               mt: 2.5
             }}>
               {/* Espacio vacío para balance */}
               <Box sx={{ width: 48 }} />
               
               {/* Título centrado */}
               <Typography 
                 variant="h6" 
                 noWrap 
                 component="div"
                 sx={{
                   position: 'absolute',
                   left: '50%',
                   transform: 'translateX(-50%)'
                 }}
               >
                 ControlAudit
               </Typography>
               
               <Box sx={{ display: 'flex', alignItems: 'center' }}>
                 <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                   {userEmail}
                 </Typography>
               </Box>
             </Box>
            
                         {/* Fila inferior: Botón hamburguesa y botones de navegación */}
             <Box sx={{ 
               display: 'flex', 
               justifyContent: 'space-between',
               alignItems: 'center',
               width: '100%',
               mt: 0.5
             }}>
              {/* Lado izquierdo: Botón hamburguesa */}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
              
              {/* Centro: Botones de navegación */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  color="inherit"
                  onClick={() => handleMenuClick('auditoria')}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    px: { xs: 2, sm: 3 },
                    py: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Auditoría
                </Button>
                <Button
                  color="inherit"
                  onClick={() => handleMenuClick('reporte')}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    px: { xs: 2, sm: 3 },
                    py: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Reportes
                </Button>
              </Box>
              
              {/* Lado derecho: Espacio vacío para balance */}
              <Box sx={{ width: 48 }} />
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
               <Box 
           className="apk-content-container flex-scroll-content"
           sx={{ 
             flex: 1, 
             overflow: 'auto',
             overflowY: 'scroll',
             WebkitOverflowScrolling: 'touch',
             pt: isMobile ? 'calc(140px + env(safe-area-inset-top, 20px))' : '130px',
             pb: isMobile ? 'env(safe-area-inset-bottom, 20px)' : 0,
             minHeight: 0,
             marginTop: 0
           }}
         >
        {children}
      </Box>
    </div>
  );
};

export default APKNavigation;
