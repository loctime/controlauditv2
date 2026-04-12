import logger from '@/utils/logger';
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Swal from 'sweetalert2';
import { sucursalService } from '../../../services/sucursalService';
import { useAuth } from '@/components/context/AuthContext';
import AddEmpresaModal from "./AddEmpresaModal";
import SucursalFormModal from "./components/SucursalFormModal";
import EliminarEmpresa from "./EliminarEmpresa";
import EditarEmpresaModal from "./EditarEmpresa";
import EmpresaOperariosDialog from "./EmpresaOperariosDialog";
import SucursalesTab from "./tabs/SucursalesTab";

// Hooks personalizados
import { useEmpresasStats, useEmpresasHandlers, useEmpresasEditHandlers } from './hooks';
import { usePermissions } from '@/components/pages/admin/hooks/usePermissions';

// Componentes
import EmpresasHeader from './components/EmpresasHeader';
import EmpresaCard from './components/EmpresaCard';

const EstablecimientosContainer = () => {
  const {
    userProfile,
    userEmpresas,
    loadingEmpresas,
    crearEmpresa,
    verificarYCorregirEmpresas,
    updateEmpresa,
    getEffectiveOwnerId
  } = useAuth();
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Obtener ownerId efectivo (soporta impersonación de superdev)
  const ownerId = getEffectiveOwnerId ? getEffectiveOwnerId() : userProfile?.ownerId;
  const { empresasStats, loadEmpresasStats } = useEmpresasStats(userEmpresas, ownerId);

  // Obtener permisos del usuario
  const {
    canCreateEmpresa,
    canEditEmpresa,
    canDeleteEmpresa,
    canManageOperarios,
    canViewEmpresa
  } = usePermissions();

  const {
    empresa,
    loading,
    handleInputChange,
    handleLogoChange,
    handleAddEmpresa,
    resetEmpresa,
    setLoading
  } = useEmpresasHandlers(ownerId, updateEmpresa);

  const {
    empresaEdit,
    loading: editLoading,
    setEmpresaEdit,
    handleEditInputChange,
    handleEditLogoChange,
    handleEditEmpresa,
    setLoading: setEditLoading
  } = useEmpresasEditHandlers(updateEmpresa, ownerId);

  const [openModal, setOpenModal] = useState(false);
  const [verificando, setVerificando] = useState(false);

  // Estado para flujo post-creación de empresa → sucursal
  const [postCreacionEmpresaId, setPostCreacionEmpresaId] = useState(null);
  const [openSucursalPostCreacion, setOpenSucursalPostCreacion] = useState(false);
  const [sucursalPostCreacionForm, setSucursalPostCreacionForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    horasSemanales: 40,
    targetMensual: 0,
    targetAnualAuditorias: 12,
    targetMensualCapacitaciones: 1,
    targetAnualCapacitaciones: 12
  });
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openOperariosModal, setOpenOperariosModal] = useState(false);
  const [selectedEmpresaForOperarios, setSelectedEmpresaForOperarios] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const formatearEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const ownerEmail = userProfile?.email || '';

  const toggleRow = (empresaId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(empresaId)) {
      newExpanded.delete(empresaId);
    } else {
      newExpanded.add(empresaId);
    }
    setExpandedRows(newExpanded);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    resetEmpresa();
  };

  const handleCrearSucursalPostEmpresa = (empresaId) => {
    setPostCreacionEmpresaId(empresaId);
    setSucursalPostCreacionForm({
      nombre: '',
      direccion: '',
      telefono: '',
      horasSemanales: 40,
      targetMensual: 0,
      targetAnualAuditorias: 12,
      targetMensualCapacitaciones: 1,
      targetAnualCapacitaciones: 12
    });
    setOpenSucursalPostCreacion(true);
  };

  const handleCerrarSucursalPostCreacion = () => {
    setOpenSucursalPostCreacion(false);
    setPostCreacionEmpresaId(null);
  };

  const handleSucursalPostCreacionChange = (e) => {
    const { name, value } = e.target;
    setSucursalPostCreacionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSucursalPostCreacion = async () => {
    if (!sucursalPostCreacionForm.nombre.trim()) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'El nombre de la sucursal es requerido' });
      return;
    }
    try {
      await sucursalService.crearSucursalCompleta(
        ownerId,
        { ...sucursalPostCreacionForm, empresaId: postCreacionEmpresaId },
        { uid: userProfile?.uid || null, role: userProfile?.role || null }
      );
      Swal.fire({ icon: 'success', title: 'Éxito', text: 'Sucursal creada exitosamente' });
      setOpenSucursalPostCreacion(false);
      setPostCreacionEmpresaId(null);
    } catch (error) {
      logger.error('[EstablecimientosContainer] Error creando sucursal post-empresa:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error al crear la sucursal' });
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
      logger.error('Error al verificar empresas:', error);
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

  const handleOpenOperariosModal = (empresa) => {
    setSelectedEmpresaForOperarios(empresa);
    setOpenOperariosModal(true);
  };

  const handleCloseOperariosModal = () => {
    setOpenOperariosModal(false);
    setSelectedEmpresaForOperarios(null);
  };

  const eliminarEmpresa = async () => {
    // Las empresas se recargarán automáticamente desde el contexto
  };

  return (
    <Box sx={{ p: isSmallMobile ? 2 : 4 }}>
      <EmpresasHeader
        totalEmpresas={userEmpresas?.length || 0}
        isSmallMobile={isSmallMobile}
        onVerificar={handleVerificarEmpresas}
        verificando={verificando}
        onAddEmpresa={() => {
          logger.debug('🔵 [EstablecimientosContainer] Botón "Agregar Empresa" clickeado');
          logger.debug('[EstablecimientosContainer] Abriendo modal...');
          logger.debug('[EstablecimientosContainer] ownerId actual:', ownerId);
          setOpenModal(true);
        }}
        canCreateEmpresa={canCreateEmpresa}
      />

      {loadingEmpresas ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando empresas...
          </Typography>
        </Box>
      ) : (userEmpresas || []).length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay empresas registradas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Haz clic en "Agregar Empresa" para crear tu primera empresa
          </Typography>
        </Box>
      ) : (
        <Box>
          {((userEmpresas || [])
            .filter(empresa => empresa && empresa.id && empresa.nombre)
            .filter(empresa => canViewEmpresa(empresa.id)))
            .map((empresa) => {
              const isExpanded = expandedRows.has(empresa.id);
              const stats = empresasStats[empresa.id] || {
                sucursales: 0,
                empleados: 0,
                capacitaciones: 0,
                capacitacionesCompletadas: 0,
                accidentes: 0,
                accidentesAbiertos: 0
              };

              return (
                <EmpresaCard
                  key={empresa.id}
                  empresa={empresa}
                  stats={stats}
                  isExpanded={isExpanded}
                  onToggleRow={toggleRow}
                  formatearEmail={formatearEmail}
                  ownerEmail={ownerEmail}
                  effectiveOwnerId={ownerId}
                  onEditClick={handleOpenEditModal}
                  onOperariosClick={handleOpenOperariosModal}
                  EliminarEmpresaComponent={EliminarEmpresa}
                  canEditEmpresa={canEditEmpresa}
                  canDeleteEmpresa={canDeleteEmpresa}
                  canManageOperarios={canManageOperarios}
                >
                  <SucursalesTab
                    empresaId={empresa.id}
                    empresaNombre={empresa.nombre}
                    userEmpresas={userEmpresas}
                    loadEmpresasStats={loadEmpresasStats}
                  />
                </EmpresaCard>
              );
            })}
        </Box>
      )}

      {openModal && (
        <AddEmpresaModal
          open={openModal}
          handleClose={handleCloseModal}
          handleAddEmpresa={async () => {
            logger.debug('🔵 [EstablecimientosContainer] handleAddEmpresa wrapper llamado');
            logger.debug('[EstablecimientosContainer] ownerId:', ownerId);
            logger.debug('[EstablecimientosContainer] empresa:', empresa);
            try {
              const empresaId = await handleAddEmpresa();
              logger.debug('[EstablecimientosContainer] ✅ handleAddEmpresa completado, empresaId:', empresaId);
              return empresaId;
            } catch (error) {
              logger.error('[EstablecimientosContainer] ❌ ERROR en handleAddEmpresa:', error);
              throw error;
            }
          }}
          onCrearSucursal={handleCrearSucursalPostEmpresa}
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
          handleEditEmpresa={async () => {
            await handleEditEmpresa();
            setOpenEditModal(false);
          }}
          empresa={empresaEdit}
          handleInputChange={handleEditInputChange}
          handleLogoChange={handleEditLogoChange}
          loading={editLoading}
        />
      )}

      {openOperariosModal && selectedEmpresaForOperarios && (
        <EmpresaOperariosDialog
          open={openOperariosModal}
          handleClose={handleCloseOperariosModal}
          empresaId={selectedEmpresaForOperarios.id}
          empresaNombre={selectedEmpresaForOperarios.nombre}
          ownerId={ownerId}
        />
      )}

      <SucursalFormModal
        open={openSucursalPostCreacion}
        onClose={handleCerrarSucursalPostCreacion}
        formData={sucursalPostCreacionForm}
        onChange={handleSucursalPostCreacionChange}
        onSubmit={handleSubmitSucursalPostCreacion}
        isEditing={false}
      />
    </Box>
  );
};

export default EstablecimientosContainer;
