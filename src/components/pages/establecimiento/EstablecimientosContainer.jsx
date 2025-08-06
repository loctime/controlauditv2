import React, { useState, useEffect, useCallback } from "react";
import { 
  Button, 
  Card, 
  Grid, 
  Typography, 
  Box, 
  CardActions, 
  Divider, 
  Stack, 
  Tooltip, 
  IconButton, 
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Chip
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Link, useNavigate } from "react-router-dom";
import { storage } from "../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AddEmpresaModal from "./AddEmpresaModal";
import EliminarEmpresa from "./EliminarEmpresa";
import Swal from 'sweetalert2';
import { useAuth } from "../../context/AuthContext";
import EditarEmpresaModal from "./EditarEmpresa";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const EstablecimientosContainer = () => {
  const { userProfile, userEmpresas, crearEmpresa, verificarYCorregirEmpresas, getUserEmpresas, updateEmpresa } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Función para formatear email (mostrar solo usuario)
  const formatearEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };
  const [openModal, setOpenModal] = useState(false);
  const [empresa, setEmpresa] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    logo: null
  });
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false);
  const [empresasCargadas, setEmpresasCargadas] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [empresaEdit, setEmpresaEdit] = useState(null);

  // Debug logs para verificar el filtrado multi-tenant
  useEffect(() => {
    console.log('=== DEBUG Multi-Tenant Filtrado ===');
    console.log('userProfile:', userProfile);
    console.log('userEmpresas (filtradas):', userEmpresas);
    console.log('Cantidad de empresas filtradas:', userEmpresas?.length || 0);
    console.log('=== FIN DEBUG ===');
  }, [userProfile, userEmpresas]);

  // Recargar empresas cuando el componente se monta
  useEffect(() => {
    if (userProfile && userProfile.uid && !empresasCargadas) {
      console.log('Recargando empresas al montar componente...');
      setCargandoEmpresas(true);
      getUserEmpresas(userProfile.uid).finally(() => {
        setCargandoEmpresas(false);
        setEmpresasCargadas(true);
      });
    }
  }, [userProfile?.uid, empresasCargadas]); // Solo depende del uid del usuario y si ya se cargaron

  const handleCloseModal = () => {
    setOpenModal(false);
    // No necesitamos llamar obtenerEmpresas() porque userEmpresas se actualiza automáticamente
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmpresa((prevEmpresa) => ({
      ...prevEmpresa,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    setEmpresa((prevEmpresa) => ({
      ...prevEmpresa,
      logo: e.target.files[0]
    }));
  };

  const handleAddEmpresa = async () => {
    if (!empresa.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la empresa es requerido'
      });
      return;
    }

    setLoading(true);
    try {
      let logoURL = "";
      if (empresa.logo) {
        const storageRef = ref(storage, `empresas/${Date.now()}_${empresa.logo.name}`);
        const snapshot = await uploadBytes(storageRef, empresa.logo);
        logoURL = await getDownloadURL(snapshot.ref);
      }

      await crearEmpresa({
        nombre: empresa.nombre,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        logo: logoURL
      });

      setEmpresa({
        nombre: "",
        direccion: "",
        telefono: "",
        logo: null
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empresa creada exitosamente'
      });
    } catch (error) {
      console.error('Error al crear empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la empresa'
      });
    } finally {
      setLoading(false);
      setOpenModal(false);
    }
  };

  const eliminarEmpresa = async () => {
    // Recargar empresas después de eliminar
    try {
      setCargandoEmpresas(true);
      await getUserEmpresas(userProfile.uid);
    } catch (error) {
      console.error('Error al recargar empresas después de eliminar:', error);
    } finally {
      setCargandoEmpresas(false);
    }
  };

  const handleVerificarEmpresas = async () => {
    setVerificando(true);
    try {
      await verificarYCorregirEmpresas();
      Swal.fire({
        icon: 'success',
        title: 'Verificación completada',
        text: 'Las empresas han sido verificadas y corregidas si era necesario'
      });
    } catch (error) {
      console.error('Error al verificar empresas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al verificar las empresas'
      });
    } finally {
      setVerificando(false);
    }
  };

  const handleOpenEditModal = (empresa) => {
    setEmpresaEdit(empresa);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEmpresaEdit(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEmpresaEdit((prevEmpresa) => ({
      ...prevEmpresa,
      [name]: value
    }));
  };

  const handleEditLogoChange = (e) => {
    setEmpresaEdit((prevEmpresa) => ({
      ...prevEmpresa,
      logo: e.target.files[0]
    }));
  };

  const handleEditEmpresa = async () => {
    if (!empresaEdit.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la empresa es requerido'
      });
      return;
    }

    setLoading(true);
    try {
      let logoURL = empresaEdit.logoURL || "";
      if (empresaEdit.logo && empresaEdit.logo instanceof File) {
        const storageRef = ref(storage, `empresas/${Date.now()}_${empresaEdit.logo.name}`);
        const snapshot = await uploadBytes(storageRef, empresaEdit.logo);
        logoURL = await getDownloadURL(snapshot.ref);
      }

      await updateEmpresa(empresaEdit.id, {
        nombre: empresaEdit.nombre,
        direccion: empresaEdit.direccion,
        telefono: empresaEdit.telefono,
        logo: logoURL
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empresa actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar la empresa'
      });
    } finally {
      setLoading(false);
      setOpenEditModal(false);
    }
  };

  const handleNavigateToSucursales = (empresaId) => {
    console.log('[EstablecimientosContainer] Navegando a sucursales de empresa:', empresaId);
    navigate(`/sucursales/${empresaId}`);
  };

  return (
    <Box sx={{ p: isSmallMobile ? 2 : 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isSmallMobile ? 'column' : 'row',
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 4,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon sx={{ fontSize: isSmallMobile ? 32 : 40, color: 'primary.main' }} />
          <Typography 
            variant={isSmallMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            Empresas Registradas
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          justifyContent: isSmallMobile ? 'center' : 'flex-end'
        }}>
          <Button
            variant="outlined"
            onClick={handleVerificarEmpresas}
            disabled={verificando}
            startIcon={verificando ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
            size={isSmallMobile ? "small" : "medium"}
          >
            {verificando ? "Verificando..." : "Verificar"}
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenModal(true)}
            startIcon={<BusinessIcon />}
            size={isSmallMobile ? "small" : "medium"}
          >
            Agregar Empresa
          </Button>
        </Box>
      </Box>

      {/* Contenido */}
      {isMobile ? (
        // Vista móvil con Stack
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {cargandoEmpresas && (!userEmpresas || userEmpresas.length === 0) ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Cargando empresas...
              </Typography>
            </Box>
          ) : userEmpresas?.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No hay empresas registradas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Haz clic en "Agregar Empresa" para crear tu primera empresa
              </Typography>
            </Box>
          ) : (
            userEmpresas?.filter(empresa => empresa && empresa.id && empresa.nombre).map((empresa) => (
              <Box
                key={empresa.id}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  p: isSmallMobile ? 3 : 4,
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  },
                  transition: 'all 0.3s ease',
                  // Indicador visual para empresas de otros usuarios (solo para supermax)
                  ...(userProfile?.role === 'supermax' && empresa.propietarioId !== userProfile?.uid && {
                    border: `2px solid ${theme.palette.warning.main}`
                  })
                }}
              >
                {/* Indicador de empresa de otro usuario */}
                {userProfile?.role === 'supermax' && empresa.propietarioId !== userProfile?.uid && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'warning.main',
                      color: 'warning.contrastText',
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  >
                    OTRO USUARIO
                  </Box>
                )}
                
                {/* Header con logo y nombre */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isSmallMobile ? 2 : 3,
                  mb: isSmallMobile ? 2 : 3
                }}>
                  {empresa.logo && empresa.logo.trim() !== "" ? (
                    <img
                      src={empresa.logo}
                      alt="Logo de la empresa"
                      style={{ 
                        width: isSmallMobile ? 60 : 80, 
                        height: isSmallMobile ? 60 : 80, 
                        objectFit: 'contain', 
                        borderRadius: 12, 
                        border: '1px solid #eee' 
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: isSmallMobile ? 60 : 80,
                        height: isSmallMobile ? 60 : 80,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: isSmallMobile ? "24px" : "32px",
                        color: theme.palette.primary.main,
                        border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                      }}
                    >
                      {empresa.nombre.charAt(0).toUpperCase()}
                    </Box>
                  )}
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant={isSmallMobile ? "h6" : "h5"} 
                      sx={{ 
                        fontWeight: 700, 
                        color: 'primary.main',
                        mb: 1
                      }}
                    >
                      {empresa.nombre}
                    </Typography>
                    
                    {/* Chips de información rápida */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1 
                    }}>
                      <Chip 
                        icon={<LocationOnIcon />}
                        label={empresa.direccion || "Sin dirección"} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}
                      />
                      <Chip 
                        icon={<PhoneIcon />}
                        label={empresa.telefono || "Sin teléfono"} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                {/* Información adicional */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1,
                  mb: isSmallMobile ? 2 : 3
                }}>
                  {empresa.propietarioEmail && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      <PersonIcon sx={{ fontSize: isSmallMobile ? 16 : 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Propietario: {formatearEmail(empresa.propietarioEmail)}
                      </Typography>
                      <Tooltip title="Información del propietario">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                  
                  {empresa.createdAt && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      <CalendarTodayIcon sx={{ fontSize: isSmallMobile ? 16 : 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Creada: {new Date(empresa.createdAt.toDate ? empresa.createdAt.toDate() : empresa.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Botones de acción */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  pt: 2,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                }}>
                  <Button
                    variant="contained"
                    size={isSmallMobile ? "small" : "medium"}
                    onClick={() => handleNavigateToSucursales(empresa.id)}
                    startIcon={<StorefrontIcon />}
                    sx={{ flex: 1 }}
                  >
                    Sucursales
                  </Button>
                  <Button
                    variant="outlined"
                    size={isSmallMobile ? "small" : "medium"}
                    onClick={() => handleOpenEditModal(empresa)}
                    sx={{ flex: 1 }}
                  >
                    Editar
                  </Button>
                  <EliminarEmpresa empresa={empresa} onEmpresaEliminada={eliminarEmpresa} />
                </Box>
              </Box>
            ))
          )}
        </Box>
      ) : (
        // Vista desktop con Grid tradicional
        <Grid container spacing={4}>
          {cargandoEmpresas && (!userEmpresas || userEmpresas.length === 0) ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Cargando empresas...
                </Typography>
              </Box>
            </Grid>
          ) : userEmpresas?.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No hay empresas registradas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Haz clic en "Agregar Empresa" para crear tu primera empresa
                </Typography>
              </Box>
            </Grid>
          ) : (
            userEmpresas?.filter(empresa => empresa && empresa.id && empresa.nombre).map((empresa) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={empresa.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  p: 2, 
                  borderRadius: 3, 
                  boxShadow: 3,
                  position: 'relative',
                  // Indicador visual para empresas de otros usuarios (solo para supermax)
                  ...(userProfile?.role === 'supermax' && empresa.propietarioId !== userProfile?.uid && {
                    border: '2px solid',
                    borderColor: 'warning.main'
                  })
                }}>
                  {/* Indicador de empresa de otro usuario */}
                  {userProfile?.role === 'supermax' && empresa.propietarioId !== userProfile?.uid && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'warning.main',
                        color: 'warning.contrastText',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}
                    >
                      OTRO USUARIO
                    </Box>
                  )}
                  <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                    {empresa.logo && empresa.logo.trim() !== "" ? (
                      <img
                        src={empresa.logo}
                        alt="Logo de la empresa"
                        style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 12, marginBottom: 12, border: '1px solid #eee' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 90,
                          height: 90,
                          backgroundColor: "#f0f0f0",
                          borderRadius: 2,
                          marginBottom: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "32px",
                          color: "#666",
                          border: "2px dashed #ccc"
                        }}
                      >
                        {empresa.nombre.charAt(0).toUpperCase()}
                      </Box>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
                      {empresa.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 0.5 }}>
                      Dirección: {empresa.direccion}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 0.5 }}>
                      Teléfono: {empresa.telefono}
                    </Typography>
                    {/* Información del propietario y fecha de creación */}
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      {empresa.propietarioEmail && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Propietario: {formatearEmail(empresa.propietarioEmail)}
                          <Tooltip title="Información del propietario">
                            <IconButton size="small" sx={{ ml: 0.5 }}>
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Typography>
                      )}
                      {empresa.createdAt && (
                        <Typography variant="body2" color="text.secondary">
                          Creada: {new Date(empresa.createdAt.toDate ? empresa.createdAt.toDate() : empresa.createdAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleNavigateToSucursales(empresa.id)}
                        startIcon={<StorefrontIcon />}
                        sx={{ flex: 1 }}
                      >
                        Sucursales
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenEditModal(empresa)}
                        sx={{ flex: 1 }}
                      >
                        Editar
                      </Button>
                      <EliminarEmpresa empresa={empresa} onEmpresaEliminada={eliminarEmpresa} />
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
      {openModal && (
        <AddEmpresaModal
          open={openModal}
          handleClose={handleCloseModal}
          handleAddEmpresa={handleAddEmpresa}
          empresa={empresa}
          handleInputChange={handleInputChange}
          handleLogoChange={handleLogoChange}
          loading={loading}
        />
      )}
      {openEditModal && empresaEdit && (
        <EditarEmpresaModal
          open={openEditModal}
          handleClose={handleCloseEditModal}
          handleEditEmpresa={handleEditEmpresa}
          empresa={empresaEdit}
          handleInputChange={handleEditInputChange}
          handleLogoChange={handleEditLogoChange}
          loading={loading}
        />
      )}
    </Box>
  );
};

export default EstablecimientosContainer;
