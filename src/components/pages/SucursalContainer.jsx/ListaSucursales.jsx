import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  Button,
  Tooltip
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  ReportProblem as ReportProblemIcon,
  Dashboard as DashboardIcon
} from "@mui/icons-material";
import { collection, getDocs, deleteDoc, doc, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import EditarSucursalModal from "./EditarSucursal";

const ListaSucursales = ({ empresaId }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [sucursalEdit, setSucursalEdit] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sucursalesStats, setSucursalesStats] = useState({});
  const navigate = useNavigate();
  const { userProfile, userEmpresas, userSucursales, loadingSucursales, role } = useAuth();

  // Usar sucursales del contexto (ya cargadas automáticamente)
  useEffect(() => {
    if (!userProfile) {
      setSucursales([]);
      setLoading(false);
      setError("No hay usuario autenticado");
      return;
    }

    setLoading(loadingSucursales);
    setError(null);
    
    if (!userSucursales || userSucursales.length === 0) {
      if (!loadingSucursales) {
        setSucursales([]);
        setError("No hay sucursales disponibles para este usuario");
      }
      return;
    }

    // Filtrar sucursales por empresa si se especifica una empresaId
    let sucursalesFiltradas = userSucursales;
    if (empresaId) {
      sucursalesFiltradas = userSucursales.filter(s => s.empresaId === empresaId);
      
      if (sucursalesFiltradas.length === 0) {
        setSucursales([]);
        setLoading(false);
        setError(`No hay sucursales para la empresa con ID: ${empresaId}`);
        return;
      }
    }

    // Procesar fechas de creación
    const sucursalesConFechas = sucursalesFiltradas.map(sucursal => ({
      ...sucursal,
      fechaCreacion: sucursal.fechaCreacion?.toDate?.() || new Date()
    }));

    setSucursales(sucursalesConFechas);
    setLoading(false);
    setError(null);
    
    // Cargar estadísticas para cada sucursal
    loadSucursalesStats(sucursalesConFechas);
  }, [empresaId, userProfile, userSucursales, loadingSucursales]);

  // Cargar estadísticas de cada sucursal
  const loadSucursalesStats = async (sucursales) => {
    const stats = {};
    
    for (const sucursal of sucursales) {
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
        stats[sucursal.id] = {
          empleados: 0,
          capacitaciones: 0,
          capacitacionesCompletadas: 0,
          accidentes: 0,
          accidentesAbiertos: 0
        };
      }
    }
    
    setSucursalesStats(stats);
  };

  // Toggle expandir fila
  const toggleRow = (sucursalId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(sucursalId)) {
      newExpanded.delete(sucursalId);
    } else {
      newExpanded.add(sucursalId);
    }
    setExpandedRows(newExpanded);
  };

  // Navegar a páginas específicas con sucursal preseleccionada
  const navigateToPage = (page, sucursalId) => {
    // Guardar la sucursal seleccionada en localStorage para que las páginas la usen
    localStorage.setItem('selectedSucursal', sucursalId);
    navigate(page);
  };


  const handleEliminar = async (sucursalId, nombreSucursal) => {
    if (window.confirm(`¿Está seguro de que desea eliminar la sucursal "${nombreSucursal}"?`)) {
      try {
        await deleteDoc(doc(db, "sucursales", sucursalId));
        
        // Invalidar cache offline después de eliminar
        try {
          if (window.indexedDB) {
            const request = indexedDB.open('controlaudit_offline_v1', 2);
            await new Promise((resolve, reject) => {
              request.onsuccess = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('settings')) {
                  resolve();
                  return;
                }
                
                const transaction = db.transaction(['settings'], 'readwrite');
                const store = transaction.objectStore('settings');
                
                store.get('complete_user_cache').onsuccess = function(e) {
                  const cached = e.target.result;
                  if (cached && cached.value) {
                    cached.value.sucursalesTimestamp = 0;
                    cached.value.timestamp = Date.now();
                    store.put(cached).onsuccess = () => resolve();
                  } else {
                    resolve();
                  }
                };
              };
              request.onerror = function(event) {
                reject(event.target.error);
              };
            });
            console.log('✅ Cache invalidado después de eliminar sucursal');
          }
        } catch (cacheError) {
          console.warn('⚠️ Error invalidando cache:', cacheError);
        }
        
        // La suscripción onSnapshot ya maneja la actualización en tiempo real
      } catch (error) {
        console.error("[ListaSucursales] Error al eliminar sucursal:", error);
        setError("Error al eliminar la sucursal: " + error.message);
      }
    }
  };

  const handleOpenEditModal = (sucursal) => {
    setSucursalEdit(sucursal);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSucursalEdit(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSucursalEdit((prevSucursal) => ({
      ...prevSucursal,
      [name]: value
    }));
  };

  const handleEditSucursal = async () => {
    if (!sucursalEdit.nombre.trim()) {
      setError("El nombre de la sucursal es requerido");
      return;
    }

    setEditLoading(true);
    try {
      await updateDoc(doc(db, "sucursales", sucursalEdit.id), {
        nombre: sucursalEdit.nombre,
        direccion: sucursalEdit.direccion,
        telefono: sucursalEdit.telefono
      });

      setError(null);
      setOpenEditModal(false);
      setSucursalEdit(null);
    } catch (error) {
      console.error("[ListaSucursales] Error al actualizar sucursal:", error);
      setError("Error al actualizar la sucursal: " + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar permisos de acceso
  if (!userProfile) {
    return (
      <Box>
        <Alert severity="error">
          No tienes permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" flexDirection="column" gap={2}>
        <CircularProgress />
        <Typography>Cargando sucursales...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gestión de Sucursales ({sucursales.length})
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Haz clic en la flecha para expandir y ver las opciones de gestión para cada sucursal.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {sucursales.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No hay sucursales registradas
          </Typography>
          {empresaId && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Para esta empresa específica
            </Typography>
          )}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Las sucursales aparecerán aquí una vez que se creen.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell><strong>Sucursal</strong></TableCell>
                <TableCell><strong>Empresa</strong></TableCell>
                <TableCell><strong>Dirección</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Empleados</strong></TableCell>
                <TableCell><strong>Capacitaciones</strong></TableCell>
                <TableCell><strong>Accidentes</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sucursales.map((sucursal) => {
                const isExpanded = expandedRows.has(sucursal.id);
                const stats = sucursalesStats[sucursal.id] || {
                  empleados: 0,
                  capacitaciones: 0,
                  capacitacionesCompletadas: 0,
                  accidentes: 0,
                  accidentesAbiertos: 0
                };

                return (
                  <React.Fragment key={sucursal.id}>
                    {/* Fila principal */}
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleRow(sucursal.id)}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {sucursal.nombre}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Creada: {formatearFecha(sucursal.fechaCreacion)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={sucursal.empresa || sucursal.empresaId} 
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {sucursal.direccion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {sucursal.telefono}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon color="primary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.empleados}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon color="secondary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.capacitacionesCompletadas}/{stats.capacitaciones}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ReportProblemIcon 
                            color={stats.accidentesAbiertos > 0 ? "error" : "action"} 
                            fontSize="small" 
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {stats.accidentes}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Editar sucursal">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenEditModal(sucursal)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Eliminar sucursal">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEliminar(sucursal.id, sucursal.nombre)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Fila expandible con botones de gestión */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ py: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                              Gestión de {sucursal.nombre}
                            </Typography>
                            
                            <Grid container spacing={2}>
                              {/* Dashboard */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  startIcon={<DashboardIcon />}
                                  onClick={() => navigateToPage('/dashboard-seguridad', sucursal.id)}
                                  sx={{ height: '60px', flexDirection: 'column', gap: 1 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Dashboard
                                  </Typography>
                                  <Typography variant="caption">
                                    Ver estadísticas
                                  </Typography>
                                </Button>
                              </Grid>
                              
                              {/* Empleados */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Button
                                  fullWidth
                                  variant="outlined"
                                  startIcon={<PeopleIcon />}
                                  onClick={() => navigateToPage('/empleados', sucursal.id)}
                                  sx={{ height: '60px', flexDirection: 'column', gap: 1 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Empleados
                                  </Typography>
                                  <Typography variant="caption">
                                    {stats.empleados} registrados
                                  </Typography>
                                </Button>
                              </Grid>
                              
                              {/* Capacitaciones */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Button
                                  fullWidth
                                  variant="outlined"
                                  startIcon={<SchoolIcon />}
                                  onClick={() => navigateToPage('/capacitaciones', sucursal.id)}
                                  sx={{ height: '60px', flexDirection: 'column', gap: 1 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Capacitaciones
                                  </Typography>
                                  <Typography variant="caption">
                                    {stats.capacitacionesCompletadas}/{stats.capacitaciones} completadas
                                  </Typography>
                                </Button>
                              </Grid>
                              
                              {/* Accidentes */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Button
                                  fullWidth
                                  variant="outlined"
                                  startIcon={<ReportProblemIcon />}
                                  onClick={() => navigateToPage('/accidentes', sucursal.id)}
                                  sx={{ height: '60px', flexDirection: 'column', gap: 1 }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Accidentes
                                  </Typography>
                                  <Typography variant="caption">
                                    {stats.accidentes} registrados
                                  </Typography>
                                </Button>
                              </Grid>
                            </Grid>
                            
                            {/* Resumen de estadísticas */}
                            <Box sx={{ mt: 3, p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Resumen de {sucursal.nombre}:
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                      {stats.empleados}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Empleados activos
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                                      {stats.capacitacionesCompletadas}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Capacitaciones completadas
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                      {stats.capacitaciones - stats.capacitacionesCompletadas}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Capacitaciones pendientes
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color={stats.accidentes > 0 ? "error" : "success.main"} sx={{ fontWeight: 'bold' }}>
                                      {stats.accidentes}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Incidentes/Accidentes
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
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
      
      {openEditModal && sucursalEdit && (
        <EditarSucursalModal
          open={openEditModal}
          handleClose={handleCloseEditModal}
          handleEditSucursal={handleEditSucursal}
          sucursal={sucursalEdit}
          handleInputChange={handleEditInputChange}
          loading={editLoading}
        />
      )}
    </Box>
  );
};

export default ListaSucursales; 