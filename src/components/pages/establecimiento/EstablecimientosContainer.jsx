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
    setLoading(true);
    try {
      console.log('=== INICIANDO CREACIÓN DE EMPRESA ===');
      console.log('Empresas antes de crear:', userEmpresas?.length || 0);
      
      let logoURL = "";
      if (empresa.logo) {
        // Cargar la imagen al almacenamiento de Firebase
        const logoRef = ref(storage, `logos/${empresa.logo.name}`);
        const snapshot = await uploadBytes(logoRef, empresa.logo);
        logoURL = await getDownloadURL(snapshot.ref);
      }

      // Crear el documento de la empresa usando el contexto (ya incluye filtrado multi-tenant)
      const empresaData = {
        nombre: empresa.nombre,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        logo: logoURL
      };
      
      const empresaId = await crearEmpresa(empresaData);
      console.log('Empresa creada con ID:', empresaId);
      console.log('=== FIN CREACIÓN DE EMPRESA ===');

      // Resetear estado para forzar recarga
      setEmpresasCargadas(false);

      Swal.fire({
        icon: 'success',
        title: 'Empresa Agregada',
        text: 'La empresa ha sido agregada con éxito.',
      });

      handleCloseModal();
    } catch (error) {
      console.error("Error al agregar empresa:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al agregar la empresa.',
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarEmpresa = () => {
    // No necesitamos llamar obtenerEmpresas() porque userEmpresas se actualiza automáticamente
    console.log('Empresa eliminada, userEmpresas se actualizará automáticamente');
  };

  /**
   * Verifica y corrige empresas que no tienen propietario asignado
   * Esta función es necesaria para mantener la integridad del sistema multi-tenant
   * Solo corrige empresas que ya pertenecen al usuario actual (filtrado por multi-tenant)
   */
  const handleVerificarEmpresas = async () => {
    setVerificando(true);
    try {
      console.log('=== INICIANDO VERIFICACIÓN DE EMPRESAS ===');
      console.log('Empresas antes de verificar:', userEmpresas?.length || 0);
      console.log('userProfile:', userProfile);
      
      const empresasCorregidas = await verificarYCorregirEmpresas();
      
      console.log('Empresas después de verificar:', userEmpresas?.length || 0);
      console.log('Empresas corregidas:', empresasCorregidas);
      
      if (empresasCorregidas > 0) {
        Swal.fire({
          icon: 'success',
          title: 'Verificación Completada',
          text: `Se corrigieron ${empresasCorregidas} empresa(s) que no tenían propietario asignado.`,
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Verificación Completada',
          text: 'Todas las empresas ya tienen propietario asignado correctamente.',
        });
      }
    } catch (error) {
      console.error("Error al verificar empresas:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error en Verificación',
        text: 'Ocurrió un error al verificar las empresas. Revisa la consola para más detalles.',
      });
    } finally {
      setVerificando(false);
    }
  };

  // Abrir modal de edición y setear empresa a editar
  const handleOpenEditModal = (empresa) => {
    setEmpresaEdit({ ...empresa, logo: null }); // logo: null para saber si se cambia
    setOpenEditModal(true);
  };

  // Cerrar modal de edición
  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEmpresaEdit(null);
  };

  // Manejar cambios en inputs del modal de edición
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEmpresaEdit((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambio de logo en edición
  const handleEditLogoChange = (e) => {
    setEmpresaEdit((prev) => ({ ...prev, logo: e.target.files[0] }));
  };

  // Guardar cambios de empresa
  const [loadingEdit, setLoadingEdit] = useState(false);
  const handleEditEmpresa = async () => {
    setLoadingEdit(true);
    try {
      console.log('[handleEditEmpresa] Editando empresa:', empresaEdit);
      let logoURL = empresaEdit.logoUrlOriginal || empresaEdit.logo || '';
      // Si el usuario seleccionó un nuevo logo, subirlo
      if (empresaEdit.logo && empresaEdit.logo instanceof File) {
        const logoRef = ref(storage, `logos/${empresaEdit.logo.name}`);
        const snapshot = await uploadBytes(logoRef, empresaEdit.logo);
        logoURL = await getDownloadURL(snapshot.ref);
        console.log('[handleEditEmpresa] Nuevo logo subido:', logoURL);
      } else if (empresaEdit.logo === null && empresaEdit.logoUrlOriginal) {
        logoURL = empresaEdit.logoUrlOriginal;
      }
      // Construir datos a actualizar
      const updateData = {
        nombre: empresaEdit.nombre,
        direccion: empresaEdit.direccion,
        telefono: empresaEdit.telefono,
        logo: logoURL
      };
      await updateEmpresa(empresaEdit.id, updateData);
      console.log('[handleEditEmpresa] Empresa actualizada:', empresaEdit.id);
      Swal.fire({
        icon: 'success',
        title: 'Empresa actualizada',
        text: 'Los cambios se guardaron correctamente.'
      });
      setEmpresasCargadas(false); // Forzar recarga
      handleCloseEditModal();
    } catch (error) {
      console.error('[handleEditEmpresa] Error al editar empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al guardar los cambios.'
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  // Verificar permisos de acceso
  if (!userProfile) {
    return (
      <Box sx={{ px: { xs: 1, sm: 3 }, py: 2 }}>
        <Typography variant="h6" color="error">
          No tienes permisos para acceder a esta sección.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 3 }, py: 2 }}>
      {/* Sección de navegación y acciones con Box */}
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        p: isSmallMobile ? 3 : 4,
        mb: 3
      }}>
        {/* Botón Volver */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            console.debug('[EstablecimientosContainer] Volver a /perfil');
            navigate('/perfil');
          }}
          aria-label="Volver a perfil"
          sx={{ 
            mb: isSmallMobile ? 2 : 3,
            fontSize: isSmallMobile ? '0.875rem' : '1rem'
          }}
        >
          Volver
        </Button>
        
        {/* Header con título y botones */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isSmallMobile ? 2 : 3
        }}>
          <Typography 
            variant={isSmallMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              textAlign: isMobile ? 'center' : 'left',
              mb: isMobile ? 2 : 0
            }}
          >
            🏢 Empresas Registradas
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isSmallMobile ? 1 : 2,
            width: isMobile ? '100%' : 'auto'
          }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleVerificarEmpresas}
              disabled={verificando}
              sx={{ 
                minWidth: isMobile ? '100%' : '120px',
                py: isSmallMobile ? 1.5 : 2,
                fontSize: isSmallMobile ? '0.875rem' : '1rem',
                fontWeight: 600
              }}
            >
              {verificando ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Verificando...
                </>
              ) : (
                '🔍 Verificar'
              )}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenModal(true)}
              sx={{ 
                minWidth: isMobile ? '100%' : '120px',
                py: isSmallMobile ? 1.5 : 2,
                fontSize: isSmallMobile ? '0.875rem' : '1rem',
                fontWeight: 600
              }}
            >
              ➕ Agregar Empresa
            </Button>
          </Box>
        </Box>
      </Box>
      <Divider sx={{ mb: 4 }} />
      
      {/* Vista responsiva con Box de MUI */}
      {isMobile ? (
        // Vista móvil con Box
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? 2 : 3 
        }}>
          {cargandoEmpresas && (!userEmpresas || userEmpresas.length === 0) ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Cargando empresas...
              </Typography>
            </Box>
          ) : userEmpresas?.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}>
              <Typography variant="h6" color="text.secondary">
                No hay empresas registradas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Haz clic en "Agregar Empresa" para crear tu primera empresa
              </Typography>
            </Box>
          ) : (
            userEmpresas?.map((empresa) => (
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
                        Creada: {new Date(empresa.createdAt.toDate()).toLocaleDateString()}
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
            userEmpresas?.map((empresa) => (
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
                          Creada: {new Date(empresa.createdAt.toDate()).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
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
          loading={loadingEdit}
        />
      )}
    </Box>
  );
};

export default EstablecimientosContainer;
