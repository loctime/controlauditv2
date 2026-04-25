import logger from '@/utils/logger';
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
import { useState, useEffect } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "../../../firebaseControlFile";
import { useAuth } from '@/components/context/AuthContext';
import { useGlobalSelection } from '@/hooks/useGlobalSelection';
import EmpresaSelector from '@/components/dashboard-seguridad/EmpresaSelector';
import SucursalSelector from '@/components/dashboard-seguridad/SucursalSelector';
import { Select, FormControl, Tooltip } from '@mui/material';
import { CalendarToday, DateRange } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { usePWAInstall } from '../../../hooks/usePWAInstall';
import GetAppIcon from '@mui/icons-material/GetApp';
import InfoIcon from '@mui/icons-material/Info';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TriangularEmpresaSucursalSelector from './TriangularEmpresaSucursalSelector';
import OfflineIndicator from '../../common/OfflineIndicator';
import OfflineIndicatorMobile from '../../common/OfflineIndicatorMobile';
import { getSidebarItems } from '../../../config/menuConfig';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import SuperdevSelector from '../../common/SuperdevSelector';
import { getGroupedMenuOrEmpty, MENU_GROUP_LABELS } from '../../../router/menuBuilder';
import OnboardingBar from '../../onboarding/OnboardingBar';
import OnboardingWizard from '../../onboarding/OnboardingWizard';
import OnboardingWelcome from '../../onboarding/OnboardingWelcome';
const drawerWidth = 240;

