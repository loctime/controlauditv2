import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  useTheme,
  useMediaQuery,
  alpha,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import EmailIcon from '@mui/icons-material/Email';
import Auditoria from './Auditoria';

// Componente wrapper para auditoría en APK con navegación
const AuditoriaAPK = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const isAuditoria = location.pathname === '/' || location.pathname === '/auditoria';
  const isReportes = location.pathname === '/reportes';

  // Obtener datos del usuario del localStorage
  const userEmail = localStorage.getItem('userEmail') || 'Usuario';
  const userRole = localStorage.getItem('userRole') || 'user';

  const handleNavigateToReportes = () => {
    navigate('/reportes');
  };

  const handleNavigateToAuditoria = () => {
    navigate('/');
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuClick = (action) => {
    setDrawerOpen(false);
    switch (action) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'profile':
        navigate('/perfil');
        break;
      case 'logout':
        localStorage.clear();
        navigate('/login');
        break;
      default:
        break;
    }
  };

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
           // Agregar padding superior para separar de la barra de estado
           pt: isMobile ? 'env(safe-area-inset-top, 20px)' : 0,
           // Agregar altura explícita para que se vea el cambio
           height: isMobile ? '120px' : '110px',
           minHeight: isMobile ? '120px' : '110px'
         }}
       >
         <Toolbar sx={{ 
           minHeight: isMobile ? '120px' : '110px', // Aumentado un poco
          px: isMobile ? 3 : 4, // Aumentado padding horizontal
          py: isMobile ? 2 : 2.5, // Aumentado padding vertical
          // Agregar padding superior adicional para móvil
          paddingTop: isMobile ? 'calc(env(safe-area-inset-top, 20px) + 16px)' : undefined,
          // Cambiar layout para poner botones abajo
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'stretch'
        }}>
                                 {/* Título en la parte superior */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flex: 1,
              // Agregar margen superior para evitar la cámara frontal
              mt: isMobile ? 2 : 0
            }}>
              <Typography 
                variant={isMobile ? "h4" : "h3"}
                sx={{ 
                  fontWeight: 600,
                  fontSize: isMobile ? '1.3rem' : '1.6rem',
                  textAlign: 'center'
                }}
              >
                ControlAudit
              </Typography>
            </Box>
          
                     {/* Botones en la parte inferior */}
           <Box sx={{ 
             display: 'flex', 
             gap: 1.5, // Reducido el gap entre botones
             justifyContent: 'center',
             alignItems: 'center',
             mb: isMobile ? 1 : 0, // Agregar margen inferior para subirlos
             position: 'relative' // Para posicionar el botón de menú
           }}>
             <Button
               variant={isAuditoria ? "contained" : "outlined"}
               startIcon={<AssignmentIcon />}
               onClick={handleNavigateToAuditoria}
               sx={{
                 minWidth: 'auto',
                 px: isMobile ? 1.5 : 2.5, // Reducido padding horizontal
                 py: isMobile ? 0.75 : 1, // Reducido padding vertical
                 fontSize: isMobile ? '0.7rem' : '0.8rem', // Reducido tamaño de fuente
                 bgcolor: isAuditoria ? 'white' : 'transparent',
                 color: isAuditoria ? 'primary.main' : 'white',
                 borderColor: 'white',
                 borderRadius: 1.5, // Reducido border radius
                 '&:hover': {
                   bgcolor: isAuditoria ? alpha(theme.palette.common.white, 0.9) : alpha(theme.palette.common.white, 0.1)
                 }
               }}
             >
               {isMobile ? 'Auditoría' : 'Nueva Auditoría'}
             </Button>
             
             <Button
               variant={isReportes ? "contained" : "outlined"}
               startIcon={<AssessmentIcon />}
               onClick={handleNavigateToReportes}
               sx={{
                 minWidth: 'auto',
                 px: isMobile ? 1.5 : 2.5, // Reducido padding horizontal
                 py: isMobile ? 0.75 : 1, // Reducido padding vertical
                 fontSize: isMobile ? '0.7rem' : '0.8rem', // Reducido tamaño de fuente
                 bgcolor: isReportes ? 'white' : 'transparent',
                 color: isReportes ? 'primary.main' : 'white',
                 borderColor: 'white',
                 borderRadius: 1.5, // Reducido border radius
                 '&:hover': {
                   bgcolor: isReportes ? alpha(theme.palette.common.white, 0.9) : alpha(theme.palette.common.white, 0.1)
                 }
               }}
             >
               {isMobile ? 'Reportes' : 'Ver Reportes'}
             </Button>

             {/* Botón de menú hamburguesa en la misma fila */}
             <IconButton
               onClick={handleDrawerToggle}
               sx={{
                 color: 'white',
                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
                 ml: 1, // Margen izquierdo para separarlo de los botones
                 '&:hover': {
                   backgroundColor: 'rgba(255, 255, 255, 0.2)'
                 }
               }}
             >
               <MenuIcon />
             </IconButton>
           </Box>
        </Toolbar>
      </AppBar>

             {/* Contenido principal */}
       <Box sx={{ flex: 1, overflow: 'hidden' }}>
         <Auditoria />
       </Box>

       {/* Drawer del menú */}
       <Drawer
         anchor="right"
         open={drawerOpen}
         onClose={handleDrawerToggle}
         sx={{
           zIndex: 9999, // Asegurar que esté por encima de todo
           '& .MuiDrawer-paper': {
             width: '50vw',
             maxWidth: '300px',
             backgroundColor: theme.palette.background.paper,
             boxShadow: '-4px 0 8px rgba(0,0,0,0.15)',
             zIndex: 9999 // Asegurar que el papel del drawer esté por encima
           }
         }}
       >
         <Box sx={{ p: 2, pt: 4 }}>
           {/* Header del drawer */}
           <Box sx={{ 
             display: 'flex', 
             alignItems: 'center', 
             mb: 3,
             pb: 2,
             borderBottom: `1px solid ${theme.palette.divider}`
           }}>
             <Avatar sx={{ 
               bgcolor: theme.palette.primary.main, 
               mr: 2,
               width: 48,
               height: 48
             }}>
               <PersonIcon />
             </Avatar>
             <Box>
               <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                 {userEmail}
               </Typography>
               <Typography variant="body2" color="text.secondary">
                 {userRole === 'admin' ? 'Administrador' : 'Usuario'}
               </Typography>
             </Box>
           </Box>

           {/* Lista de opciones del menú */}
           <List>
             {/* Email del login */}
             <ListItem button sx={{ mb: 1, borderRadius: 1 }}>
               <ListItemIcon>
                 <EmailIcon color="primary" />
               </ListItemIcon>
               <ListItemText 
                 primary="Email" 
                 secondary={userEmail}
                 primaryTypographyProps={{ fontSize: '0.9rem' }}
                 secondaryTypographyProps={{ fontSize: '0.8rem' }}
               />
             </ListItem>

             <Divider sx={{ my: 2 }} />

             {/* Calendario/Dashboard según rol */}
             <ListItem 
               button 
               onClick={() => handleMenuClick('dashboard')}
               sx={{ mb: 1, borderRadius: 1 }}
             >
               <ListItemIcon>
                 {userRole === 'admin' ? (
                   <DashboardIcon color="primary" />
                 ) : (
                   <CalendarTodayIcon color="primary" />
                 )}
               </ListItemIcon>
               <ListItemText 
                 primary={userRole === 'admin' ? 'Dashboard' : 'Calendario'}
                 primaryTypographyProps={{ fontSize: '0.9rem' }}
               />
             </ListItem>

             {/* Perfil */}
             <ListItem 
               button 
               onClick={() => handleMenuClick('profile')}
               sx={{ mb: 1, borderRadius: 1 }}
             >
               <ListItemIcon>
                 <PersonIcon color="primary" />
               </ListItemIcon>
               <ListItemText 
                 primary="Perfil"
                 primaryTypographyProps={{ fontSize: '0.9rem' }}
               />
             </ListItem>

             <Divider sx={{ my: 2 }} />

             {/* Cerrar sesión */}
             <ListItem 
               button 
               onClick={() => handleMenuClick('logout')}
               sx={{ 
                 mb: 1, 
                 borderRadius: 1,
                 backgroundColor: 'error.light',
                 color: 'error.contrastText',
                 '&:hover': {
                   backgroundColor: 'error.main'
                 }
               }}
             >
               <ListItemIcon>
                 <LogoutIcon sx={{ color: 'inherit' }} />
               </ListItemIcon>
               <ListItemText 
                 primary="Cerrar Sesión"
                 primaryTypographyProps={{ fontSize: '0.9rem' }}
               />
             </ListItem>
           </List>
         </Box>
       </Drawer>
     </div>
   );
 };

export default AuditoriaAPK;
