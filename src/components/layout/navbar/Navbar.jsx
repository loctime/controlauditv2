import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { Link, useNavigate, Outlet } from "react-router-dom";
import "./Navbar.css";
import { useState } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PersonIcon from "@mui/icons-material/Person";
import { getMenuItems } from "../../../router/navigation";
import { logout } from "../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Switch from '@mui/material/Switch';
import { useColorMode } from '../../context/ColorModeContext';

const drawerWidth = 240;

function Navbar(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logoutContext, user, role, permisos } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Obtener menú dinámico basado en rol y permisos
  const menuItems = getMenuItems(role, permisos);
  
  // Elementos adicionales para el drawer móvil (siempre disponibles)
  const mobileAdditionalItems = [
    {
      id: "auditoria-mobile",
      path: "/auditoria",
      title: "Auditoría",
      Icon: ChecklistIcon
    },
    {
      id: "perfil-mobile",
      path: "/perfil",
      title: "Mi Perfil",
      Icon: PersonIcon
    }
  ];
  
  // Verificar qué elementos adicionales no están ya en el menú dinámico
  const existingPaths = menuItems.map(item => item.path);
  const missingItems = mobileAdditionalItems.filter(item => 
    !existingPaths.includes(item.path)
  );
  
  // Combinar menú dinámico con elementos faltantes
  const uniqueMenuItems = [...menuItems, ...missingItems];

  // ✅ Función para obtener la ruta del dashboard según el rol
  const getDashboardRoute = () => {
    switch (role) {
      case 'supermax':
        return '/dashboard';
      case 'max':
        return '/cliente-dashboard';
      case 'operario':
        return '/operario-dashboard';
      default:
        return '/';
    }
  };

  // ✅ Función para obtener el texto del dashboard según el rol
  const getDashboardText = () => {
    switch (role) {
      case 'supermax':
        return 'Panel de Control';
      case 'max':
        return 'Calendario';
      case 'operario':
        return 'Mi Dashboard';
      default:
        return 'Dashboard';
    }
  };

  // Log de información de navegación
  console.log('=== INFORMACIÓN DE NAVEGACIÓN ===');
  console.log('Rol:', role);
  console.log('Permisos:', permisos);
  console.log('Menú dinámico:', menuItems.map(item => item.title));
  console.log('Elementos agregados para móvil:', missingItems.map(item => item.title));
  console.log('Menú completo (móvil):', uniqueMenuItems.map(item => item.title));
  console.log('Total de items en menú:', uniqueMenuItems.length);
  console.log('Dashboard route:', getDashboardRoute());
  console.log('Dashboard text:', getDashboardText());
  console.log('==================================');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    logoutContext();
    navigate("/login");
  };

  const drawer = (
    <div>
      <Toolbar />
      {user && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ color: 'whitesmoke', fontSize: '0.9rem' }}>
            <div>Usuario: {user.email}</div>
          </Box>
        </Box>
      )}
      <List>
        {uniqueMenuItems.map(({ id, path, title, Icon }) => (
          <Link key={id} to={path} style={{ textDecoration: 'none' }}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setMobileOpen(false)}>
                <ListItemIcon>
                  <Icon sx={{ color: "whitesmoke" }} />
                </ListItemIcon>
                <ListItemText primary={title} sx={{ color: "whitesmoke" }} />
              </ListItemButton>
            </ListItem>
          </Link>
        ))}

        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon sx={{ color: "whitesmoke" }} />
            </ListItemIcon>
            <ListItemText primary={"Cerrar sesión"} sx={{ color: "whitesmoke" }} />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        sx={{ 
          width: "100%", 
          minHeight: { xs: 56, sm: 64 }, 
          height: { xs: 56, sm: 64 },
          zIndex: theme.zIndex.drawer + 1,
          // Extender hasta arriba en móvil para cubrir la barra de estado
          top: 0,
          height: { xs: `calc(56px + env(safe-area-inset-top, 0px))`, sm: 64 },
          backgroundColor: '#1976d2'
        }}
      >
                                   <Toolbar sx={{
            gap: { xs: 1, sm: 2 },
            display: "flex",
            justifyContent: "space-between",
            minHeight: { xs: 56, sm: 64 },
            height: { xs: 56, sm: 64 },
            px: { xs: 0, sm: 1 }, // Sin padding horizontal en móvil
            py: 0,
            pr: { xs: 0, sm: 1 }, // Sin padding derecho en móvil
            // Ajustar padding superior para safe areas
            paddingTop: { xs: `env(safe-area-inset-top, 0px)`, sm: 0 },
            minHeight: { xs: `calc(56px + env(safe-area-inset-top, 0px))`, sm: 64 }
          }}>
           
          {/* Navegación principal - oculta en móvil */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            gap: 2, 
            alignItems: 'center',
            flex: 1
          }}>
            <Link to={getDashboardRoute()} style={{ 
              color: "whitesmoke", 
              textDecoration: "none", 
              fontSize: '0.95rem', 
              padding: '8px 12px', 
              lineHeight: 1.2,
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}>
              {getDashboardText()}
            </Link> 
            <Link to="/auditoria" style={{ 
              color: "whitesmoke", 
              textDecoration: "none", 
              fontSize: '0.95rem', 
              padding: '8px 12px', 
              lineHeight: 1.2,
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}>
              Auditoria
            </Link>
            <Link to="/reporte" style={{ 
              color: "whitesmoke", 
              textDecoration: "none", 
              fontSize: '0.95rem', 
              padding: '8px 12px', 
              lineHeight: 1.2,
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}>
              Reporte
            </Link>
            <Link to="/perfil" style={{ 
              color: "whitesmoke", 
              textDecoration: "none", 
              fontSize: '0.95rem', 
              padding: '8px 12px', 
              lineHeight: 1.2,
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}>
              Perfil
            </Link>
          </Box>

                     {/* Navegación móvil - título y botones adicionales */}
                       <Box sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 1.5, sm: 2.5 }
            }}>
                           <Link to={getDashboardRoute()} style={{ 
                color: "whitesmoke", 
                textDecoration: "none", 
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                padding: { xs: '3px 6px', sm: '4px 8px' },
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}>
                {getDashboardText()}
              </Link>
             
                           {/* Botones adicionales en móvil */}
                             <Link to="/auditoria" style={{ 
                 color: "whitesmoke", 
                 textDecoration: "none", 
                 fontSize: { xs: '0.7rem', sm: '0.8rem' },
                 padding: { xs: '3px 6px', sm: '4px 8px' },
                 borderRadius: '4px',
                 transition: 'background-color 0.2s',
                 display: 'flex',
                 alignItems: 'center',
                 gap: { xs: 0.3, sm: 0.5 },
                 '&:hover': {
                   backgroundColor: 'rgba(255,255,255,0.1)'
                 }
               }}>
                 <ChecklistIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
                 <span>Auditoría</span>
               </Link>
              
                             <Link to="/perfil" style={{ 
                 color: "whitesmoke", 
                 textDecoration: "none", 
                 fontSize: { xs: '0.7rem', sm: '0.8rem' },
                 padding: { xs: '3px 6px', sm: '4px 8px' },
                 borderRadius: '4px',
                 transition: 'background-color 0.2s',
                 display: 'flex',
                 alignItems: 'center',
                 gap: { xs: 0.3, sm: 0.5 },
                 '&:hover': {
                   backgroundColor: 'rgba(255,255,255,0.1)'
                 }
               }}>
                 <PersonIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
                 <span>Perfil</span>
               </Link>
           </Box>

                                           <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              {/* Switch de modo claro/oscuro - oculto en móvil muy pequeño */}
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <IconButton onClick={toggleColorMode} color="inherit" aria-label="Alternar modo claro/oscuro">
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggleColorMode}
                  color="default"
                  inputProps={{ 'aria-label': 'switch modo claro/oscuro' }}
                  sx={{ my: 0 }}
                />
              </Box>
              
                                            {/* Botón de menú - lado derecho en móvil */}
                <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="end"
                    onClick={handleDrawerToggle}
                    sx={{ 
                      my: 0,
                      ml: { xs: 1, sm: 2 },
                      mr: 0, // Pegado al borde derecho
                      pr: 0, // Sin padding derecho
                      pl: { xs: 0, sm: 0 } // Sin padding izquierdo en móvil
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
            </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="nav" aria-label="mailbox folders">
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          anchor="right"
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móvil
          }}
          sx={{
            display: { xs: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: { xs: '85vw', sm: drawerWidth },
              maxWidth: drawerWidth,
              backgroundColor: "#1976d2",
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: { xs: 0.5, sm: 1, md: 2 }, 
          width: "100%", 
          minHeight: "100vh", 
          px: { xs: 0.5, sm: 1, md: 2 },
          // Ajustar margen superior para considerar AppBar con safe areas
          mt: { xs: `calc(56px + env(safe-area-inset-top, 0px))`, sm: 64, md: 64 }
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Navbar;