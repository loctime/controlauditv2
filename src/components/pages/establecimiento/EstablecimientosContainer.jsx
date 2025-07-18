import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Grid, Typography, Box, CardActions, Divider, Stack, Tooltip, IconButton, CircularProgress } from "@mui/material";
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
      {/* Botón Volver */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          console.debug('[EstablecimientosContainer] Volver a /perfil');
          navigate('/perfil');
        }}
        aria-label="Volver a perfil"
        sx={{ mb: 2 }}
      >
        Volver
      </Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Empresas Registradas
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleVerificarEmpresas}
            disabled={verificando}
            sx={{ minWidth: '120px' }}
          >
            {verificando ? 'Verificando...' : 'Verificar'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenModal(true)}
            sx={{ minWidth: '120px' }}
          >
            Agregar Empresa
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mb: 4 }} />
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
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            mr: 0.5
                          }}
                        >
                          Propietario: {formatearEmail(empresa.propietarioEmail)}
                        </Typography>
                        <Tooltip 
                          title={`Empresa propiedad de ${empresa.propietarioEmail}${empresa.propietarioRole ? ` (${empresa.propietarioRole})` : ''}`}
                          arrow
                        >
                          <IconButton size="small" sx={{ p: 0, color: 'text.secondary' }}>
                            <InfoIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                    {empresa.creadorEmail && empresa.creadorEmail !== empresa.propietarioEmail && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'primary.main',
                            fontSize: '0.7rem',
                            mr: 0.5,
                            fontWeight: 500
                          }}
                        >
                          Creado por: {formatearEmail(empresa.creadorEmail)}
                        </Typography>
                        <Tooltip 
                          title={`Empresa creada por ${empresa.creadorEmail}${empresa.creadorRole ? ` (${empresa.creadorRole})` : ''}`}
                          arrow
                        >
                          <IconButton size="small" sx={{ p: 0, color: 'primary.main' }}>
                            <InfoIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                    {empresa.createdAt && (
                      <Tooltip 
                        title={`Fecha de creación: ${empresa.createdAt.toDate ? 
                          empresa.createdAt.toDate().toLocaleString('es-ES') : 
                          new Date(empresa.createdAt).toLocaleString('es-ES')
                        }`}
                        arrow
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            cursor: 'help'
                          }}
                        >
                          Creada: {empresa.createdAt.toDate ? 
                            empresa.createdAt.toDate().toLocaleDateString('es-ES') : 
                            new Date(empresa.createdAt).toLocaleDateString('es-ES')
                          }
                        </Typography>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <CardActions sx={{ justifyContent: 'space-between', mt: 'auto' }}>
                  <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Link to={`/sucursales/${empresa.id}`} style={{ textDecoration: "none", flex: 1 }}>
                      <Button variant="contained" color="primary" fullWidth>
                        Sucursales
                      </Button>
                    </Link>
                    {/* Botón editar solo para propietario o admin */}
                    {(userProfile?.uid === empresa.propietarioId || userProfile?.role === 'supermax') && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleOpenEditModal({
                          ...empresa,
                          logoUrlOriginal: empresa.logo // Para mantener el logo si no se cambia
                        })}
                        sx={{ minWidth: 0, px: 1 }}
                      >
                        Editar
                      </Button>
                    )}
                    <EliminarEmpresa
                      empresaId={empresa.id}
                      eliminarEmpresa={eliminarEmpresa}
                    />
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
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
