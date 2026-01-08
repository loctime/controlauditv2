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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { Link, useNavigate, Outlet } from "react-router-dom";
import "./Navbar.css";
import { useState } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "../../../firebaseControlFile";
import { useAuth } from '@/components/context/AuthContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Switch from '@mui/material/Switch';
import { useColorMode } from '../../context/ColorModeContext';
import { usePWAInstall } from '../../../hooks/usePWAInstall';
import GetAppIcon from '@mui/icons-material/GetApp';
import InfoIcon from '@mui/icons-material/Info';
import OfflineIndicator from '../../common/OfflineIndicator';
import OfflineIndicatorMobile from '../../common/OfflineIndicatorMobile';
import { getNavbarItems, getSidebarItems } from '../../../config/menuConfig';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import GlobalFiltersBar from '../GlobalFiltersBar';

const drawerWidth = 240;

function Navbar(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElHigiene, setAnchorElHigiene] = useState(null);
  const [anchorElEmpresarial, setAnchorElEmpresarial] = useState(null);
  const navigate = useNavigate();
  const { logoutContext, user, role, permisos, userProfile, bloqueado, isLogged } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canInstall, handleInstall, handleShowInfo } = usePWAInstall();

  const isBloqueado = bloqueado || permisos?.bloqueado || userProfile?.bloqueado || false;
  const navbarItems = role ? getNavbarItems(role, permisos || {}) : { simple: [], higiene: [], empresarial: [] };
  const sidebarItems = role ? getSidebarItems(role, permisos || {}) : [];

  const renderNavLink = (item) => (
    <Link 
      key={item.id} 
      to={item.path} 
      style={{ 
        color: "#ffffff", 
        textDecoration: "none", 
        fontSize: '0.95rem', 
        padding: '8px 12px', 
        lineHeight: 1.2,
        borderRadius: '4px',
        transition: 'background-color 0.2s'
      }}
    >
      {item.label}
    </Link>
  );

  const renderMobileNavLink = (item) => (
    <Link 
      key={item.id} 
      to={item.path} 
      style={{ 
        color: "#ffffff", 
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
      }}
    >
      {item.label}
    </Link>
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    logoutContext();
    navigate("/login");
  };

  const handleHigieneMenuOpen = (event) => {
    setAnchorElHigiene(event.currentTarget);
  };

  const handleHigieneMenuClose = () => {
    setAnchorElHigiene(null);
  };

  const handleEmpresarialMenuOpen = (event) => {
    setAnchorElEmpresarial(event.currentTarget);
  };

  const handleEmpresarialMenuClose = () => {
    setAnchorElEmpresarial(null);
  };

  const drawer = (
    <div>
      <Toolbar />
      {user && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ color: '#ffffff', fontSize: '0.9rem' }}>
            <div>Usuario: {user.email}</div>
          </Box>
        </Box>
      )}
      {isBloqueado ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Tu cuenta está bloqueada. Contacta al administrador.
            </Typography>
          </Alert>
        </Box>
      ) : (
        <List>
          {sidebarItems.map((item) => (
            <Link key={item.id} to={item.path} style={{ textDecoration: 'none' }}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => setMobileOpen(false)}>
                  <ListItemIcon>
                    <item.icon sx={{ color: "#ffffff" }} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} sx={{ color: "#ffffff" }} />
                </ListItemButton>
              </ListItem>
            </Link>
          ))}

          {canInstall && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleShowInfo}>
                <ListItemIcon>
                  <InfoIcon sx={{ color: "#ffffff" }} />
                </ListItemIcon>
                <ListItemText primary={"Info App"} sx={{ color: "#ffffff" }} />
              </ListItemButton>
            </ListItem>
          )}

          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: "#ffffff" }} />
              </ListItemIcon>
              <ListItemText primary={"Cerrar sesión"} sx={{ color: "#ffffff" }} />
            </ListItemButton>
          </ListItem>
        </List>
      )}
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
          {!isBloqueado && (
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              gap: 2, 
              alignItems: 'center',
              flex: 1
            }}>
              {navbarItems.simple.map(item => renderNavLink(item))}
              
              {navbarItems.empresarial.length > 0 && (
                <>
                  <Box 
                    onClick={handleEmpresarialMenuOpen}
                    sx={{
                      color: "#ffffff",
                      fontSize: '0.95rem',
                      padding: '8px 12px',
                      lineHeight: 1.2,
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Gestión Empresarial
                    <KeyboardArrowDownIcon sx={{ fontSize: '1rem' }} />
                  </Box>
                  <Menu
                    anchorEl={anchorElEmpresarial}
                    open={Boolean(anchorElEmpresarial)}
                    onClose={handleEmpresarialMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    PaperProps={{
                      sx: {
                        backgroundColor: theme.palette.primary.main,
                        color: '#ffffff',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          },
                        },
                      },
                    }}
                  >
                    {navbarItems.empresarial.map(item => (
                      <MenuItem key={item.id} onClick={handleEmpresarialMenuClose}>
                        <Link to={item.path} style={{ 
                          color: '#ffffff', 
                          textDecoration: 'none',
                          width: '100%'
                        }}>
                          {item.label}
                        </Link>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
              
              {navbarItems.higiene.length > 0 && (
                <>
                  <Box 
                    onClick={handleHigieneMenuOpen}
                    sx={{
                      color: "#ffffff",
                      fontSize: '0.95rem',
                      padding: '8px 12px',
                      lineHeight: 1.2,
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Dashboard Higiene y Seguridad
                    <KeyboardArrowDownIcon sx={{ fontSize: '1rem' }} />
                  </Box>
                  <Menu
                    anchorEl={anchorElHigiene}
                    open={Boolean(anchorElHigiene)}
                    onClose={handleHigieneMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    PaperProps={{
                      sx: {
                        backgroundColor: theme.palette.primary.main,
                        color: '#ffffff',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          },
                        },
                      },
                    }}
                  >
                    {navbarItems.higiene.map(item => (
                      <MenuItem key={item.id} onClick={handleHigieneMenuClose}>
                        <Link to={item.path} style={{ 
                          color: '#ffffff', 
                          textDecoration: 'none',
                          width: '100%'
                        }}>
                          {item.label}
                        </Link>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
            </Box>
          )}

          {!isBloqueado && (
            <Box sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              gap: 1,
              alignItems: 'center',
              height: '100%'
            }}>
              {navbarItems.simple.map(item => renderMobileNavLink(item))}
              
              {navbarItems.higiene.length > 0 && (
                <>
                  <Box 
                    onClick={handleHigieneMenuOpen}
                    sx={{
                      color: "#ffffff",
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '3px',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      height: '100%',
                      lineHeight: 1,
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Dash
                    <KeyboardArrowDownIcon sx={{ fontSize: '0.75rem' }} />
                  </Box>
                  <Menu
                    anchorEl={anchorElHigiene}
                    open={Boolean(anchorElHigiene)}
                    onClose={handleHigieneMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    PaperProps={{
                      sx: {
                        backgroundColor: theme.palette.primary.main,
                        color: '#ffffff',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          },
                        },
                      },
                    }}
                  >
                    {navbarItems.higiene.map(item => (
                      <MenuItem key={item.id} onClick={handleHigieneMenuClose}>
                        <Link to={item.path} style={{ 
                          color: '#ffffff', 
                          textDecoration: 'none',
                          width: '100%'
                        }}>
                          {item.label}
                        </Link>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
              
              {navbarItems.empresarial.length > 0 && (
                <>
                  <Box 
                    onClick={handleEmpresarialMenuOpen}
                    sx={{
                      color: "#ffffff",
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '3px',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      height: '100%',
                      lineHeight: 1,
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Empresarial
                    <KeyboardArrowDownIcon sx={{ fontSize: '0.75rem' }} />
                  </Box>
                  <Menu
                    anchorEl={anchorElEmpresarial}
                    open={Boolean(anchorElEmpresarial)}
                    onClose={handleEmpresarialMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    PaperProps={{
                      sx: {
                        backgroundColor: theme.palette.primary.main,
                        color: '#ffffff',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          },
                        },
                      },
                    }}
                  >
                    {navbarItems.empresarial.map(item => (
                      <MenuItem key={item.id} onClick={handleEmpresarialMenuClose}>
                        <Link to={item.path} style={{ 
                          color: '#ffffff', 
                          textDecoration: 'none',
                          width: '100%'
                        }}>
                          {item.label}
                        </Link>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
            </Box>
          )}

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
      
      {/* Filtros globales - solo si el usuario está autenticado */}
      {isLogged && <GlobalFiltersBar />}
      
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
              backgroundColor: theme.palette.primary.main,
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box 
        component="main" 
        className="main-content-wrapper"
        sx={{ 
          flexGrow: 1, 
          py: { xs: 1, sm: 2, md: 3 }, 
          width: "100%", 
          minHeight: "100vh", 
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Navbar;