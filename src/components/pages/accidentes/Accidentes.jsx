import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Box,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import NuevoAccidenteModal from './NuevoAccidenteModal';
import NuevoIncidenteModal from './NuevoIncidenteModal';
import {
  useAccidentesData,
  useAccidentesFilters,
  useAccidentesHandlers
} from './hooks';
import AccidentesHeader from './components/AccidentesHeader';
import AccidentesAlertas from './components/AccidentesAlertas';
import AccidentesFiltros from './components/AccidentesFiltros';
import EstadisticasAccidentes from './components/EstadisticasAccidentes';
import AccidentesTabla from './components/AccidentesTabla';
import AccidenteDetalleModal from './components/AccidenteDetalleModal';
import { actualizarEstadoAccidente } from '../../../services/accidenteService';

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
  const [accidenteSeleccionado, setAccidenteSeleccionado] = useState(null);
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
    empresasCargadas
  );

  const {
    handleCrearAccidente,
    handleCrearIncidente,
    handleCambiarEstado
  } = useAccidentesHandlers(userProfile, recargarAccidentes);

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
      setAccidenteSeleccionado(match);
      setOpenDetalleModal(true);
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
    setAccidenteSeleccionado(accidente);
    setOpenDetalleModal(true);
  };

  const handleActualizarEstadoWrapper = async (accidenteId, nuevoEstado) => {
    return actualizarEstadoAccidente(accidenteId, nuevoEstado, userProfile?.uid);
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
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <EstadisticasAccidentes accidentes={accidentes} />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : accidentes.length === 0 ? (
          <Alert severity="info">No hay accidentes o incidentes registrados</Alert>
        ) : (
          <AccidentesTabla
            accidentes={accidentes}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            onVerDetalle={handleVerDetalle}
            onCerrarAccidente={handleCambiarEstado}
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

      <AccidenteDetalleModal
        open={openDetalleModal}
        onClose={() => setOpenDetalleModal(false)}
        accidente={accidenteSeleccionado}
        actualizarEstadoAccidente={handleActualizarEstadoWrapper}
      />
    </Container>
  );
}
