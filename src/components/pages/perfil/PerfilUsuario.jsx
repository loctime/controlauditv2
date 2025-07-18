import React, { useState, useEffect } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import { db } from '../../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const {
    userProfile,
    userEmpresas,
    userAuditorias,
    socios,
    auditoriasCompartidas,
    agregarSocio,
    updateUserProfile,
    loadingEmpresas
  } = useAuth();

  const validTabs = ['empresas', 'formularios', 'usuarios', 'configuracion', 'firma', 'info'];
  const [selectedSection, setSelectedSection] = useState('empresas');
  const [emailSocio, setEmailSocio] = useState("");
  const [openDialogSocio, setOpenDialogSocio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('operario');
  const [usuariosCreados, setUsuariosCreados] = useState([]);
  const [loadingUsuariosCreados, setLoadingUsuariosCreados] = useState(false);
  const [formularios, setFormularios] = useState([]);
  const [loadingFormularios, setLoadingFormularios] = useState(false);

  // Actualizar selectedRole cuando userProfile cambie
  useEffect(() => {
    if (userProfile?.role) {
      setSelectedRole(userProfile.role);
    }
  }, [userProfile?.role]);

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

  const handleRoleChange = async () => {
    try {
      setLoading(true);
      let newPermisos = {};
      switch (selectedRole) {
        case 'supermax':
          newPermisos = {
            puedeCrearEmpresas: true,
            puedeCrearSucursales: true,
            puedeCrearAuditorias: true,
            puedeCompartirFormularios: true,
            puedeAgregarSocios: true,
            puedeGestionarUsuarios: true,
            puedeGestionarSistema: true,
            puedeEliminarUsuarios: true,
            puedeVerLogs: true
          };
          break;
        case 'max':
          newPermisos = {
            puedeCrearEmpresas: true,
            puedeCrearSucursales: true,
            puedeCrearAuditorias: true,
            puedeCompartirFormularios: true,
            puedeAgregarSocios: true,
            puedeGestionarUsuarios: true,
            puedeVerLogs: true,
            puedeGestionarSistema: true,
            puedeEliminarUsuarios: true
          };
          break;
        case 'operario':
        default:
          newPermisos = {
            puedeCrearEmpresas: false,
            puedeCrearSucursales: false,
            puedeCrearAuditorias: false,
            puedeCompartirFormularios: false,
            puedeAgregarSocios: false
          };
          break;
      }
      await updateUserProfile({ role: selectedRole, permisos: newPermisos });
      Swal.fire('Éxito', `Rol cambiado a ${selectedRole}. Recarga la página para ver los cambios.`, 'success');
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (error) {
      Swal.fire('Error', 'Error al cambiar el rol', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Línea sutil de separación
  const separador = (
    <Box sx={{ width: '100%', borderBottom: { xs: 'none', sm: '1px solid', md: '1px solid' }, borderColor: 'divider', mb: { xs: 0.5, md: 1 } }} />
  );

  // Render principal
  return (
    <Box sx={{ width: '100%', px: { xs: 0, md: 0 }, py: 0, mt: { xs: -1, sm: -2, md: -3 } }}>
      {separador}
      <PerfilHeader userProfile={userProfile} />
      <Box sx={{ display: { xs: 'block', md: 'flex' }, alignItems: 'flex-start', width: '100%' }}>
        {/* Sidebar */}
        <PerfilSidebar selectedSection={selectedSection} onSelectSection={setSelectedSection} />
        {/* Contenido principal */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
            <PerfilConfiguracion userProfile={userProfile} selectedRole={selectedRole} setSelectedRole={setSelectedRole} handleRoleChange={handleRoleChange} loading={loading} />
          )}
          {selectedSection === 'firma' && (
            <PerfilFirma />
          )}
          {selectedSection === 'info' && (
            <PerfilInfoSistema />
          )}
          {/* Puedes agregar más secciones aquí según lo que necesites */}
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