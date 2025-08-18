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
        p: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        width: '100%'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          color: 'secondary.main', 
          mb: 2, 
          textAlign: 'center',
          fontSize: { xs: '1rem', md: '1.25rem' }
        }}>
          🔧 Mis Habilitaciones
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1, 
          justifyContent: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Auditorías */}
          {permisos?.puedeCrearAuditorias && (
            <>
              <Button variant="contained" color="primary" size="small" onClick={handleCrearAuditoria}>
                📋 Reportes
              </Button>
              <Button variant="contained" color="primary" size="small" onClick={handleCrearAuditoriaNueva}>
                📋 Crear auditoria
              </Button>
              <Button variant="outlined" color="primary" size="small" onClick={handleMisFormularios}>
                📋 Mis Formularios
              </Button>
            </>
          )}
          
          {/* Empresas */}
          {permisos?.puedeCrearEmpresas && (
            <>
              <Button variant="contained" color="success" size="small" onClick={handleCrearEmpresa}>
                🏢 Crear Empresa
              </Button>
              <Button variant="outlined" color="success" size="small" onClick={handleGestionarEmpresas}>
                🏢 Gestionar Empresas
              </Button>
            </>
          )}
          
          {/* Usuarios */}
          {permisos?.puedeGestionarUsuarios && (
            <Button variant="contained" color="warning" size="small" onClick={handleGestionarUsuarios}>
              👥 Gestionar Usuarios
            </Button>
          )}
          {permisos?.puedeAgregarSocios && (
            <Button variant="outlined" color="warning" size="small" onClick={handleAgregarUsuario}>
              👥 Agregar Usuario
            </Button>
          )}
          {permisos?.puedeEliminarUsuarios && (
            <Button variant="outlined" color="error" size="small" onClick={handleEliminarUsuario}>
              👥 Eliminar Usuario
            </Button>
          )}
          
          {/* Sistema */}
          {permisos?.puedeVerLogs && (
            <Button variant="contained" color="info" size="small" onClick={handleVerSistema}>
              ⚙️ Ver Sistema
            </Button>
          )}
          {permisos?.puedeGestionarSistema && (
            <Button variant="outlined" color="info" size="small" onClick={handleGestionarSistema}>
              ⚙️ Gestionar Sistema
            </Button>
          )}
          
          {/* Otros */}
          {permisos?.puedeCompartirFormularios && (
            <Button variant="contained" color="secondary" size="small" onClick={handleCompartir}>
              🔗 Compartir
            </Button>
          )}
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