function Navbar(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchors, setMenuAnchors] = useState({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const navigate = useNavigate();
  const { logoutContext, user, role, permisos, userProfile, bloqueado, isLogged, userContext, selectedOwnerId, getEffectiveOwnerId } = useAuth();
  const {
    empresasDisponibles,
    sucursalesDisponibles,
    selectedEmpresa: navSelectedEmpresa,
    selectedSucursal: navSelectedSucursal,
    setEmpresa: navSetEmpresa,
    setSucursal: navSetSucursal,
  } = useGlobalSelection();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canInstall, handleInstall, handleShowInfo } = usePWAInstall();

  // Estado para mostrar el owner seleccionado (solo para tu UID)
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState(null);

  // Obtener el ownerId efectivo
  const effectiveOwnerId = getEffectiveOwnerId();

  // Cargar email del owner seleccionado (solo para tu UID específico)
  useEffect(() => {
    if (user?.uid === 'rixIn0BwiVPHB4SgR0K0SlnpSLC2' && selectedOwnerId && selectedOwnerId !== user.uid) {
      // Cargar email/displayName del owner seleccionado
      const loadOwnerEmail = async () => {
        try {
          const ownerRef = doc(dbAudit, ...firestoreRoutesCore.owner(selectedOwnerId));
          const ownerDoc = await getDoc(ownerRef);
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data();
            setSelectedOwnerEmail(ownerData.displayName || ownerData.email || selectedOwnerId);
          } else {
            setSelectedOwnerEmail(selectedOwnerId);
          }
        } catch (error) {
          logger.error('[Navbar] Error cargando email del owner seleccionado:', error);
          setSelectedOwnerEmail(selectedOwnerId);
        }
      };
      loadOwnerEmail();
    } else {
      setSelectedOwnerEmail(null);
    }
  }, [user, selectedOwnerId]);

  const isBloqueado = bloqueado || permisos?.bloqueado || userProfile?.bloqueado || false;
  const sidebarItems = role ? getSidebarItems(role, userProfile || {}) : [];
  const groupedMenu = role
    ? getGroupedMenuOrEmpty({ role, superdev: userProfile?.superdev === true })
    : getGroupedMenuOrEmpty({ role: null, superdev: false });

  const handleGroupMenuOpen = (groupKey) => (event) => {
    setMenuAnchors((prev) => ({ ...prev, [groupKey]: event.currentTarget }));
  };

  const handleGroupMenuClose = (groupKey) => () => {
    setMenuAnchors((prev) => ({ ...prev, [groupKey]: null }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    logoutContext();
    navigate("/login");
  };

  const renderProfileLink = () => {
    const items = groupedMenu.sistema || [];
    if (!items.length) return null;

    // Usamos el primer ítem visible de la sección sistema (normalmente /perfil)
    const perfilRoute = items[0];

    return (
      <Link
        key={perfilRoute.id}
        to={perfilRoute.path}
        style={{
          color: "#ffffff",
          textDecoration: "none",
          fontSize: "1.1rem",
          fontWeight: 600,
          padding: "10px 16px",
          lineHeight: 1.2,
          borderRadius: "6px",
          transition: "background-color 0.2s",
        }}
      >
        {perfilRoute.label}
      </Link>
    );
  };

  const renderGroupDropdown = (groupKey) => {
    const items = groupedMenu[groupKey] || [];
    if (items.length === 0) return null;

    const anchorEl = menuAnchors[groupKey] || null;
    const label = MENU_GROUP_LABELS[groupKey] || groupKey;

    return (
      <Box key={groupKey} sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          onClick={handleGroupMenuOpen(groupKey)}
          sx={{
            color: "#ffffff",
            fontSize: '1.1rem',
            fontWeight: 600,
            padding: '10px 16px',
            lineHeight: 1.2,
            borderRadius: '6px',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.15)',
            },
          }}
        >
          {label}
          <KeyboardArrowDownIcon sx={{ fontSize: '1.2rem' }} />
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleGroupMenuClose(groupKey)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.primary.main,
              color: '#ffffff',
              '& .MuiMenuItem-root': {
                color: '#ffffff',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              },
            },
          }}
        >
          {items.map((route) => (
            <MenuItem
              key={route.id}
              onClick={handleGroupMenuClose(groupKey)}
            >
              <Link
                to={route.path}
                style={{ color: '#ffffff', textDecoration: 'none', width: '100%' }}
              >
                {route.label}
              </Link>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
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
      {/* Los selectores Empresa/Sucursal en móvil se muestran en la fila inferior del navbar */}
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
          {sidebarItems.map((item) => {
            if (item.type === "section") {
              return (
                <ListItem key={item.id} sx={{ pt: 1.5, pb: 0.5 }}>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  />
                </ListItem>
              );
            }

            return (
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
            );
          })}

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
        {/* Navegación principal (una sola fila, también en móvil) */}
        <Toolbar sx={{
          gap: { xs: 0.5, sm: 1.5 },
          display: "flex",
          justifyContent: { xs: "space-between", md: "center" },
          alignItems: "center",
          minHeight: { xs: 60, sm: 64 },
          height: { xs: 'auto', sm: 'auto' },
          py: { xs: 0, sm: 1 },
          pt: { xs: 'calc(0px + env(safe-area-inset-top))', sm: 'calc(8px + env(safe-area-inset-top))' },
          px: { xs: 0, sm: 1 },
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
          flexDirection: { xs: 'row', md: 'row' },
          '& > *': {
            display: 'flex',
            alignItems: 'center'
          }
        }}>
          {!isBloqueado && (
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              gap: 1, 
              alignItems: 'center',
              flex: 1,
              flexWrap: 'nowrap'
            }}>
              {(() => {
                const gestionItems = groupedMenu.gestion || [];
                const calendarioRoute = gestionItems.find(item => item.id === 'panel');
                if (calendarioRoute) {
                  return (
                    <Link
                      key={calendarioRoute.id}
                      to={calendarioRoute.path}
                      style={{
                        color: "#ffffff",
                        textDecoration: "none",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        padding: "10px 16px",
                        lineHeight: 1.2,
                        borderRadius: "6px",
                        transition: "background-color 0.2s",
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.15)',
                        },
                      }}
                    >
                      {calendarioRoute.label}
                    </Link>
                  );
                }
                return renderGroupDropdown('gestion');
              })()}
              {renderGroupDropdown('empresas')}
              {renderGroupDropdown('auditorias')}
              {renderGroupDropdown('higiene')}
              {renderProfileLink()}
              {empresasDisponibles.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.5, 
                  alignItems: 'center',
                  ml: 0.5,
                  order: 10
                }}>
                  <EmpresaSelector
                    empresas={empresasDisponibles}
                    selectedEmpresa={navSelectedEmpresa}
                    onEmpresaChange={navSetEmpresa}
                    compact={true}
                    embedded={true}
                  />
                  <SucursalSelector
                    sucursales={sucursalesDisponibles}
                    selectedSucursal={navSelectedSucursal}
                    onSucursalChange={navSetSucursal}
                    compact={true}
                    embedded={true}
                  />
                </Box>
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
              {/* En móvil usamos el Drawer como navegación principal */}
            </Box>
          )}

          {/* Controles del lado derecho - desktop */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            gap: 0.25,
            position: 'absolute',
            right: { xs: 8, sm: 8 }
          }}>
            {/* Indicador offline */}
            {userProfile && (
              <OfflineIndicator userProfile={userProfile} />
            )}

            {/* Indicador de owner seleccionado */}
            {selectedOwnerEmail && (
              <Chip
                label={`Viendo como: ${selectedOwnerEmail}`}
                color="warning"
                size="small"
                sx={{
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 152, 0, 0.2)',
                  borderColor: '#ff9800',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              />
            )}

            {/* Selector Superdev (solo visible para usuarios con permisos) */}
            <SuperdevSelector />

            {/* Botón de menú hamburguesa */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              size="small"
              sx={{ 
                width: 24,
                height: 24,
                '& .MuiSvgIcon-root': {
                  fontSize: '0.9rem'
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

          {/* Controles móvil: una sola fila pegada a ambos bordes del toolbar */}
          <Box sx={{
            display: { xs: 'flex', sm: 'none' },
            alignItems: 'center',
            gap: 0,
            height: '100%',
            flex: 1,
            minWidth: 0,
            justifyContent: 'flex-start',
          }}>
            {/* Zona izquierda (20%): botón Auditoría */}
            {user && !isBloqueado && (
              <Box
                component={Link}
                to="/auditoria"
                sx={{
                  color: '#fff',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  px: 0,
                  height: 60,
                  gap: 0.3,
                  flex: '0 0 20%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.28)' },
                }}
              >
                <AssignmentTurnedInIcon sx={{ fontSize: '1.4rem', color: '#fff' }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1, fontSize: '0.7rem' }}>
                  Auditoría
                </Typography>
              </Box>
            )}

            {/* Zona central (60%): selectores Empresa/Sucursal en triángulos cruzados */}
            {user && !isBloqueado && empresasDisponibles.length > 0 && (
              <Box sx={{ flex: '0 0 60%', height: 60, display: 'flex', alignItems: 'stretch' }}>
                <TriangularEmpresaSucursalSelector
                  empresas={empresasDisponibles}
                  sucursales={sucursalesDisponibles}
                  selectedEmpresa={navSelectedEmpresa}
                  selectedSucursal={navSelectedSucursal}
                  onEmpresaChange={navSetEmpresa}
                  onSucursalChange={navSetSucursal}
                  width="100%"
                  height={60}
                />
              </Box>
            )}

            {/* Zona derecha (20%): sync + hamburger */}
            <Box sx={{
              flex: '0 0 20%',
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pl: 0,
            }}>
              {userProfile && (
                <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <OfflineIndicatorMobile userProfile={userProfile} />
                </Box>
              )}

              {selectedOwnerEmail && (
                <Chip
                  label={selectedOwnerEmail}
                  color="warning"
                  size="small"
                  sx={{
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    borderColor: '#ff9800',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    fontSize: '0.65rem',
                    height: 20,
                    maxWidth: 60,
                    flexShrink: 1,
                  }}
                />
              )}

              <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <SuperdevSelector />
              </Box>

              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerToggle}
                sx={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  p: 0,
                  ml: 'auto',
                  '& .MuiSvgIcon-root': {
                    fontSize: '2.2rem',
                    transform: 'translateX(10px)'
                  },
                  '&:focus': { outline: 'none' },
                  '&:active': { backgroundColor: 'transparent' },
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
          pt: {
            xs: 'calc(72px + env(safe-area-inset-top))',
            sm: 'calc(72px + env(safe-area-inset-top))',
            md: 'calc(64px + env(safe-area-inset-top))'
          },
          pb: { xs: 1, sm: 2, md: 3 },
          width: "100%",
          minHeight: "100vh",
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        <OnboardingBar
          onOpenWizardAtStep={(step) => { setWizardStep(step); setWizardOpen(true); }}
        />
        <OnboardingWelcome
          onStartWizard={() => { setWizardStep(0); setWizardOpen(true); }}
        />
        <OnboardingWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          initialStep={wizardStep}
        />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Navbar;


