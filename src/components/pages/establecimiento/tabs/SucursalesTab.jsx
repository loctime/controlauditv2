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
  Tooltip
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EmpleadosContent from './EmpleadosContent';
import CapacitacionesContent from './CapacitacionesContent';
import AccidentesContent from './AccidentesContent';

const SucursalesTab = ({ empresaId, empresaNombre, userEmpresas, loadEmpresasStats }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSucursalForm, setOpenSucursalForm] = useState(false);
  const [sucursalForm, setSucursalForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    horasSemanales: 40
  });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sucursalesStats, setSucursalesStats] = useState({});
  const [activeTabPerSucursal, setActiveTabPerSucursal] = useState({});
  const [openEditModal, setOpenEditModal] = useState(false);
  const [sucursalEdit, setSucursalEdit] = useState(null);

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
        const [empleadosSnapshot, capacitacionesSnapshot, planesSnapshot, accidentesSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'empleados'), where('sucursalId', '==', sucursal.id))),
          getDocs(query(collection(db, 'capacitaciones'), where('sucursalId', '==', sucursal.id))),
          getDocs(query(collection(db, 'planes_capacitaciones_anuales'), where('sucursalId', '==', sucursal.id))),
          getDocs(query(collection(db, 'accidentes'), where('sucursalId', '==', sucursal.id)))
        ]);
        
        const capacitacionesData = capacitacionesSnapshot.docs.map(doc => doc.data());
        const capacitacionesCompletadas = capacitacionesData.filter(cap => cap.estado === 'completada').length;
        
        // Contar capacitaciones de planes anuales
        const planesData = planesSnapshot.docs.map(doc => doc.data());
        const capacitacionesDePlanes = planesData.reduce((total, plan) => total + (plan.capacitaciones?.length || 0), 0);
        
        // Debug logs
        console.log(`Sucursal ${sucursal.nombre}:`, {
          totalCapacitaciones: capacitacionesSnapshot.docs.length,
          capacitacionesCompletadas: capacitacionesCompletadas,
          planesAnuales: planesSnapshot.docs.length,
          capacitacionesDePlanes: capacitacionesDePlanes,
          estados: capacitacionesData.map(cap => cap.estado)
        });
        
        stats[sucursal.id] = {
          empleados: empleadosSnapshot.docs.length,
          capacitaciones: capacitacionesSnapshot.docs.length + capacitacionesDePlanes,
          capacitacionesCompletadas: capacitacionesCompletadas,
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

  const navigateToPage = (page, data) => {
    if (typeof data === 'string') {
      // Compatibilidad hacia atrás: si data es un string, es sucursalId
      console.log('Navegando a:', page, 'con sucursalId:', data);
      localStorage.setItem('selectedSucursal', data);
      navigate(page);
    } else if (typeof data === 'object') {
      // Si data es un objeto con empresaId y sucursalId
      console.log('Navegando a:', page, 'con empresaId:', data.empresaId, 'y sucursalId:', data.sucursalId);
      navigate(page, { state: { empresaId: data.empresaId, sucursalId: data.sucursalId } });
    } else {
      navigate(page);
    }
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

      setSucursalForm({ nombre: '', direccion: '', telefono: '', horasSemanales: 40 });
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

  const handleEditSucursal = (sucursal) => {
    setSucursalEdit({
      id: sucursal.id,
      nombre: sucursal.nombre,
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      horasSemanales: sucursal.horasSemanales || 40
    });
    setOpenEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setSucursalEdit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSucursal = async () => {
    if (!sucursalEdit.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la sucursal es requerido'
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'sucursales', sucursalEdit.id), {
        nombre: sucursalEdit.nombre,
        direccion: sucursalEdit.direccion,
        telefono: sucursalEdit.telefono,
        horasSemanales: parseInt(sucursalEdit.horasSemanales),
        fechaModificacion: Timestamp.now(),
        modificadoPor: userProfile?.uid,
        modificadoPorEmail: userProfile?.email
      });

      setSucursalEdit(null);
      setOpenEditModal(false);
      
      await loadSucursales();
      
      if (typeof loadEmpresasStats === 'function') {
        loadEmpresasStats(userEmpresas);
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Sucursal actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error actualizando sucursal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar la sucursal: ' + error.message
      });
    }
  };

  const handleDeleteSucursal = async (sucursal) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la sucursal "${sucursal.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        // Verificar si hay empleados asociados
        const empleadosSnapshot = await getDocs(
          query(collection(db, 'empleados'), where('sucursalId', '==', sucursal.id))
        );

        if (empleadosSnapshot.docs.length > 0) {
          Swal.fire({
            icon: 'error',
            title: 'No se puede eliminar',
            text: `La sucursal "${sucursal.nombre}" tiene ${empleadosSnapshot.docs.length} empleado(s) asociado(s). Elimina primero los empleados.`
          });
          return;
        }

        await deleteDoc(doc(db, 'sucursales', sucursal.id));

        await loadSucursales();
        
        if (typeof loadEmpresasStats === 'function') {
          loadEmpresasStats(userEmpresas);
        }

        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Sucursal eliminada exitosamente'
        });
      } catch (error) {
        console.error('Error eliminando sucursal:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar la sucursal: ' + error.message
        });
      }
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
                <TableCell align="center"><strong>Horas/Semana</strong></TableCell>
                <TableCell align="center"><strong>Empleados</strong></TableCell>
                <TableCell align="center"><strong>Capacitaciones</strong></TableCell>
                <TableCell align="center"><strong>Accidentes</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
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
                        {sucursal.horasSemanales || '40'}h
                      </TableCell>
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
                          {stats.capacitaciones}
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
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Editar sucursal">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditSucursal(sucursal)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar sucursal">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteSucursal(sucursal)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0 }}>
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
                              <AccidentesContent sucursalId={sucursal.id} sucursalNombre={sucursal.nombre} empresaId={empresaId} navigateToPage={navigateToPage} />
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
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Horas Semanales
                </Typography>
                <input
                  type="number"
                  name="horasSemanales"
                  value={sucursalForm.horasSemanales}
                  onChange={handleSucursalFormChange}
                  placeholder="40"
                  min="1"
                  max="168"
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

      {/* Modal para editar sucursal */}
      {openEditModal && sucursalEdit && (
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
          onClick={() => setOpenEditModal(false)}
        >
          <Paper
            sx={{ p: 3, maxWidth: 400, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Editar Sucursal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Nombre *
                </Typography>
                <input
                  type="text"
                  name="nombre"
                  value={sucursalEdit.nombre}
                  onChange={handleEditFormChange}
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
                  value={sucursalEdit.direccion}
                  onChange={handleEditFormChange}
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
                  value={sucursalEdit.telefono}
                  onChange={handleEditFormChange}
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
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Horas Semanales
                </Typography>
                <input
                  type="number"
                  name="horasSemanales"
                  value={sucursalEdit.horasSemanales}
                  onChange={handleEditFormChange}
                  placeholder="40"
                  min="1"
                  max="168"
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
                  onClick={handleUpdateSucursal}
                  sx={{ flex: 1 }}
                >
                  Actualizar
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setOpenEditModal(false)}
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

export default SucursalesTab;