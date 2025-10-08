import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Grid
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { collection, getDocs, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const SucursalesTab = ({ empresaId, empresaNombre, userEmpresas, loadEmpresasStats }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSucursalForm, setOpenSucursalForm] = useState(false);
  const [sucursalForm, setSucursalForm] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sucursalesStats, setSucursalesStats] = useState({});
  const [activeTabPerSucursal, setActiveTabPerSucursal] = useState({});

  // Función para recargar estadísticas de sucursales
  const reloadSucursalesStats = async () => {
    if (sucursales && sucursales.length > 0) {
      await loadSucursalesStats(sucursales);
    }
  };

  useEffect(() => {
    if (empresaId) {
      loadSucursales();
    }
  }, [empresaId]);

  const loadSucursales = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'sucursales'), where('empresaId', '==', empresaId));
      const snapshot = await getDocs(q);
      const sucursalesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSucursales(sucursalesData);
      
      // Cargar estadísticas de cada sucursal
      await loadSucursalesStats(sucursalesData);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSucursalesStats = async (sucursalesList) => {
    const stats = {};
    for (const sucursal of sucursalesList) {
      try {
        const [empleadosSnapshot, capacitacionesSnapshot, accidentesSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'empleados'), where('sucursalId', '==', sucursal.id))),
          getDocs(query(collection(db, 'capacitaciones'), where('sucursalId', '==', sucursal.id))),
          getDocs(query(collection(db, 'accidentes'), where('sucursalId', '==', sucursal.id)))
        ]);
        
        stats[sucursal.id] = {
          empleados: empleadosSnapshot.docs.length,
          capacitaciones: capacitacionesSnapshot.docs.length,
          capacitacionesCompletadas: capacitacionesSnapshot.docs.filter(doc => doc.data().estado === 'completada').length,
          accidentes: accidentesSnapshot.docs.length,
          accidentesAbiertos: accidentesSnapshot.docs.filter(doc => doc.data().estado === 'abierto').length
        };
      } catch (error) {
        console.error(`Error cargando stats para sucursal ${sucursal.id}:`, error);
        stats[sucursal.id] = { empleados: 0, capacitaciones: 0, capacitacionesCompletadas: 0, accidentes: 0, accidentesAbiertos: 0 };
      }
    }
    setSucursalesStats(stats);
  };

  const toggleRow = (sucursalId, tab) => {
    const newExpanded = new Set(expandedRows);
    
    // Si ya está expandido y es el mismo tab, colapsar
    if (newExpanded.has(sucursalId) && activeTabPerSucursal[sucursalId] === tab) {
      newExpanded.delete(sucursalId);
    } else {
      // Si no está expandido o es un tab diferente, expandir y cambiar tab
      newExpanded.add(sucursalId);
      setActiveTabPerSucursal(prev => ({
        ...prev,
        [sucursalId]: tab
      }));
    }
    
    setExpandedRows(newExpanded);
  };

  const getActiveTab = (sucursalId) => {
    return activeTabPerSucursal[sucursalId] || 'empleados';
  };

  const navigateToPage = (page, sucursalId) => {
    localStorage.setItem('selectedSucursal', sucursalId);
    navigate(page);
  };

  const handleSucursalFormChange = (e) => {
    const { name, value } = e.target;
    setSucursalForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSucursal = async () => {
    if (!sucursalForm.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la sucursal es requerido'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'sucursales'), {
        ...sucursalForm,
        empresaId: empresaId,
        fechaCreacion: Timestamp.now(),
        creadoPor: userProfile?.uid,
        creadoPorEmail: userProfile?.email,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid
      });

      setSucursalForm({ nombre: '', direccion: '', telefono: '' });
      setOpenSucursalForm(false);
      
      await loadSucursales();
      
      if (typeof loadEmpresasStats === 'function') {
        loadEmpresasStats(userEmpresas);
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Sucursal creada exitosamente'
      });
    } catch (error) {
      console.error('Error creando sucursal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la sucursal: ' + error.message
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Sucursales de {empresaNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<StorefrontIcon />}
          onClick={() => setOpenSucursalForm(true)}
        >
          Agregar Sucursal
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : sucursales.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="textSecondary">
            No hay sucursales registradas para esta empresa
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Dirección</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell align="center"><strong>Empleados</strong></TableCell>
                <TableCell align="center"><strong>Capacitaciones</strong></TableCell>
                <TableCell align="center"><strong>Accidentes</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sucursales.map((sucursal) => {
                const isExpanded = expandedRows.has(sucursal.id);
                const stats = sucursalesStats[sucursal.id] || { empleados: 0, capacitaciones: 0, capacitacionesCompletadas: 0, accidentes: 0, accidentesAbiertos: 0 };

                return (
                  <React.Fragment key={sucursal.id}>
                    <TableRow hover>
                      <TableCell>{sucursal.nombre}</TableCell>
                      <TableCell>{sucursal.direccion || 'N/A'}</TableCell>
                      <TableCell>{sucursal.telefono || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<PeopleIcon />}
                          onClick={() => toggleRow(sucursal.id, 'empleados')}
                          sx={{ 
                            textTransform: 'none',
                            minWidth: '100px'
                          }}
                        >
                          {stats.empleados}
                          {isExpanded && getActiveTab(sucursal.id) === 'empleados' ? <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />}
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<SchoolIcon />}
                          onClick={() => toggleRow(sucursal.id, 'capacitaciones')}
                          sx={{ 
                            textTransform: 'none',
                            minWidth: '100px'
                          }}
                        >
                          {stats.capacitacionesCompletadas}/{stats.capacitaciones}
                          {isExpanded && getActiveTab(sucursal.id) === 'capacitaciones' ? <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />}
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<ReportProblemIcon />}
                          onClick={() => toggleRow(sucursal.id, 'accidentes')}
                          sx={{ 
                            textTransform: 'none',
                            minWidth: '100px'
                          }}
                        >
                          {stats.accidentes}
                          {isExpanded && getActiveTab(sucursal.id) === 'accidentes' ? <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, backgroundColor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
                            {getActiveTab(sucursal.id) === 'empleados' && (
                              <EmpleadosContent 
                                sucursalId={sucursal.id} 
                                sucursalNombre={sucursal.nombre} 
                                navigateToPage={navigateToPage}
                                reloadSucursalesStats={reloadSucursalesStats}
                                loadEmpresasStats={loadEmpresasStats}
                                userEmpresas={userEmpresas}
                              />
                            )}
                            {getActiveTab(sucursal.id) === 'capacitaciones' && (
                              <CapacitacionesContent sucursalId={sucursal.id} sucursalNombre={sucursal.nombre} navigateToPage={navigateToPage} />
                            )}
                            {getActiveTab(sucursal.id) === 'accidentes' && (
                              <AccidentesContent sucursalId={sucursal.id} sucursalNombre={sucursal.nombre} navigateToPage={navigateToPage} />
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal para agregar sucursal */}
      {openSucursalForm && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setOpenSucursalForm(false)}
        >
          <Paper
            sx={{ p: 3, maxWidth: 400, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Agregar Sucursal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Nombre *
                </Typography>
                <input
                  type="text"
                  name="nombre"
                  value={sucursalForm.nombre}
                  onChange={handleSucursalFormChange}
                  placeholder="Nombre de la sucursal"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Dirección
                </Typography>
                <input
                  type="text"
                  name="direccion"
                  value={sucursalForm.direccion}
                  onChange={handleSucursalFormChange}
                  placeholder="Dirección de la sucursal"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Teléfono
                </Typography>
                <input
                  type="text"
                  name="telefono"
                  value={sucursalForm.telefono}
                  onChange={handleSucursalFormChange}
                  placeholder="Teléfono de la sucursal"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleAddSucursal}
                  sx={{ flex: 1 }}
                >
                  Crear
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setOpenSucursalForm(false)}
                  sx={{ flex: 1 }}
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

// Componente para mostrar empleados
const EmpleadosContent = ({ sucursalId, sucursalNombre, navigateToPage, reloadSucursalesStats, loadEmpresasStats, userEmpresas }) => {
  const { userProfile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openEmpleadoForm, setOpenEmpleadoForm] = useState(false);
  const [empleadoForm, setEmpleadoForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    cargo: '',
    area: '',
    fechaIngreso: ''
  });

  useEffect(() => {
    if (sucursalId) {
      loadEmpleados();
    }
  }, [sucursalId]);

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'empleados'), where('sucursalId', '==', sucursalId));
      const snapshot = await getDocs(q);
      const empleadosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmpleadoFormChange = (e) => {
    const { name, value } = e.target;
    setEmpleadoForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEmpleado = async () => {
    if (!empleadoForm.nombre.trim() || !empleadoForm.apellido.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre y apellido son requeridos'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'empleados'), {
        ...empleadoForm,
        sucursalId: sucursalId,
        sucursalNombre: sucursalNombre,
        estado: 'activo',
        fechaCreacion: Timestamp.now(),
        creadoPor: userProfile?.uid,
        creadoPorEmail: userProfile?.email,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid
      });

      setEmpleadoForm({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        email: '',
        cargo: '',
        area: '',
        fechaIngreso: ''
      });
      setOpenEmpleadoForm(false);
      
      // Recargar lista de empleados
      await loadEmpleados();

      // Recargar estadísticas de la sucursal
      if (typeof reloadSucursalesStats === 'function') {
        await reloadSucursalesStats();
      }

      // Recargar estadísticas de la empresa completa
      if (typeof loadEmpresasStats === 'function' && userEmpresas) {
        await loadEmpresasStats(userEmpresas);
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empleado creado exitosamente'
      });
    } catch (error) {
      console.error('Error creando empleado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear el empleado: ' + error.message
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Empleados de {sucursalNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<PeopleIcon />}
          onClick={() => setOpenEmpleadoForm(true)}
          size="small"
        >
          Agregar Empleado
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={30} />
        </Box>
      ) : empleados.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
          No hay empleados registrados
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>DNI</strong></TableCell>
                <TableCell><strong>Cargo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleados.map((empleado) => (
                <TableRow key={empleado.id} hover>
                  <TableCell>{empleado.nombre}</TableCell>
                  <TableCell>{empleado.dni}</TableCell>
                  <TableCell>{empleado.cargo}</TableCell>
                  <TableCell>{empleado.estado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal para agregar empleado */}
      {openEmpleadoForm && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300
          }}
          onClick={() => setOpenEmpleadoForm(false)}
        >
          <Paper
            sx={{ p: 3, maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              Agregar Empleado a {sucursalNombre}
            </Typography>
            
            <Grid container spacing={2}>
              {/* Nombre */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Nombre *
                </Typography>
                <input
                  type="text"
                  name="nombre"
                  value={empleadoForm.nombre}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Nombre del empleado"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Apellido */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Apellido *
                </Typography>
                <input
                  type="text"
                  name="apellido"
                  value={empleadoForm.apellido}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Apellido del empleado"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* DNI */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  DNI
                </Typography>
                <input
                  type="text"
                  name="dni"
                  value={empleadoForm.dni}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Número de DNI"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Teléfono */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Teléfono
                </Typography>
                <input
                  type="text"
                  name="telefono"
                  value={empleadoForm.telefono}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Teléfono de contacto"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Email
                </Typography>
                <input
                  type="email"
                  name="email"
                  value={empleadoForm.email}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Email del empleado"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Cargo */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Cargo
                </Typography>
                <input
                  type="text"
                  name="cargo"
                  value={empleadoForm.cargo}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Cargo o puesto"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Área */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Área
                </Typography>
                <input
                  type="text"
                  name="area"
                  value={empleadoForm.area}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Área o departamento"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Fecha de Ingreso */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Fecha de Ingreso
                </Typography>
                <input
                  type="date"
                  name="fechaIngreso"
                  value={empleadoForm.fechaIngreso}
                  onChange={handleEmpleadoFormChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleAddEmpleado}
                sx={{ flex: 1 }}
              >
                Crear Empleado
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenEmpleadoForm(false)}
                sx={{ flex: 1 }}
              >
                Cancelar
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

// Componente para mostrar capacitaciones
const CapacitacionesContent = ({ sucursalId, sucursalNombre, navigateToPage }) => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sucursalId) {
      loadCapacitaciones();
    }
  }, [sucursalId]);

  const loadCapacitaciones = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'capacitaciones'), where('sucursalId', '==', sucursalId));
      const snapshot = await getDocs(q);
      const capacitacionesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCapacitaciones(capacitacionesData);
    } catch (error) {
      console.error('Error cargando capacitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Capacitaciones de {sucursalNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<SchoolIcon />}
          onClick={() => navigateToPage('/capacitaciones', sucursalId)}
          size="small"
        >
          Gestionar Capacitaciones
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={30} />
        </Box>
      ) : capacitaciones.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
          No hay capacitaciones registradas
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell align="center"><strong>Asistentes</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {capacitaciones.map((capacitacion) => (
                <TableRow key={capacitacion.id} hover>
                  <TableCell>{capacitacion.nombre}</TableCell>
                  <TableCell>{capacitacion.tipo}</TableCell>
                  <TableCell>{capacitacion.estado}</TableCell>
                  <TableCell>
                    {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </TableCell>
                  <TableCell align="center">{capacitacion.asistentes?.length || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// Componente para mostrar accidentes
const AccidentesContent = ({ sucursalId, sucursalNombre, navigateToPage }) => {
  const [accidentes, setAccidentes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sucursalId) {
      loadAccidentes();
    }
  }, [sucursalId]);

  const loadAccidentes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'accidentes'), where('sucursalId', '==', sucursalId));
      const snapshot = await getDocs(q);
      const accidentesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAccidentes(accidentesData);
    } catch (error) {
      console.error('Error cargando accidentes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Accidentes de {sucursalNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<ReportProblemIcon />}
          onClick={() => navigateToPage('/accidentes', sucursalId)}
          size="small"
        >
          Gestionar Accidentes
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={30} />
        </Box>
      ) : accidentes.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
          No hay accidentes registrados
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Gravedad</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accidentes.map((accidente) => (
                <TableRow key={accidente.id} hover>
                  <TableCell>{accidente.tipo}</TableCell>
                  <TableCell>{accidente.empleadoNombre}</TableCell>
                  <TableCell>{accidente.gravedad}</TableCell>
                  <TableCell>
                    {accidente.fechaHora?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </TableCell>
                  <TableCell>{accidente.estado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SucursalesTab;
