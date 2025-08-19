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
    <Box className="perfil-usuario-container" sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column'
    }}>

      
      {/* Segundo header - Mis Habilitaciones */}
      <Box sx={{
        p: 1,
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        width: '100%'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          color: 'secondary.main', 
          mb: 1, 
          textAlign: 'center',
          fontSize: { xs: '0.9rem', md: '1.1rem' }
        }}>
          🔧 Mis Habilitaciones
        </Typography>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 1,
          maxWidth: '1400px',
          margin: '0 auto',
          p: 1
        }}>
          {/* Categoría: Auditorías */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5, fontSize: '0.8rem' }}>
              📋 Auditorías
            </Typography>
            {permisos?.puedeCrearAuditorias && (
              <>
                <Button variant="contained" color="primary" size="small" onClick={handleCrearAuditoria} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                  📋 Reportes
                </Button>
                <Button variant="contained" color="primary" size="small" onClick={handleCrearAuditoriaNueva} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                  📋 Crear auditoria
                </Button>
                <Button variant="outlined" color="primary" size="small" onClick={handleMisFormularios} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                  📋 Mis Formularios
                </Button>
              </>
            )}
          </Box>
          
          {/* Categoría: Empresas */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main', mb: 0.5, fontSize: '0.8rem' }}>
              🏢 Empresas
            </Typography>
            {permisos?.puedeCrearEmpresas && (
              <>
                <Button variant="contained" color="success" size="small" onClick={handleCrearEmpresa} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                  🏢 Crear Empresa
                </Button>
                <Button variant="outlined" color="success" size="small" onClick={handleGestionarEmpresas} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                  🏢 Gestionar Empresas
                </Button>
              </>
            )}
          </Box>
          
          {/* Categoría: Usuarios */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.warning.main, 0.05),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main', mb: 0.5, fontSize: '0.8rem' }}>
              👥 Usuarios
            </Typography>
            {permisos?.puedeGestionarUsuarios && (
              <Button variant="contained" color="warning" size="small" onClick={handleGestionarUsuarios} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                👥 Gestionar Usuarios
              </Button>
            )}
            {permisos?.puedeAgregarSocios && (
              <Button variant="outlined" color="warning" size="small" onClick={handleAgregarUsuario} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                👥 Agregar Usuario
              </Button>
            )}
            {permisos?.puedeEliminarUsuarios && (
              <Button variant="outlined" color="error" size="small" onClick={handleEliminarUsuario} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                👥 Eliminar Usuario
              </Button>
            )}
          </Box>
          
          {/* Categoría: Sistema */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main', mb: 0.5, fontSize: '0.8rem' }}>
              ⚙️ Sistema
            </Typography>
            {permisos?.puedeVerLogs && (
              <Button variant="contained" color="info" size="small" onClick={handleVerSistema} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                ⚙️ Ver Sistema
              </Button>
            )}
            {permisos?.puedeGestionarSistema && (
              <Button variant="outlined" color="info" size="small" onClick={handleGestionarSistema} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                ⚙️ Gestionar Sistema
              </Button>
            )}
          </Box>
          
          {/* Categoría: Otros */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.secondary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.main', mb: 0.5, fontSize: '0.8rem' }}>
              🔗 Otros
            </Typography>
            {permisos?.puedeCompartirFormularios && (
              <Button variant="contained" color="secondary" size="small" onClick={handleCompartir} fullWidth sx={{ py: 0.5, fontSize: '0.75rem' }}>
                🔗 Compartir
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      
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
        <Box sx={{ 
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
        <Box ref={contentRef} sx={{ 
          flex: 1, 
          p: 3,
          minWidth: 0, // Importante para que flex funcione correctamente
          width: '100%'
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