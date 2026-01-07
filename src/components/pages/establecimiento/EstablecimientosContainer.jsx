import React, { useState, useEffect } from "react";
import {
  Button,
  Grid,
  Typography,
  Box,
  Tooltip,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { useAuth } from '@/components/context/AuthContext';
import AddEmpresaModal from "./AddEmpresaModal";
import EliminarEmpresa from "./EliminarEmpresa";
import EditarEmpresaModal from "./EditarEmpresa";
import EmpresaOperariosDialog from "./EmpresaOperariosDialog";
import SucursalesTab from "./tabs/SucursalesTab";
import EmpleadosTab from "./tabs/EmpleadosTab";
import CapacitacionesTab from "./tabs/CapacitacionesTab";
import AccidentesTab from "./tabs/AccidentesTab";
import EmpresaStats from "./components/EmpresaStats";

// Hooks personalizados
import { useEmpresasStats, useEmpresasHandlers, useEmpresasEditHandlers } from './hooks';

// Componentes
import EmpresasHeader from './components/EmpresasHeader';
import EmpresaTableHeader from './components/EmpresaTableHeader';
import EmpresaRow from './components/EmpresaRow';

const EstablecimientosContainer = () => {
  const {
    userProfile,
    userEmpresas,
    loadingEmpresas,
    crearEmpresa,
    verificarYCorregirEmpresas,
    updateEmpresa
  } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Obtener ownerId desde userProfile (viene del token)
  const ownerId = userProfile?.ownerId;
  const { empresasStats, loadEmpresasStats } = useEmpresasStats(userEmpresas, ownerId);

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
  } = useEmpresasEditHandlers(updateEmpresa);

  const [openModal, setOpenModal] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openOperariosModal, setOpenOperariosModal] = useState(false);
  const [selectedEmpresaForOperarios, setSelectedEmpresaForOperarios] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [activeTabPerEmpresa, setActiveTabPerEmpresa] = useState({});

  const formatearEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const toggleRow = (empresaId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(empresaId)) {
      newExpanded.delete(empresaId);
    } else {
      newExpanded.add(empresaId);
    }
    setExpandedRows(newExpanded);
  };

  const setActiveTab = (empresaId, tab) => {
    setActiveTabPerEmpresa(prev => ({
      ...prev,
      [empresaId]: tab
    }));
  };

  const getActiveTab = (empresaId) => {
    return activeTabPerEmpresa[empresaId] || 'sucursales';
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    resetEmpresa();
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
        onNavigateToAccidentes={() => navigate('/accidentes')}
        onAddEmpresa={() => {
          console.log('🔵 [EstablecimientosContainer] Botón "Agregar Empresa" clickeado');
          console.log('[EstablecimientosContainer] Abriendo modal...');
          console.log('[EstablecimientosContainer] ownerId actual:', ownerId);
          setOpenModal(true);
        }}
      />

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Haz clic en la flecha para expandir y ver las opciones de gestión para cada empresa.
      </Typography>

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
        <TableContainer component={Paper}>
          <Table>
            <EmpresaTableHeader />
            <TableBody>
              {(userEmpresas || []).filter(empresa => empresa && empresa.id && empresa.nombre).map((empresa) => {
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
                  <React.Fragment key={empresa.id}>
                    <EmpresaRow
                      empresa={empresa}
                      stats={stats}
                      isExpanded={isExpanded}
                      onToggleRow={toggleRow}
                      onTabChange={setActiveTab}
                      formatearEmail={formatearEmail}
                      onEditClick={handleOpenEditModal}
                      onOperariosClick={handleOpenOperariosModal}
                      EliminarEmpresaComponent={EliminarEmpresa}
                    />

                    <TableRow>
                      <TableCell colSpan={10} sx={{ py: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 1, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
                            <Box>
                              {getActiveTab(empresa.id) === 'sucursales' && (
                                <SucursalesTab
                                  empresaId={empresa.id}
                                  empresaNombre={empresa.nombre}
                                  userEmpresas={userEmpresas}
                                  loadEmpresasStats={loadEmpresasStats}
                                />
                              )}
                              {getActiveTab(empresa.id) === 'empleados' && (
                                <EmpleadosTab empresaId={empresa.id} empresaNombre={empresa.nombre} />
                              )}
                              {getActiveTab(empresa.id) === 'capacitaciones' && (
                                <CapacitacionesTab empresaId={empresa.id} empresaNombre={empresa.nombre} />
                              )}
                              {getActiveTab(empresa.id) === 'accidentes' && (
                                <AccidentesTab empresaId={empresa.id} empresaNombre={empresa.nombre} />
                              )}
                            </Box>
                            <EmpresaStats empresaNombre={empresa.nombre} stats={stats} />
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

      {openModal && (
        <AddEmpresaModal
          open={openModal}
          handleClose={handleCloseModal}
          handleAddEmpresa={async () => {
            console.log('🔵 [EstablecimientosContainer] handleAddEmpresa wrapper llamado');
            console.log('[EstablecimientosContainer] ownerId:', ownerId);
            console.log('[EstablecimientosContainer] empresa:', empresa);
            try {
              await handleAddEmpresa();
              console.log('[EstablecimientosContainer] ✅ handleAddEmpresa completado, cerrando modal');
              setOpenModal(false);
            } catch (error) {
              console.error('[EstablecimientosContainer] ❌ ERROR en handleAddEmpresa:', error);
              throw error; // Re-lanzar para que se muestre el error
            }
          }}
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
    </Box>
  );
};

export default EstablecimientosContainer;
