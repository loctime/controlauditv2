import logger from '@/utils/logger';
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { registrarAccionSistema } from '../../../../utils/firestoreUtils';
import { calcularProgresoTargets } from '../../../../utils/sucursalTargetUtils';
import { useSucursalesStats } from '../hooks/useSucursalesStats';
import SucursalCard from '../components/SucursalCard';
import SucursalFormModal from '../components/SucursalFormModal';
import { sucursalService } from '../../../../services/sucursalService';

const SucursalesTab = ({ empresaId, empresaNombre, userEmpresas, loadEmpresasStats }) => {
  const { userProfile, getEffectiveOwnerId } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { sucursalesStats, loadSucursalesStats } = useSucursalesStats();

  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetsProgreso, setTargetsProgreso] = useState({});

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
    if (sucursales && sucursales.length > 0 && userProfile?.ownerId) {
      await loadSucursalesStats(sucursales, userProfile.ownerId);
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
      const ownerId = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
      if (!ownerId) {
        logger.error('Error: ownerId efectivo es requerido');
        return;
      }
      const sucursalesData = await sucursalService.listByEmpresa(ownerId, empresaId);
      setSucursales(sucursalesData);

      // Cargar estadísticas de cada sucursal
      await loadSucursalesStats(sucursalesData, ownerId);

      // Cargar progreso de targets mensuales
      const progresos = await calcularProgresoTargets(sucursalesData);
      setTargetsProgreso(progresos);
    } catch (error) {
      logger.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPage = (page, data) => {
    if (typeof data === 'string') {
      // Compatibilidad hacia atrás: si data es un string, es sucursalId
      logger.debug('Navegando a:', page, 'con sucursalId:', data);
      localStorage.setItem('selectedSucursal', data);
      navigate(page);
    } else if (typeof data === 'object') {
      // Si data es un objeto con empresaId y sucursalId
      logger.debug('Navegando a:', page, 'con empresaId:', data.empresaId, 'y sucursalId:', data.sucursalId);
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
      const ownerId = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
      if (!ownerId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'ownerId no disponible'
        });
        return;
      }
      const actor = { uid: userProfile?.uid || null, role: userProfile?.role || null };

      if (modalMode === 'create') {
        await sucursalService.crearSucursalCompleta(ownerId, { ...sucursalForm, empresaId }, actor);

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Sucursal creada exitosamente'
        });
      } else {
        // Modo edición
        await sucursalService.updateSucursal(ownerId, sucursalForm.id, {
          nombre: sucursalForm.nombre,
          direccion: sucursalForm.direccion,
          telefono: sucursalForm.telefono,
          horasSemanales: parseInt(sucursalForm.horasSemanales),
          targetMensual: parseInt(sucursalForm.targetMensual) || 0,
          targetAnualAuditorias: parseInt(sucursalForm.targetAnualAuditorias) || 12,
          targetMensualCapacitaciones: parseInt(sucursalForm.targetMensualCapacitaciones) || 1,
          targetAnualCapacitaciones: parseInt(sucursalForm.targetAnualCapacitaciones) || 12
        }, actor);

        // Mantener registrarAccionSistema (solo log) aquí por compatibilidad visual de historial
        await registrarAccionSistema(
          ownerId,
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

      if (typeof loadEmpresasStats === 'function' && ownerId) {
        loadEmpresasStats(userEmpresas, ownerId);
      }
    } catch (error) {
      logger.error(`Error ${modalMode === 'create' ? 'creando' : 'actualizando'} sucursal:`, error);
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
        const ownerId = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
        if (!ownerId) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'ownerId no disponible'
          });
          return;
        }

        // Verificar si hay empleados asociados
        const empleadosCount = await sucursalService.countEmpleadosBySucursal(ownerId, sucursal.id);

        if (empleadosCount > 0) {
          Swal.fire({
            icon: 'error',
            title: 'No se puede eliminar',
            text: `La sucursal "${sucursal.nombre}" tiene ${empleadosCount} empleado(s) asociado(s). Elimina primero los empleados.`
          });
          return;
        }

        await sucursalService.deleteSucursal(ownerId, sucursal.id, { uid: userProfile?.uid || null, role: userProfile?.role || null });

        await registrarAccionSistema(
          ownerId,
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
          loadEmpresasStats(userEmpresas, ownerId);
        }

        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Sucursal eliminada exitosamente'
        });
      } catch (error) {
        logger.error('Error eliminando sucursal:', error);
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
      {/* Header de sección */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', textTransform: 'uppercase' }}>
          Sucursales
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleOpenCreateModal}
        >
          + Agregar sucursal
        </Button>
      </Box>

      {/* Estados: loading / vacío / lista */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : sucursales.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No hay sucursales registradas para esta empresa
          </Typography>
        </Box>
      ) : (
        <Box>
          {sucursales.map((sucursal) => {
            const stats = sucursalesStats[sucursal.id] || {
              empleados: 0,
              capacitaciones: 0,
              capacitacionesCompletadas: 0,
              accidentes: 0,
              accidentesAbiertos: 0,
              accionesRequeridas: 0
            };

            return (
              <SucursalCard
                key={sucursal.id}
                sucursal={sucursal}
                stats={stats}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteSucursal}
                navigateToPage={navigateToPage}
                empresaId={empresaId}
              />
            );
          })}
        </Box>
      )}

      {/* Modal unificado crear/editar */}
      <SucursalFormModal
        open={openModal}
        onClose={() => { setOpenModal(false); resetForm(); }}
        formData={sucursalForm}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        isEditing={modalMode === 'edit'}
      />
    </Box>
  );
};

export default SucursalesTab;
