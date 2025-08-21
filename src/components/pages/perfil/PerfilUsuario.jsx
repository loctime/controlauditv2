import React, { useState, useEffect, useRef } from "react";
import { 
  Box, 
  useMediaQuery, 
  useTheme, 
  alpha,
  Typography,
  Button
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import { db } from '../../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
// Componentes modulares
import PerfilSidebar from './PerfilSidebar';
import PerfilFormularios from './PerfilFormularios';
import PerfilEmpresas from './PerfilEmpresas';
import PerfilUsuarios from './PerfilUsuarios';
import PerfilConfiguracion from './PerfilConfiguracion';
import PerfilFirma from './PerfilFirma';
import PerfilInfoSistema from './PerfilInfoSistema';
import PerfilDialogs from './PerfilDialogs';
import './PerfilUsuario.css';


const PerfilUsuario = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  // Agregar logs de depuración
  console.log('[PerfilUsuario] Debug - Role:', role);
  console.log('[PerfilUsuario] Debug - Permisos:', permisos);
  console.log('[PerfilUsuario] Debug - UserProfile:', userProfile);

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
      if (!userProfile?.uid) return;
      setLoadingUsuariosCreados(true);
      try {
        const usuariosRef = collection(db, 'usuarios');
        const q = query(usuariosRef, where('clienteAdminId', '==', userProfile.clienteAdminId || userProfile.uid));
        const snapshot = await getDocs(q);
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuariosCreados(lista);
      } catch (error) {
        setUsuariosCreados([]);
      } finally {
        setLoadingUsuariosCreados(false);
      }
    };
    fetchUsuariosCreados();
  }, [userProfile?.uid, userProfile?.clienteAdminId]);

  // Cargar formularios multi-tenant
  useEffect(() => {
    const fetchFormularios = async () => {
      if (!userProfile?.uid) return;
      setLoadingFormularios(true);
      try {
        const formulariosRef = collection(db, 'formularios');
        const q = query(formulariosRef, where('clienteAdminId', '==', userProfile.clienteAdminId || userProfile.uid));
        const snapshot = await getDocs(q);
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFormularios(lista);
      } catch (error) {
        setFormularios([]);
      } finally {
        setLoadingFormularios(false);
      }
    };
    fetchFormularios();
  }, [userProfile?.uid, userProfile?.clienteAdminId]);

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
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleGestionarUsuarios = () => {
    setSelectedSection('usuarios');
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleAgregarUsuario = () => {
    setSelectedSection('usuarios');
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleEliminarUsuario = () => {
    setSelectedSection('usuarios');
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleVerSistema = () => {
    setSelectedSection('info');
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleGestionarSistema = () => {
    setSelectedSection('configuracion');
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCompartir = () => {
    navigate('/formularios-publicos');
  };

  const handleMisFormularios = () => {
    setSelectedSection('formularios');
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Render principal
  return (
    <Box className="perfil-usuario-container perfil-container perfil-page adaptive-priority" sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column'
    }}>

      
            {/* Sección Mis Habilitaciones - NUEVA VERSIÓN */}
      <div style={{
        width: '100%',
        padding: '20px',
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxSizing: 'border-box'
      }}>
        
        {/* Título principal */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          width: '100%'
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            color: 'secondary.main', 
            fontSize: { xs: '1.3rem', md: '1.5rem' },
            borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
            paddingBottom: '10px',
            display: 'inline-block'
          }}>
            🔧 Mis Habilitaciones
          </Typography>
        </div>
        
        {/* Subtítulo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 500, 
            color: 'text.primary', 
            fontSize: { xs: '1rem', md: '1.1rem' }
          }}>
            📋 Categorías de Acceso
          </Typography>
        </div>
        
        {/* Grid de categorías */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 10px'
        }}>
          
          {/* Categoría: Auditorías */}
          <div style={{
            background: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease-in-out',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'primary.main', 
              fontSize: '1.1rem',
              marginBottom: '8px'
            }}>
              📋 Auditorías
            </Typography>
            
            {permisos?.puedeCrearAuditorias ? (
              <>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleCrearAuditoria} 
                  fullWidth 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  📋 Reportes
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleCrearAuditoriaNueva} 
                  fullWidth 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  📋 Crear auditoria
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={handleMisFormularios} 
                  fullWidth 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  📋 Mis Formularios
                </Button>
              </>
            ) : (
              <Typography variant="body2" sx={{ 
                color: 'text.secondary', 
                fontStyle: 'italic', 
                textAlign: 'center', 
                marginTop: 'auto',
                paddingTop: '20px'
              }}>
                Sin permisos
              </Typography>
            )}
          </div>
          
          {/* Categoría: Empresas */}
          <div style={{
            background: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease-in-out',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'success.main', 
              fontSize: '1.1rem',
              marginBottom: '8px'
            }}>
              🏢 Empresas
            </Typography>
            
            {permisos?.puedeCrearEmpresas ? (
              <>
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={handleCrearEmpresa} 
                  fullWidth 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  🏢 Crear Empresa
                </Button>
                <Button 
                  variant="outlined" 
                  color="success" 
                  onClick={handleGestionarEmpresas} 
                  fullWidth 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  🏢 Gestionar Empresas
                </Button>
              </>
            ) : (
              <Typography variant="body2" sx={{ 
                color: 'text.secondary', 
                fontStyle: 'italic', 
                textAlign: 'center', 
                marginTop: 'auto',
                paddingTop: '20px'
              }}>
                Sin permisos
              </Typography>
            )}
          </div>
          
          {/* Categoría: Usuarios */}
          <div style={{
            background: alpha(theme.palette.warning.main, 0.05),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease-in-out',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'warning.main', 
              fontSize: '1.1rem',
              marginBottom: '8px'
            }}>
              👥 Usuarios
            </Typography>
            
            {permisos?.puedeGestionarUsuarios && (
              <Button 
                variant="contained" 
                color="warning" 
                onClick={handleGestionarUsuarios} 
                fullWidth 
                sx={{ 
                  py: 1, 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                👥 Gestionar Usuarios
              </Button>
            )}
            {permisos?.puedeAgregarSocios && (
              <Button 
                variant="outlined" 
                color="warning" 
                onClick={handleAgregarUsuario} 
                fullWidth 
                sx={{ 
                  py: 1, 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                👥 Agregar Usuario
              </Button>
            )}
            {permisos?.puedeEliminarUsuarios && (
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleEliminarUsuario} 
                fullWidth 
                sx={{ 
                  py: 1, 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                👥 Eliminar Usuario
              </Button>
            )}
            {!permisos?.puedeGestionarUsuarios && !permisos?.puedeAgregarSocios && !permisos?.puedeEliminarUsuarios && (
              <Typography variant="body2" sx={{ 
                color: 'text.secondary', 
                fontStyle: 'italic', 
                textAlign: 'center', 
                marginTop: 'auto',
                paddingTop: '20px'
              }}>
                Sin permisos
              </Typography>
            )}
          </div>
          
          {/* Categoría: Sistema */}
          <div style={{
            background: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease-in-out',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'info.main', 
              fontSize: '1.1rem',
              marginBottom: '8px'
            }}>
              ⚙️ Sistema
            </Typography>
            
            {permisos?.puedeVerLogs && (
              <Button 
                variant="contained" 
                color="info" 
                onClick={handleVerSistema} 
                fullWidth 
                sx={{ 
                  py: 1, 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                ⚙️ Ver Sistema
              </Button>
            )}
            {permisos?.puedeGestionarSistema && (
              <Button 
                variant="outlined" 
                color="info" 
                onClick={handleGestionarSistema} 
                fullWidth 
                sx={{ 
                  py: 1, 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                ⚙️ Gestionar Sistema
              </Button>
            )}
            {!permisos?.puedeVerLogs && !permisos?.puedeGestionarSistema && (
              <Typography variant="body2" sx={{ 
                color: 'text.secondary', 
                fontStyle: 'italic', 
                textAlign: 'center', 
                marginTop: 'auto',
                paddingTop: '20px'
              }}>
                Sin permisos
              </Typography>
            )}
          </div>
          
          {/* Categoría: Otros */}
          <div style={{
            background: alpha(theme.palette.secondary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease-in-out',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            e.target.style.transform = 'translateY(0)';
          }}>
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'secondary.main', 
              fontSize: '1.1rem',
              marginBottom: '8px'
            }}>
              🔗 Otros
            </Typography>
            
            {permisos?.puedeCompartirFormularios ? (
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleCompartir} 
                fullWidth 
                sx={{ 
                  py: 1, 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                🔗 Compartir
              </Button>
            ) : (
              <Typography variant="body2" sx={{ 
                color: 'text.secondary', 
                fontStyle: 'italic', 
                textAlign: 'center', 
                marginTop: 'auto',
                paddingTop: '20px'
              }}>
                Sin permisos
              </Typography>
            )}
          </div>
          
        </div>
      </div>
      
      {/* Contenido principal */}
      <Box sx={{ 
        display: 'flex', 
        width: '100%',
        flex: 1,
        flexDirection: 'row',
        gap: 3,
        alignItems: 'flex-start'
      }}>
        {/* Sidebar */}
        <Box className="perfil-sidebar" sx={{ 
          flexShrink: 0,
          width: 'auto'
        }}>
          <PerfilSidebar 
            selectedSection={selectedSection} 
            onSelectSection={setSelectedSection} 
            userProfile={userProfile}
          />
        </Box>
        
        {/* Contenido principal */}
        <Box ref={contentRef} className="perfil-content" sx={{ 
          flex: 1, 
          p: isMobile ? 1 : 2,
          minWidth: 0, // Importante para que flex funcione correctamente
          width: '100%',
          maxWidth: '100%'
        }}>
          {selectedSection === 'empresas' && (
            <PerfilEmpresas empresas={userEmpresas} loading={loadingEmpresas} />
          )}
          {selectedSection === 'formularios' && (
            <PerfilFormularios formularios={formularios} loading={loadingFormularios} />
          )}
          {selectedSection === 'usuarios' && (
            <PerfilUsuarios usuariosCreados={usuariosCreados} loading={loadingUsuariosCreados} clienteAdminId={userProfile?.clienteAdminId || userProfile?.uid} />
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