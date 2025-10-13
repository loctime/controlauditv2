import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  ReportProblem as AccidenteIcon,
  Warning as IncidenteIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Business as BusinessIcon,
  Storefront as StorefrontIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import NuevoAccidenteModal from './NuevoAccidenteModal';
import NuevoIncidenteModal from './NuevoIncidenteModal';
import {
  obtenerAccidentes,
  crearAccidente,
  crearIncidente,
  actualizarEstadoAccidente
} from '../../../services/accidenteService';
import Swal from 'sweetalert2';

export default function Accidentes() {
  const { userProfile, userSucursales, userEmpresas } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [accidentes, setAccidentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  
  const [openAccidenteModal, setOpenAccidenteModal] = useState(false);
  const [openIncidenteModal, setOpenIncidenteModal] = useState(false);
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [accidenteSeleccionado, setAccidenteSeleccionado] = useState(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [empresasCargadas, setEmpresasCargadas] = useState(false);

  // Filtrar sucursales por empresa
  const sucursalesFiltradas = selectedEmpresa
    ? userSucursales?.filter(s => s.empresaId === selectedEmpresa) || []
    : userSucursales || [];

  // Detectar cuando las empresas han sido cargadas
  useEffect(() => {
    if (userEmpresas !== undefined) {
      setEmpresasCargadas(true);
    }
  }, [userEmpresas]);

  // Cargar empresa/sucursal desde navegación o por defecto
  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && !selectedEmpresa) {
      // Verificar si viene de navegación con datos preseleccionados
      const stateEmpresaId = location.state?.empresaId;
      if (stateEmpresaId && userEmpresas.some(e => e.id === stateEmpresaId)) {
        setSelectedEmpresa(stateEmpresaId);
      } else {
        // Buscar una empresa que tenga sucursales
        const empresaConSucursales = userEmpresas.find(empresa => {
          const sucursalesDeEmpresa = userSucursales?.filter(s => s.empresaId === empresa.id) || [];
          return sucursalesDeEmpresa.length > 0;
        });
        
        if (empresaConSucursales) {
          setSelectedEmpresa(empresaConSucursales.id);
        } else {
          setSelectedEmpresa(userEmpresas[0].id);
        }
      }
    }
  }, [userEmpresas, userSucursales, location.state, selectedEmpresa]);

  useEffect(() => {
    if (selectedEmpresa && sucursalesFiltradas.length > 0 && !selectedSucursal) {
      // Verificar si viene de navegación con sucursal preseleccionada
      const stateSucursalId = location.state?.sucursalId;
      if (stateSucursalId && sucursalesFiltradas.some(s => s.id === stateSucursalId)) {
        setSelectedSucursal(stateSucursalId);
      } else {
        setSelectedSucursal(sucursalesFiltradas[0].id);
      }
    }
  }, [selectedEmpresa, sucursalesFiltradas, location.state]);

  // Cargar accidentes
  const loadAccidentes = useCallback(async () => {
    if (!empresasCargadas) {
      return;
    }

    if (!userEmpresas || userEmpresas.length === 0) {
      setAccidentes([]);
      setLoading(false);
      return;
    }

    if (!selectedEmpresa) {
      setAccidentes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const filtros = {
        empresaId: selectedEmpresa
      };

      if (selectedSucursal) {
        filtros.sucursalId = selectedSucursal;
      }

      if (filterTipo) {
        filtros.tipo = filterTipo;
      }

      if (filterEstado) {
        filtros.estado = filterEstado;
      }

      const accidentesData = await obtenerAccidentes(filtros);
      setAccidentes(accidentesData);
    } catch (error) {
      console.error('Error cargando accidentes:', error);
      Swal.fire('Error', 'No se pudieron cargar los accidentes', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresa, selectedSucursal, filterTipo, filterEstado, userEmpresas, empresasCargadas]);

  useEffect(() => {
    loadAccidentes();
  }, [loadAccidentes]);

  const handleCrearAccidente = async (accidenteData) => {
    try {
      await crearAccidente(
        {
          ...accidenteData,
          reportadoPor: userProfile.uid
        },
        accidenteData.empleadosSeleccionados,
        accidenteData.imagenes
      );

      Swal.fire('Éxito', 'Accidente reportado correctamente', 'success');
      setOpenAccidenteModal(false);
      loadAccidentes();
    } catch (error) {
      console.error('Error creando accidente:', error);
      throw error;
    }
  };

  const handleCrearIncidente = async (incidenteData) => {
    try {
      await crearIncidente(
        {
          ...incidenteData,
          reportadoPor: userProfile.uid
        },
        incidenteData.testigos,
        incidenteData.imagenes
      );

      Swal.fire('Éxito', 'Incidente reportado correctamente', 'success');
      setOpenIncidenteModal(false);
      loadAccidentes();
    } catch (error) {
      console.error('Error creando incidente:', error);
      throw error;
    }
  };

  const handleCambiarEstado = async (accidenteId, nuevoEstado) => {
    try {
      const result = await Swal.fire({
        title: '¿Cambiar estado?',
        text: `¿Desea marcar este registro como ${nuevoEstado}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await actualizarEstadoAccidente(accidenteId, nuevoEstado);
        Swal.fire('Éxito', 'Estado actualizado correctamente', 'success');
        loadAccidentes();
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  const handleVerDetalle = (accidente) => {
    setAccidenteSeleccionado(accidente);
    setOpenDetalleModal(true);
  };

  const empresaActual = userEmpresas?.find(e => e.id === selectedEmpresa);
  const sucursalActual = sucursalesFiltradas?.find(s => s.id === selectedSucursal);

  // Filtrar y paginar
  const accidentesFiltrados = accidentes;
  const accidentesPaginados = accidentesFiltrados.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEstadoColor = (estado) => {
    return estado === 'abierto' ? 'error' : 'success';
  };

  const getTipoIcon = (tipo) => {
    return tipo === 'accidente' ? <AccidenteIcon /> : <IncidenteIcon />;
  };

  // Mostrar loading mientras se cargan los datos
  if (!empresasCargadas) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccidenteIcon sx={{ fontSize: 40, color: 'error.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Accidentes e Incidentes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<AccidenteIcon />}
              onClick={() => setOpenAccidenteModal(true)}
              disabled={!selectedSucursal || !userEmpresas || userEmpresas.length === 0}
            >
              Nuevo Accidente
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<IncidenteIcon />}
              onClick={() => setOpenIncidenteModal(true)}
              disabled={!selectedSucursal || !userEmpresas || userEmpresas.length === 0}
            >
              Nuevo Incidente
            </Button>
          </Box>
        </Box>

        {/* Alertas de estado */}
        {!userEmpresas || userEmpresas.length === 0 ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body1">
                🏢 No hay empresas disponibles. Contacta al administrador para asignar empresas a tu usuario.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => window.location.href = '/establecimientos'}
              >
                🏢 Ir a Empresas
              </Button>
            </Box>
          </Alert>
        ) : !selectedSucursal && sucursalesFiltradas.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body1">
                🏪 No hay sucursales disponibles para la empresa seleccionada.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => window.location.href = '/establecimientos'}
              >
                🏪 Crear Sucursales
              </Button>
            </Box>
          </Alert>
        ) : null}

        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select
                value={selectedEmpresa}
                onChange={(e) => {
                  setSelectedEmpresa(e.target.value);
                  setSelectedSucursal('');
                }}
                label="Empresa"
                disabled={!userEmpresas || userEmpresas.length === 0}
              >
                {userEmpresas?.map((empresa) => (
                  <MenuItem key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sucursal</InputLabel>
              <Select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                label="Sucursal"
                disabled={!selectedEmpresa}
              >
                <MenuItem value="">Todas</MenuItem>
                {sucursalesFiltradas?.map((sucursal) => (
                  <MenuItem key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                label="Tipo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="accidente">Accidente</MenuItem>
                <MenuItem value="incidente">Incidente</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="abierto">Abierto</MenuItem>
                <MenuItem value="cerrado">Cerrado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Estadísticas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {accidentes.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error">
                  {accidentes.filter(a => a.tipo === 'accidente').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Accidentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {accidentes.filter(a => a.tipo === 'incidente').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Incidentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error">
                  {accidentes.filter(a => a.estado === 'abierto').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Abiertos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabla */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : accidentes.length === 0 ? (
          <Alert severity="info">
            No hay accidentes o incidentes registrados
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Involucrados</TableCell>
                    <TableCell>Imágenes</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accidentesPaginados.map((accidente) => (
                    <TableRow key={accidente.id} hover>
                      <TableCell>
                        <Chip
                          icon={getTipoIcon(accidente.tipo)}
                          label={accidente.tipo}
                          color={accidente.tipo === 'accidente' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {accidente.fechaHora?.toDate?.()?.toLocaleString() || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {accidente.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PeopleIcon fontSize="small" />
                          <Typography variant="body2">
                            {accidente.tipo === 'accidente'
                              ? accidente.empleadosInvolucrados?.length || 0
                              : accidente.testigos?.length || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {accidente.imagenes?.length > 0 && (
                          <Chip
                            icon={<ImageIcon />}
                            label={accidente.imagenes.length}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={accidente.estado}
                          color={getEstadoColor(accidente.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={() => handleVerDetalle(accidente)}
                          >
                            Ver
                          </Button>
                          {accidente.estado === 'abierto' && (
                            <Button
                              size="small"
                              color="success"
                              onClick={() => handleCambiarEstado(accidente.id, 'cerrado')}
                            >
                              Cerrar
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={accidentesFiltrados.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
            />
          </>
        )}
      </Paper>

      {/* Modales */}
      {openAccidenteModal && (
        <NuevoAccidenteModal
          open={openAccidenteModal}
          onClose={() => setOpenAccidenteModal(false)}
          onAccidenteCreado={handleCrearAccidente}
          empresaId={selectedEmpresa}
          sucursalId={selectedSucursal}
          empresaNombre={empresaActual?.nombre}
          sucursalNombre={sucursalActual?.nombre}
        />
      )}

      {openIncidenteModal && (
        <NuevoIncidenteModal
          open={openIncidenteModal}
          onClose={() => setOpenIncidenteModal(false)}
          onIncidenteCreado={handleCrearIncidente}
          empresaId={selectedEmpresa}
          sucursalId={selectedSucursal}
          empresaNombre={empresaActual?.nombre}
          sucursalNombre={sucursalActual?.nombre}
        />
      )}

      {/* Modal de Detalle */}
      <Dialog
        open={openDetalleModal}
        onClose={() => setOpenDetalleModal(false)}
        maxWidth="md"
        fullWidth
      >
        {accidenteSeleccionado && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getTipoIcon(accidenteSeleccionado.tipo)}
                  <Typography variant="h6">
                    Detalle del {accidenteSeleccionado.tipo}
                  </Typography>
                </Box>
                <IconButton onClick={() => setOpenDetalleModal(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha y Hora
                  </Typography>
                  <Typography variant="body1">
                    {accidenteSeleccionado.fechaHora?.toDate?.()?.toLocaleString() || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Estado
                  </Typography>
                  <Chip
                    label={accidenteSeleccionado.estado}
                    color={getEstadoColor(accidenteSeleccionado.estado)}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Descripción
                  </Typography>
                  <Typography variant="body1">
                    {accidenteSeleccionado.descripcion}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {accidenteSeleccionado.tipo === 'accidente' ? 'Empleados Involucrados' : 'Testigos'}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {accidenteSeleccionado.tipo === 'accidente'
                      ? accidenteSeleccionado.empleadosInvolucrados?.map((emp, index) => (
                          <Chip
                            key={index}
                            label={`${emp.empleadoNombre}${emp.conReposo ? ' (Con reposo)' : ''}`}
                            color={emp.conReposo ? 'error' : 'default'}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))
                      : accidenteSeleccionado.testigos?.map((testigo, index) => (
                          <Chip
                            key={index}
                            label={testigo.empleadoNombre}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))
                    }
                  </Box>
                </Grid>

                {accidenteSeleccionado.imagenes?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      Imágenes
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {accidenteSeleccionado.imagenes.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Imagen ${index + 1}`}
                          style={{
                            width: 150,
                            height: 150,
                            objectFit: 'cover',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              {accidenteSeleccionado.estado === 'abierto' && (
                <Button
                  onClick={() => {
                    handleCambiarEstado(accidenteSeleccionado.id, 'cerrado');
                    setOpenDetalleModal(false);
                  }}
                  color="success"
                  variant="contained"
                >
                  Cerrar Caso
                </Button>
              )}
              <Button onClick={() => setOpenDetalleModal(false)}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
