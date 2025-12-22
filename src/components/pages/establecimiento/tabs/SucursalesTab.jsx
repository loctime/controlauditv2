import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Table,
  TableBody,
  TableContainer,
  useTheme
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseControlFile';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EmpleadosContent from './EmpleadosContent';
import CapacitacionesContent from './CapacitacionesContent';
import AccidentesContent from './AccidentesContent';
import AccionesRequeridas from '../components/AccionesRequeridas';
import { registrarAccionSistema, normalizeSucursal } from '../../../../utils/firestoreUtils';
import { calcularProgresoTargets } from '../../../../utils/sucursalTargetUtils';
import { useSucursalesStats } from '../hooks/useSucursalesStats';
import SucursalTableHeader from '../components/SucursalTableHeader';
import SucursalRow from '../components/SucursalRow';
import SucursalFormModal from '../components/SucursalFormModal';

const SucursalesTab = ({ empresaId, empresaNombre, userEmpresas, loadEmpresasStats }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { sucursalesStats, loadSucursalesStats } = useSucursalesStats();
  
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [targetsProgreso, setTargetsProgreso] = useState({});
  const [activeTabPerSucursal, setActiveTabPerSucursal] = useState({});
  
  // Estado del modal unificado
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [sucursalForm, setSucursalForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    horasSemanales: 40,
    targetMensual: 0,
    targetAnualAuditorias: 12,
    targetMensualCapacitaciones: 1,
    targetAnualCapacitaciones: 12
  });

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
      const sucursalesData = snapshot.docs.map(doc => normalizeSucursal(doc));
      setSucursales(sucursalesData);
      
      // Cargar estadísticas de cada sucursal
      await loadSucursalesStats(sucursalesData);
      
      // Cargar progreso de targets mensuales
      const progresos = await calcularProgresoTargets(sucursalesData);
      setTargetsProgreso(progresos);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSucursalForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setSucursalForm({
      nombre: '',
      direccion: '',
      telefono: '',
      horasSemanales: 40,
      targetMensual: 0,
      targetAnualAuditorias: 12,
      targetMensualCapacitaciones: 1,
      targetAnualCapacitaciones: 12
    });
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setModalMode('create');
    setOpenModal(true);
  };

  const handleOpenEditModal = (sucursal) => {
    setSucursalForm({
      id: sucursal.id,
      nombre: sucursal.nombre,
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      horasSemanales: sucursal.horasSemanales || 40,
      targetMensual: sucursal.targetMensual || 0,
      targetAnualAuditorias: sucursal.targetAnualAuditorias || 12,
      targetMensualCapacitaciones: sucursal.targetMensualCapacitaciones || 1,
      targetAnualCapacitaciones: sucursal.targetAnualCapacitaciones || 12
    });
    setModalMode('edit');
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!sucursalForm.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la sucursal es requerido'
      });
      return;
    }

    try {
      if (modalMode === 'create') {
        const docRef = await addDoc(collection(db, 'sucursales'), {
          nombre: sucursalForm.nombre,
          direccion: sucursalForm.direccion || '',
          telefono: sucursalForm.telefono || '',
          horasSemanales: parseInt(sucursalForm.horasSemanales) || 40,
          targetMensual: parseInt(sucursalForm.targetMensual) || 0,
          targetAnualAuditorias: parseInt(sucursalForm.targetAnualAuditorias) || 12,
          targetMensualCapacitaciones: parseInt(sucursalForm.targetMensualCapacitaciones) || 1,
          targetAnualCapacitaciones: parseInt(sucursalForm.targetAnualCapacitaciones) || 12,
          empresaId: empresaId,
          fechaCreacion: Timestamp.now()
        });

        await registrarAccionSistema(
          userProfile?.uid,
          `Sucursal creada: ${sucursalForm.nombre}`,
          {
            sucursalId: docRef.id,
            nombre: sucursalForm.nombre,
            empresaId: empresaId,
            direccion: sucursalForm.direccion
          },
          'crear',
          'sucursal',
          docRef.id
        );

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Sucursal creada exitosamente'
        });
      } else {
        // Modo edición
        await updateDoc(doc(db, 'sucursales', sucursalForm.id), {
          nombre: sucursalForm.nombre,
          direccion: sucursalForm.direccion,
          telefono: sucursalForm.telefono,
          horasSemanales: parseInt(sucursalForm.horasSemanales),
          targetMensual: parseInt(sucursalForm.targetMensual) || 0,
          targetAnualAuditorias: parseInt(sucursalForm.targetAnualAuditorias) || 12,
          targetMensualCapacitaciones: parseInt(sucursalForm.targetMensualCapacitaciones) || 1,
          targetAnualCapacitaciones: parseInt(sucursalForm.targetAnualCapacitaciones) || 12,
          fechaModificacion: Timestamp.now()
        });

        await registrarAccionSistema(
          userProfile?.uid,
          `Sucursal actualizada: ${sucursalForm.nombre}`,
          {
            sucursalId: sucursalForm.id,
            nombre: sucursalForm.nombre,
            cambios: {
              direccion: sucursalForm.direccion,
              telefono: sucursalForm.telefono,
              horasSemanales: sucursalForm.horasSemanales
            }
          },
          'editar',
          'sucursal',
          sucursalForm.id
        );

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Sucursal actualizada exitosamente'
        });
      }

      setOpenModal(false);
      resetForm();
      await loadSucursales();
      
      if (typeof loadEmpresasStats === 'function') {
        loadEmpresasStats(userEmpresas);
      }
    } catch (error) {
      console.error(`Error ${modalMode === 'create' ? 'creando' : 'actualizando'} sucursal:`, error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al ${modalMode === 'create' ? 'crear' : 'actualizar'} la sucursal: ${error.message}`
      });
    }
  };

  const handleDeleteSucursal = async (sucursal) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la sucursal "${sucursal.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme.palette.error.main,
      cancelButtonColor: theme.palette.primary.main,
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

        await registrarAccionSistema(
          userProfile?.uid,
          `Sucursal eliminada: ${sucursal.nombre}`,
          {
            sucursalId: sucursal.id,
            nombre: sucursal.nombre,
            empresaId: empresaId
          },
          'eliminar',
          'sucursal',
          sucursal.id
        );

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

  const renderExpandedContent = (sucursal) => {
    const activeTab = getActiveTab(sucursal.id);
    
    return (
      <Box sx={{ p: 3, backgroundColor: theme.palette.background.default, borderTop: `1px solid ${theme.palette.divider}` }}>
        {activeTab === 'empleados' && (
          <EmpleadosContent 
            sucursalId={sucursal.id} 
            sucursalNombre={sucursal.nombre} 
            navigateToPage={navigateToPage}
            reloadSucursalesStats={reloadSucursalesStats}
            loadEmpresasStats={loadEmpresasStats}
            userEmpresas={userEmpresas}
          />
        )}
        {activeTab === 'capacitaciones' && (
          <CapacitacionesContent 
            sucursalId={sucursal.id} 
            sucursalNombre={sucursal.nombre} 
            navigateToPage={navigateToPage} 
          />
        )}
        {activeTab === 'accidentes' && (
          <AccidentesContent 
            sucursalId={sucursal.id} 
            sucursalNombre={sucursal.nombre} 
            empresaId={empresaId} 
            navigateToPage={navigateToPage} 
          />
        )}
        {activeTab === 'acciones_requeridas' && (
          <AccionesRequeridas 
            sucursalId={sucursal.id} 
            sucursalNombre={sucursal.nombre} 
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Sucursales de {empresaNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<StorefrontIcon />}
          onClick={handleOpenCreateModal}
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
            <SucursalTableHeader />
            <TableBody>
              {sucursales.map((sucursal) => {
                const isExpanded = expandedRows.has(sucursal.id);
                const stats = sucursalesStats[sucursal.id] || { 
                  empleados: 0, 
                  capacitaciones: 0, 
                  capacitacionesCompletadas: 0, 
                  accidentes: 0, 
                  accidentesAbiertos: 0, 
                  accionesRequeridas: 0 
                };
                const progreso = targetsProgreso[sucursal.id] || { 
                  completadas: 0, 
                  target: 0, 
                  porcentaje: 0, 
                  estado: 'sin_target' 
                };

                return (
                  <SucursalRow
                    key={sucursal.id}
                    sucursal={sucursal}
                    stats={stats}
                    progreso={progreso}
                    isExpanded={isExpanded}
                    activeTab={getActiveTab(sucursal.id)}
                    onToggleRow={toggleRow}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteSucursal}
                  >
                    {renderExpandedContent(sucursal)}
                  </SucursalRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal unificado para crear/editar */}
      <SucursalFormModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          resetForm();
        }}
        formData={sucursalForm}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        isEditing={modalMode === 'edit'}
      />
    </Box>
  );
};

export default SucursalesTab;
