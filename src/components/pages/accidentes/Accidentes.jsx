import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Box,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { FileDownload } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import NuevoAccidenteModal from './NuevoAccidenteModal';
import NuevoIncidenteModal from './NuevoIncidenteModal';
import {
  useAccidentesData,
  useAccidentesFilters,
  useAccidentesHandlers
} from './hooks';
import { useAccidentesSorting } from './hooks/useAccidentesSorting';
import AccidentesHeader from './components/AccidentesHeader';
import AccidentesAlertas from './components/AccidentesAlertas';
import AccidentesFiltros from './components/AccidentesFiltros';
import EstadisticasAccidentes from './components/EstadisticasAccidentes';
import AccidentesTabla from './components/AccidentesTabla';
import AccidenteDetalleModal from './components/AccidenteDetalleModal';
import AccidenteDetailPanel from './components/AccidenteDetailPanel';
import EditarAccidenteModal from './components/EditarAccidenteModal';
import { actualizarEstadoAccidente } from '../../../services/accidenteService';
import { exportarAccidentesExcel, exportarAccidentesPDF } from './utils/accidentesExportUtils';

export default function Accidentes() {
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchIncidentId = searchParams.get('accidenteId');
  const searchEmpresaId = searchParams.get('empresaId');
  const searchSucursalId = searchParams.get('sucursalId');
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAccidenteModal, setOpenAccidenteModal] = useState(false);
  const [openIncidenteModal, setOpenIncidenteModal] = useState(false);
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [openEditarModal, setOpenEditarModal] = useState(false);
  const [accidenteSeleccionado, setAccidenteSeleccionado] = useState(null);
  const [accidenteEditando, setAccidenteEditando] = useState(null);
  const [selectedAccidenteId, setSelectedAccidenteId] = useState(null);
  const [panelInitialMode, setPanelInitialMode] = useState('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const initialIncidentId = location.state?.accidenteId || searchIncidentId;
  const [pendingIncidentId, setPendingIncidentId] = useState(initialIncidentId || null);

  const {
    selectedEmpresa,
    setSelectedEmpresa,
    selectedSucursal,
    setSelectedSucursal,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    sucursalesFiltradas,
    empresasCargadas,
    userEmpresas,
    userSucursales
  } = useAccidentesFilters(location);

  const { accidentes, loading, recargarAccidentes } = useAccidentesData(
    selectedEmpresa,
    selectedSucursal,
    filterTipo,
    filterEstado,
    empresasCargadas,
    userProfile
  );

  const {
    handleCrearAccidente,
    handleCrearIncidente,
    handleCambiarEstado,
    handleEliminarAccidente,
    handleActualizarAccidente
  } = useAccidentesHandlers(userProfile, recargarAccidentes);

  // Hook de ordenamiento
  const { orderBy, order, handleRequestSort, sortedAccidentes } = useAccidentesSorting(accidentes);

  // Filtrar accidentes por búsqueda y fechas
  const accidentesFiltrados = useMemo(() => {
    let filtrados = sortedAccidentes;

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(acc => 
        (acc.descripcion || '').toLowerCase().includes(term)
      );
    }

    // Filtro por rango de fechas
    if (fechaDesde) {
      filtrados = filtrados.filter(acc => {
        const fechaAcc = acc.fechaHora?.toDate?.() || new Date(acc.fechaHora || 0);
        return fechaAcc >= fechaDesde;
      });
    }

    if (fechaHasta) {
      filtrados = filtrados.filter(acc => {
        const fechaAcc = acc.fechaHora?.toDate?.() || new Date(acc.fechaHora || 0);
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        return fechaAcc <= hasta;
      });
    }

    return filtrados;
  }, [sortedAccidentes, searchTerm, fechaDesde, fechaHasta]);

  // Handlers de exportación
  const handleExportarExcel = async () => {
    try {
      await exportarAccidentesExcel(accidentesFiltrados);
    } catch (error) {
      console.error('Error exportando Excel:', error);
    }
  };

  const handleExportarPDF = () => {
    try {
      exportarAccidentesPDF(accidentesFiltrados);
    } catch (error) {
      console.error('Error exportando PDF:', error);
    }
  };

  useEffect(() => {
    if (location.state?.accidenteId) {
      setPendingIncidentId(location.state.accidenteId);
    }
  }, [location.state?.accidenteId]);

  useEffect(() => {
    if (searchIncidentId) {
      setPendingIncidentId(searchIncidentId);
    }
  }, [searchIncidentId]);

  useEffect(() => {
    if (!pendingIncidentId || loading || accidentes.length === 0) return;
    const match = accidentes.find(acc => acc.id === pendingIncidentId);
    if (match) {
      // Usar nuevo panel en lugar de modal
      setSelectedAccidenteId(pendingIncidentId);
      setPanelInitialMode('view');
    }
    setPendingIncidentId(null);

    const hasQueryParams = Boolean(searchIncidentId || searchEmpresaId || searchSucursalId);
    const stateHasAccidente = Boolean(location.state?.accidenteId);

    if (hasQueryParams || stateHasAccidente) {
      const { accidenteId, ...restState } = location.state || {};
      const hasState = restState && Object.keys(restState).length > 0;
      navigate(location.pathname, { replace: true, state: hasState ? restState : undefined });
    }
  }, [pendingIncidentId, accidentes, loading, navigate, location, searchIncidentId, searchEmpresaId, searchSucursalId]);

  const handleVerDetalle = (accidente) => {
    // Usar nuevo panel en lugar de modal
    setSelectedAccidenteId(accidente.id);
    setPanelInitialMode('view');
  };

  const handleActualizarEstadoWrapper = async (accidenteId, nuevoEstado) => {
    return actualizarEstadoAccidente(accidenteId, nuevoEstado, userProfile?.uid, userProfile);
  };

  const empresaActual = userEmpresas?.find(e => e.id === selectedEmpresa);
  const sucursalActual = sucursalesFiltradas?.find(s => s.id === selectedSucursal);

  const canCreate = selectedSucursal !== 'todas' && userEmpresas && userEmpresas.length > 0;

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
        <AccidentesHeader
          onCrearAccidente={() => setOpenAccidenteModal(true)}
          onCrearIncidente={() => setOpenIncidenteModal(true)}
          canCreate={canCreate}
          isSmallMobile={isSmallMobile}
        />

        <AccidentesAlertas
          userEmpresas={userEmpresas}
          selectedEmpresa={selectedEmpresa}
          sucursalesFiltradas={sucursalesFiltradas}
        />

        <Box sx={{ mb: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <AccidentesFiltros
              userEmpresas={userEmpresas}
              sucursalesFiltradas={sucursalesFiltradas}
              selectedEmpresa={selectedEmpresa}
              setSelectedEmpresa={setSelectedEmpresa}
              selectedSucursal={selectedSucursal}
              setSelectedSucursal={setSelectedSucursal}
              filterTipo={filterTipo}
              setFilterTipo={setFilterTipo}
              filterEstado={filterEstado}
              setFilterEstado={setFilterEstado}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
              onFechaDesdeChange={setFechaDesde}
              onFechaHastaChange={setFechaHasta}
            />
          </LocalizationProvider>
        </Box>

        <Box sx={{ mb: 3 }}>
          <EstadisticasAccidentes accidentes={accidentesFiltrados} />
        </Box>

        {/* Botones de exportación */}
        {accidentesFiltrados.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleExportarExcel}
            >
              Exportar Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleExportarPDF}
            >
              Exportar PDF
            </Button>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : accidentesFiltrados.length === 0 ? (
          <Alert severity="info">
            {accidentes.length === 0 
              ? 'No hay accidentes o incidentes registrados'
              : 'No se encontraron resultados con los filtros aplicados'}
          </Alert>
        ) : (
          <AccidentesTabla
            accidentes={accidentesFiltrados}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            onVerDetalle={handleVerDetalle}
            onCerrarAccidente={handleCambiarEstado}
            onEliminarAccidente={handleEliminarAccidente}
            onEditarAccidente={(acc) => {
              setAccidenteEditando(acc);
              setOpenEditarModal(true);
            }}
            orderBy={orderBy}
            order={order}
            onRequestSort={handleRequestSort}
          />
        )}
      </Paper>

      {openAccidenteModal && (
        <NuevoAccidenteModal
          open={openAccidenteModal}
          onClose={() => setOpenAccidenteModal(false)}
          onAccidenteCreado={handleCrearAccidente}
          empresaId={selectedEmpresa === 'todas' ? null : selectedEmpresa}
          sucursalId={selectedSucursal === 'todas' ? null : selectedSucursal}
          empresaNombre={empresaActual?.nombre}
          sucursalNombre={sucursalActual?.nombre}
        />
      )}

      {openIncidenteModal && (
        <NuevoIncidenteModal
          open={openIncidenteModal}
          onClose={() => setOpenIncidenteModal(false)}
          onIncidenteCreado={handleCrearIncidente}
          empresaId={selectedEmpresa === 'todas' ? null : selectedEmpresa}
          sucursalId={selectedSucursal === 'todas' ? null : selectedSucursal}
          empresaNombre={empresaActual?.nombre}
          sucursalNombre={sucursalActual?.nombre}
        />
      )}

      {/* Modal legacy (mantener por compatibilidad temporal) */}
      {openDetalleModal && (
        <AccidenteDetalleModal
          open={openDetalleModal}
          onClose={() => setOpenDetalleModal(false)}
          accidente={accidenteSeleccionado}
          actualizarEstadoAccidente={handleActualizarEstadoWrapper}
        />
      )}

      {/* Panel de detalles nuevo */}
      <AccidenteDetailPanel
        open={!!selectedAccidenteId}
        onClose={() => {
          setSelectedAccidenteId(null);
          setPanelInitialMode('view');
        }}
        accidenteId={selectedAccidenteId}
        initialMode={panelInitialMode}
        userId={userProfile?.uid}
        onRegistrarAccidente={(accidenteId) => {
          setPanelInitialMode('registrar');
        }}
        onMarcarCerrado={async (accidenteId) => {
          if (window.confirm('¿Marcar este accidente como cerrado?')) {
            try {
              await actualizarEstadoAccidente(accidenteId, 'cerrado', userProfile?.uid, userProfile);
              recargarAccidentes();
              setSelectedAccidenteId(null);
            } catch (error) {
              console.error('Error al cerrar accidente:', error);
              alert('Error al actualizar el estado del accidente');
            }
          }
        }}
        onEditarAccidente={(accidente) => {
          setAccidenteEditando(accidente);
          setOpenEditarModal(true);
        }}
        onSaved={(registroId) => {
          console.log('[Accidentes] Registro guardado, refrescando datos');
          recargarAccidentes();
        }}
      />

      <EditarAccidenteModal
        open={openEditarModal}
        onClose={() => {
          setOpenEditarModal(false);
          setAccidenteEditando(null);
        }}
        accidente={accidenteEditando}
        onGuardar={handleActualizarAccidente}
      />
    </Container>
  );
}
