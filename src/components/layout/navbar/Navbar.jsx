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
import { getMenuItems } from "../../../router/navigation";
import { logout } from "../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Switch from '@mui/material/Switch';
import { useColorMode } from '../../context/ColorModeContext';
import { usePWAInstall } from '../../../hooks/usePWAInstall';
import GetAppIcon from '@mui/icons-material/GetApp';
import InfoIcon from '@mui/icons-material/Info';
import OfflineIndicator from '../../common/OfflineIndicator';
import OfflineIndicatorMobile from '../../common/OfflineIndicatorMobile';

const drawerWidth = 240;

function Navbar(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logoutContext, user, role, permisos, userProfile } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canInstall, handleInstall, handleShowInfo } = usePWAInstall();

  // Obtener menú dinámico basado en rol y permisos
  const menuItems = getMenuItems(role, permisos);

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
        {menuItems.map(({ id, path, title, Icon }) => (
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

        {/* Botones PWA - solo si se puede instalar */}
        {canInstall && (
          <>
            
            <ListItem disablePadding>
              <ListItemButton onClick={handleShowInfo}>
                <ListItemIcon>
                  <InfoIcon sx={{ color: "whitesmoke" }} />
                </ListItemIcon>
                <ListItemText primary={"Info App"} sx={{ color: "whitesmoke" }} />
              </ListItemButton>
            </ListItem>
          </>
        )}

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
          minHeight: { xs: 48, sm: 56 }, 
          height: { xs: 48, sm: 56 },
          zIndex: theme.zIndex.drawer + 1,
          borderRadius: '0 !important',
          boxShadow: 'none !important',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          '&.MuiAppBar-root': {
            borderRadius: '0 !important',
            boxShadow: 'none !important'
          }
        }}
      >
        <Toolbar sx={{
          gap: { xs: 1, sm: 2 },
          display: "flex",
          justifyContent: { xs: "space-between", md: "center" },
          alignItems: "center",
          minHeight: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          px: { xs: 1, sm: 1 },
          py: 0,
          position: "relative",
          '& > *': {
            display: 'flex',
            alignItems: 'center'
          }
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

          {/* Navegación en móvil - lado izquierdo */}
          <Box sx={{ 
            display: { xs: 'flex', md: 'none' }, 
            gap: 1,
            alignItems: 'center',
            height: '100%'
          }}>
            <Link to={getDashboardRoute()} style={{ 
              color: "whitesmoke", 
              textDecoration: "none", 
              fontSize: '0.8rem',
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: '3px',
              transition: 'background-color 0.2s',
              lineHeight: 1,
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              height: '100%'
            }}>
              Dashboard
            </Link>
            <Link to="/auditoria" style={{ 
              color: "whitesmoke", 
              textDecoration: "none", 
              fontSize: '0.8rem',
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: '3px',
              transition: 'background-color 0.2s',
              lineHeight: 1,
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              height: '100%'
            }}>
              Auditoria
            </Link>
          </Box>

          {/* Controles del lado derecho - desktop */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            gap: 1,
            position: 'absolute',
            right: { xs: 8, sm: 60 }
          }}>
            {/* Indicador offline */}
            {userProfile && (
              <OfflineIndicator userProfile={userProfile} />
            )}

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

          {/* Controles del lado derecho - móvil */}
          <Box sx={{ 
            display: { xs: 'flex', sm: 'none' }, 
            alignItems: 'center', 
            gap: 1,
            height: '100%'
          }}>
            {/* Indicador offline para móvil */}
            {userProfile && (
              <OfflineIndicatorMobile userProfile={userProfile} />
            )}

            {/* Switch de tema para móvil */}
            <IconButton 
              onClick={toggleColorMode} 
              color="inherit" 
              aria-label="Alternar modo claro/oscuro"
              size="small"
              sx={{ 
                width: 32,
                height: 32,
                '& .MuiSvgIcon-root': {
                  fontSize: '1.1rem'
                }
              }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            
            {/* Botón de menú hamburguesa */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              sx={{ 
                width: 32,
                height: 32,
                '& .MuiSvgIcon-root': {
                  fontSize: '1.2rem'
                },
                '&:focus': {
                  outline: 'none'
                },
                '&:active': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Botón de menú hamburguesa para desktop */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            gap: 1,
            position: 'absolute',
            right: 8
          }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              sx={{ 
                width: 40,
                height: 40,
                '& .MuiSvgIcon-root': {
                  fontSize: '1.4rem'
                },
                '&:focus': {
                  outline: 'none'
                },
                '&:active': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
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
            display: { xs: "block", sm: "block" },
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
          py: { xs: 0.2, sm: 1, md: 2 }, 
          width: "100%", 
          minHeight: "100vh", 
          px: { xs: 0.2, sm: 1, md: 2 },
          mt: { xs: 0, sm: 1 } // Sin margen superior en móvil
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Navbar;