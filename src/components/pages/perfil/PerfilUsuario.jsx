import React, { useState, useEffect, useRef } from "react";
import { 
  Box, 
  useMediaQuery, 
  useTheme, 
  alpha,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import DrawIcon from '@mui/icons-material/Draw';
import InfoIcon from '@mui/icons-material/Info';
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import { dbAudit } from '../../../firebaseControlFile';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { getUsers } from '../../../core/services/ownerUserService';
import { useLocation, useNavigate } from 'react-router-dom';
// Componentes modulares
import PerfilHeader from './PerfilHeader';
import PerfilSidebar from './PerfilSidebar';
import PerfilFormularios from './PerfilFormularios';
import PerfilEmpresas from './PerfilEmpresas';
import PerfilUsuarios from './PerfilUsuarios';
import PerfilConfiguracion from './PerfilConfiguracion';
import PerfilFirma from './PerfilFirma';
import PerfilInfoSistema from './PerfilInfoSistema';
import PerfilDialogs from './PerfilDialogs';

const PerfilUsuario = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const {
    userProfile,
    userEmpresas,
    userAuditorias,
    socios,
    auditoriasCompartidas,
    agregarSocio,
    updateUserProfile,
    loadingEmpresas,
    role,
    permisos
  } = useAuth();

  const validTabs = ['empresas', 'formularios', 'usuarios', 'configuracion', 'firma', 'info'];
  const [selectedSection, setSelectedSection] = useState('empresas');
  const [emailSocio, setEmailSocio] = useState("");
  const [openDialogSocio, setOpenDialogSocio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usuariosCreados, setUsuariosCreados] = useState([]);
  const [loadingUsuariosCreados, setLoadingUsuariosCreados] = useState(false);
  const [formularios, setFormularios] = useState([]);
  const [loadingFormularios, setLoadingFormularios] = useState(false);
  const contentRef = useRef(null);

  // Sincronizar selectedSection con query param 'tab'
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && validTabs.includes(tab)) {
      setSelectedSection(tab);
      console.debug('[PerfilUsuario] Tab seleccionado desde URL:', tab);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchUsuariosCreados = async () => {
      if (!userProfile?.ownerId) return;
      setLoadingUsuariosCreados(true);
      try {
        // Usar ownerId del token (owner-centric)
        const ownerId = userProfile.ownerId;
        const lista = await getUsers(ownerId);
        setUsuariosCreados(lista);
      } catch (error) {
        // No mostrar error si es permission-denied (error visual falso después de crear usuario en Core)
        const isPermissionDenied = 
          error.code === 'permission-denied' ||
          error.message?.includes('permission-denied') ||
          error.message?.includes('Missing or insufficient permissions');
        
        if (isPermissionDenied) {
          console.debug('[PerfilUsuario] Permission denied al cargar usuarios (esperado después de crear usuario en Core)');
        } else {
          console.warn('[PerfilUsuario] Error al cargar usuarios:', error);
        }
        setUsuariosCreados([]);
      } finally {
        setLoadingUsuariosCreados(false);
      }
    };
    fetchUsuariosCreados();
  }, [userProfile?.ownerId]);

  // Cargar formularios owner-centric
  useEffect(() => {
    const fetchFormularios = async () => {
      if (!userProfile?.ownerId) return;
      setLoadingFormularios(true);
      try {
        const ownerId = userProfile.ownerId;
        const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
        const snapshot = await getDocs(formulariosRef);
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFormularios(lista);
      } catch (error) {
        console.error('Error cargando formularios:', error);
        setFormularios([]);
      } finally {
        setLoadingFormularios(false);
      }
    };
    fetchFormularios();
  }, [userProfile?.ownerId]);

  const handleAgregarSocio = async () => {
    if (!emailSocio.trim()) {
      Swal.fire('Error', 'Por favor ingresa un email válido', 'error');
      return;
    }

    setLoading(true);
    try {
      await agregarSocio(emailSocio);
      setEmailSocio("");
      setOpenDialogSocio(false);
      Swal.fire('Éxito', 'Socio agregado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de navegación para los botones de habilitaciones
  const handleCrearAuditoria = () => {
    navigate('/reporte', { state: { from: 'perfil' } });
  };

  const handleCrearAuditoriaNueva = () => {
    navigate('/auditoria', { state: { from: 'perfil' } });
  };

  const handleCrearEmpresa = () => {
    navigate('/establecimiento');
  };

  const handleGestionarEmpresas = () => {
    setSelectedSection('empresas');
    
    // Scroll automático hacia el contenido principal después de un pequeño delay
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleGestionarUsuarios = () => {
    setSelectedSection('usuarios');
    
    // Scroll automático hacia el contenido principal después de un pequeño delay
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleAgregarUsuario = () => {
    setSelectedSection('usuarios');
    
    // Scroll automático hacia el contenido principal después de un pequeño delay
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleEliminarUsuario = () => {
    setSelectedSection('usuarios');
    
    // Scroll automático hacia el contenido principal después de un pequeño delay
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleVerSistema = () => {
    setSelectedSection('info');
    
    // Scroll automático hacia el contenido principal después de un pequeño delay
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleGestionarSistema = () => {
    setSelectedSection('configuracion');
    
    // Scroll automático hacia el contenido principal después de un pequeño delay
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleCompartir = () => {
    // Navegar a la sección de formularios públicos
    navigate('/formularios-publicos');
  };

  const handleMisFormularios = () => {
    // Navegar a la sección de formularios
    setSelectedSection('formularios');
    
    // Scroll automático hacia el contenido principal después de un pequeño delay
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  // Línea sutil de separación
  const separador = (
    <Box sx={{ width: '100%', borderBottom: { xs: 'none', sm: '1px solid', md: '1px solid' }, borderColor: 'divider', mb: { xs: 0.5, md: 1 } }} />
  );

  // Render principal
  return (
    <Box sx={{ 
      width: '100%', 
      px: { xs: 1, sm: 2, md: 3 }, 
      py: { xs: 2, sm: 3, md: 4 },
      bgcolor: 'background.default'
    }}>
      {/* Contenedor principal con Box de MUI */}
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {/* Header del perfil con Card */}
        <Box sx={{
          p: isSmallMobile ? 3 : 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}>
          {userProfile ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'center' : 'flex-start',
              gap: isSmallMobile ? 2 : 3
            }}>
              {/* Avatar */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                mb: isMobile ? 2 : 0
              }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  width: isSmallMobile ? 80 : 100, 
                  height: isSmallMobile ? 80 : 100,
                  fontSize: isSmallMobile ? '2rem' : '2.5rem'
                }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
              </Box>
              
              {/* Información del usuario */}
              <Box sx={{ 
                flex: 1,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <Typography 
                  variant={isSmallMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'primary.main',
                    mb: 1
                  }}
                >
                  {userProfile.displayName || 'Usuario'}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: 'center',
                  gap: isSmallMobile ? 1 : 2,
                  flexWrap: 'wrap'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5 
                  }}>
                    <EmailIcon sx={{ fontSize: isSmallMobile ? 16 : 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {userProfile.email}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5 
                  }}>
                    <CalendarTodayIcon sx={{ fontSize: isSmallMobile ? 16 : 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Miembro desde: {new Date(userProfile.createdAt?.seconds * 1000).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Cargando perfil...
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Sección de habilitaciones con Card */}
        <Box sx={{
          p: isSmallMobile ? 3 : 4,
          bgcolor: 'background.paper'
        }}>
          <Typography 
            variant={isSmallMobile ? "h6" : "h5"} 
            sx={{ 
              fontWeight: 600, 
              color: 'primary.main',
              mb: isSmallMobile ? 2 : 3,
              textAlign: 'center'
            }}
          >
            🔧 Mis Habilitaciones
          </Typography>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isSmallMobile ? 2 : 3
          }}>
                         {/* Auditorías */}
             <Box sx={{
               bgcolor: alpha(theme.palette.primary.main, 0.05),
               borderRadius: 2,
               p: isSmallMobile ? 2 : 3,
               border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
             }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1565c0' }}>
                 📋 Auditorías
               </Typography>
               {permisos?.puedeCrearAuditorias && (
                 <Button
                   variant="contained"
                   color="primary"
                   size={isSmallMobile ? "small" : "medium"}
                   fullWidth
                   sx={{ mb: 1 }}
                   onClick={handleCrearAuditoria}
                 >
                   Reportes
                 </Button>
               )}
               {permisos?.puedeCrearAuditorias && (
                 <Button
                   variant="contained"
                   color="primary"
                   size={isSmallMobile ? "small" : "medium"}
                   fullWidth
                   sx={{ mb: 1 }}
                   onClick={handleCrearAuditoriaNueva}
                 >
                   Crear auditoria
                 </Button>
               )}
               {permisos?.puedeCrearAuditorias && (
                 <Button
                   variant="outlined"
                   color="primary"
                   size={isSmallMobile ? "small" : "medium"}
                   fullWidth
                   sx={{ mb: 1 }}
                   onClick={handleMisFormularios}
                 >
                   Mis Formularios
                 </Button>
               )}
             </Box>
            
                         {/* Empresas */}
             <Box sx={{
               bgcolor: alpha(theme.palette.success.main, 0.05),
               borderRadius: 2,
               p: isSmallMobile ? 2 : 3,
               border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
             }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
                 🏢 Empresas
               </Typography>
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                 {permisos?.puedeCrearEmpresas && (
                   <Button
                     variant="contained"
                     color="success"
                     size={isSmallMobile ? "small" : "medium"}
                     fullWidth
                     onClick={handleCrearEmpresa}
                   >
                     Crear Empresa
                   </Button>
                 )}
                 {permisos?.puedeCrearEmpresas && (
                   <Button
                     variant="outlined"
                     color="success"
                     size={isSmallMobile ? "small" : "medium"}
                     fullWidth
                     onClick={handleGestionarEmpresas}
                   >
                     Gestionar Empresas
                   </Button>
                 )}
               </Box>
             </Box>
            
                         {/* Usuarios */}
             <Box sx={{
               bgcolor: alpha(theme.palette.warning.main, 0.05),
               borderRadius: 2,
               p: isSmallMobile ? 2 : 3,
               border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
             }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#e65100' }}>
                 👥 Usuarios
               </Typography>
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                 {permisos?.puedeGestionarUsuarios && (
                   <Button
                     variant="contained"
                     color="warning"
                     size={isSmallMobile ? "small" : "medium"}
                     fullWidth
                     onClick={handleGestionarUsuarios}
                   >
                     Gestionar Usuarios
                   </Button>
                 )}
                 {permisos?.puedeAgregarSocios && (
                   <Button
                     variant="outlined"
                     color="warning"
                     size={isSmallMobile ? "small" : "medium"}
                     fullWidth
                     onClick={handleAgregarUsuario}
                   >
                     Agregar Usuario
                   </Button>
                 )}
                 {permisos?.puedeEliminarUsuarios && (
                   <Button
                     variant="outlined"
                     color="error"
                     size={isSmallMobile ? "small" : "medium"}
                     fullWidth
                     onClick={handleEliminarUsuario}
                   >
                     Eliminar Usuario
                   </Button>
                 )}
               </Box>
             </Box>
            
                         {/* Sistema */}
             <Box sx={{
               bgcolor: alpha(theme.palette.info.main, 0.05),
               borderRadius: 2,
               p: isSmallMobile ? 2 : 3,
               border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
             }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#01579b' }}>
                 ⚙️ Sistema
               </Typography>
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                 {permisos?.puedeVerLogs && (
                   <Button
                     variant="contained"
                     color="info"
                     size={isSmallMobile ? "small" : "medium"}
                     fullWidth
                     onClick={handleVerSistema}
                   >
                     Ver Sistema
                   </Button>
                 )}
                 {permisos?.puedeGestionarSistema && (
                   <Button
                     variant="outlined"
                     color="info"
                     size={isSmallMobile ? "small" : "medium"}
                     fullWidth
                     onClick={handleGestionarSistema}
                   >
                     Gestionar Sistema
                   </Button>
                 )}
               </Box>
             </Box>
            
                         {/* Otros */}
             <Box sx={{
               bgcolor: alpha(theme.palette.secondary.main, 0.05),
               borderRadius: 2,
               p: isSmallMobile ? 2 : 3,
               border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
             }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'secondary.main' }}>
                 🔗 Otros
               </Typography>
               {permisos?.puedeCompartirFormularios && (
                 <Button
                   variant="contained"
                   color="secondary"
                   size={isSmallMobile ? "small" : "medium"}
                   fullWidth
                   onClick={handleCompartir}
                 >
                   Compartir
                 </Button>
               )}
             </Box>
          </Box>
        </Box>
        
        {/* Contenido principal */}
        <Box sx={{ 
          display: { xs: 'block', md: 'flex' }, 
          alignItems: 'flex-start', 
          width: '100%' 
        }}>
          {/* Sidebar */}
          <PerfilSidebar 
            selectedSection={selectedSection} 
            onSelectSection={setSelectedSection} 
          />
          
          {/* Contenido principal */}
          <Box 
            ref={contentRef}
            sx={{ 
              flex: 1, 
              minWidth: 0,
              p: isSmallMobile ? 3 : 4
            }}
          >
            {selectedSection === 'empresas' && (
              <PerfilEmpresas empresas={userEmpresas} loading={loadingEmpresas} />
            )}
            {selectedSection === 'formularios' && (
              <PerfilFormularios formularios={formularios} loading={loadingFormularios} />
            )}
            {selectedSection === 'usuarios' && (
              <PerfilUsuarios 
                usuariosCreados={usuariosCreados} 
                loading={loadingUsuariosCreados} 
                ownerId={userProfile?.ownerId}
                onRefresh={() => {
                  // Refrescar usuarios cuando se crea uno nuevo (usar servicio de migración)
                  const fetchUsuariosCreados = async () => {
                    if (!userProfile?.uid) return;
                    setLoadingUsuariosCreados(true);
                    try {
                      // Usar servicio de migración que combina legacy y owner-centric
                      const ownerId = userProfile.uid; // En modelo owner-centric, el admin es su propio owner
                      const lista = await getUsers(ownerId);
                      setUsuariosCreados(lista);
                    } catch (error) {
                      // No mostrar error si es permission-denied (error visual falso después de crear usuario en Core)
                      const isPermissionDenied = 
                        error.code === 'permission-denied' ||
                        error.message?.includes('permission-denied') ||
                        error.message?.includes('Missing or insufficient permissions');
                      
                      if (isPermissionDenied) {
                        console.debug('[PerfilUsuario] Permission denied al refrescar usuarios (esperado después de crear usuario en Core)');
                      } else {
                        console.warn('[PerfilUsuario] Error al refrescar usuarios:', error);
                      }
                      setUsuariosCreados([]);
                    } finally {
                      setLoadingUsuariosCreados(false);
                    }
                  };
                  fetchUsuariosCreados();
                }}
              />
            )}
            {selectedSection === 'configuracion' && (
                              <PerfilConfiguracion userProfile={userProfile} />
            )}
            {selectedSection === 'firma' && (
              <PerfilFirma />
            )}
            {selectedSection === 'info' && (
              <PerfilInfoSistema />
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Diálogos modales */}
      <PerfilDialogs
        openDialogSocio={openDialogSocio}
        setOpenDialogSocio={setOpenDialogSocio}
        emailSocio={emailSocio}
        setEmailSocio={setEmailSocio}
        loading={loading}
        handleAgregarSocio={handleAgregarSocio}
      />
    </Box>
  );
};

export default PerfilUsuario; 