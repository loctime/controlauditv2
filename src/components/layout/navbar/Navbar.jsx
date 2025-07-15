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

const drawerWidth = 200;

function Navbar(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logoutContext, user, role, permisos } = useAuth();
  const { mode, toggleColorMode } = useColorMode();

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

  // Log de información de navegación
  console.log('=== INFORMACIÓN DE NAVEGACIÓN ===');
  console.log('Rol:', role);
  console.log('Permisos:', permisos);
  console.log('Menú generado:', menuItems.map(item => item.title));
  console.log('Total de items en menú:', menuItems.length);
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
        {menuItems.map(({ id, path, title, Icon }) => (
          <Link key={id} to={path} style={{ textDecoration: 'none' }}>
            <ListItem disablePadding>
              <ListItemButton>
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
      <AppBar position="fixed" sx={{ width: "100%", minHeight: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}>
        <Toolbar sx={{
          gap: "20px",
          display: "flex",
          justifyContent: "space-between",
          minHeight: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          px: 1,
          py: 0,
        }}>
          <Link to={getDashboardRoute()} style={{ color: "whitesmoke", textDecoration: "none", fontSize: '0.95rem', padding: '0 8px', lineHeight: 1.2 }}>
            {getDashboardText()}
          </Link> 
          <Link to="/auditoria" style={{ color: "whitesmoke", textDecoration: "none", fontSize: '0.95rem', padding: '0 8px', lineHeight: 1.2 }}>
            Auditoria
          </Link>
          <Link to="/Reporte" style={{ color: "whitesmoke", textDecoration: "none", fontSize: '0.95rem', padding: '0 8px', lineHeight: 1.2 }}>
            Reporte
          </Link>
          <Link to="/perfil" style={{ color: "whitesmoke", textDecoration: "none", fontSize: '0.95rem', padding: '0 8px', lineHeight: 1.2 }}>
            Perfil
          </Link>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Switch de modo claro/oscuro */}
            <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit" aria-label="Alternar modo claro/oscuro">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Switch
              checked={mode === 'dark'}
              onChange={toggleColorMode}
              color="default"
              inputProps={{ 'aria-label': 'switch modo claro/oscuro' }}
              sx={{ my: 0 }}
            />
            <IconButton
              color="secondary.primary"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ my: 0 }}
            >
              <MenuIcon color="secondary.primary" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" aria-label="mailbox folders">
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          anchor={"right"}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor: "#1976d2",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, py: 4, width: "100%", minHeight: "100vh", px: 2 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Navbar;