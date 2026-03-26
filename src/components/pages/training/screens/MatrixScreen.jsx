import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '@/components/context/AuthContext';
import { useGlobalSelection } from '../../../../hooks/useGlobalSelection';
import { useTrainingMatrix } from '../../../../hooks/training/useTrainingMatrix';
import { useMatrixPendingChanges } from '../../../../hooks/training/useMatrixPendingChanges';
import TrainingMatrixTable from '../components/matrix/TrainingMatrixTable';
import AddPlanItemModal from '../components/matrix/AddPlanItemModal';
import SaveSessionModal from '../components/matrix/SaveSessionModal';
import SessionViewDrawer from '../components/matrix/SessionViewDrawer';

export default function MatrixScreen() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const { sucursalId, sucursalesDisponibles, empresasDisponibles, setEmpresa, setSucursal, selectedEmpresa } = useGlobalSelection();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const isHistorical = year < currentYear;
  const effectiveSucursalId = sucursalId === 'todas' ? null : sucursalId;

  const {
    columnsByMonth,
    rows,
    planId,
    loading,
    error,
    refresh
  } = useTrainingMatrix({
    ownerId,
    sucursalId: effectiveSucursalId,
    year
  });

  const {
    changes,
    setPendingChange,
    clearPendingChanges,
    pendingCount,
    hasPendingChanges
  } = useMatrixPendingChanges();

  // AddPlanItem modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalMonth, setAddModalMonth] = useState(null);

  // SaveSession modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // SessionViewDrawer state
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewDrawerData, setViewDrawerData] = useState({ sessionId: null, empleadoId: null, trainingTypeName: '' });

  // Expanded months per employee: Set of `${empleadoId}_${month}`
  const [expandedCells, setExpandedCells] = useState(new Set());

  function toggleExpandCell(empleadoId, month) {
    const key = `${empleadoId}_${month}`;
    const newExpanded = new Set(expandedCells);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCells(newExpanded);
  }

  function handlePendingChange(planItemId, empleadoId, newState) {
    setPendingChange(empleadoId, planItemId, newState);
  }

  function handleAddToMonth(month) {
    setAddModalMonth(month);
    setAddModalOpen(true);
  }

  function handleCellClick(planItemId, empleadoId, sessionId, trainingTypeName) {
    if (!sessionId) return; // Solo abrir si hay sesión guardada
    setViewDrawerData({ sessionId, empleadoId, trainingTypeName });
    setViewDrawerOpen(true);
  }

  // Year selector options - prepared for dynamic scaling if needed
  const yearOptions = useMemo(() => {
    const years = [currentYear - 1, currentYear, currentYear + 1];
    // Future: if system needs >3 years, group by period here
    // if (years.length > 5) { groupByPeriod(years) }
    return years;
  }, [currentYear]);

  // Existing trainingTypeIds for the selected month (to prevent duplicates)
  const existingTypeIdsForMonth = useMemo(() => {
    if (!addModalMonth) return [];
    return (columnsByMonth[addModalMonth] || []).map(c => c.trainingTypeId);
  }, [columnsByMonth, addModalMonth]);

  return (
    <Box>
      {/* Controls bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        sx={{ mb: 2 }}
      >
        {empresasDisponibles.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedEmpresa || ''}
              label="Empresa"
              onChange={e => setEmpresa(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {empresasDisponibles.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.nombre || e.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sucursal</InputLabel>
          <Select
            value={sucursalId || 'todas'}
            label="Sucursal"
            onChange={e => setSucursal(e.target.value === 'todas' ? '' : e.target.value)}
          >
            <MenuItem value="todas">Todas</MenuItem>
            {sucursalesDisponibles.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.nombre || s.id}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Año</InputLabel>
          <Select
            value={year}
            label="Año"
            onChange={e => setYear(Number(e.target.value))}
          >
            {yearOptions.map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Recargar">
          <IconButton onClick={refresh} size="small" disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ ml: 'auto' }} />

        <Tooltip title="Configuración - Catálogo">
          <IconButton
            size="small"
            onClick={() => navigate('/training/config')}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {isHistorical && (
        <Alert severity="info" sx={{ mb: 2 }}>
          📅 Estás viendo datos del año anterior. No se pueden realizar cambios.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!effectiveSucursalId && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Seleccioná una sucursal para ver la matriz de capacitaciones.
        </Alert>
      )}

      {effectiveSucursalId && (
        <TrainingMatrixTable
          columnsByMonth={columnsByMonth}
          rows={rows}
          pendingChanges={changes}
          onPendingChange={isHistorical ? undefined : handlePendingChange}
          onCellClick={isHistorical ? undefined : handleCellClick}
          onAddToMonth={isHistorical ? undefined : handleAddToMonth}
          loading={loading}
          expandedCells={expandedCells}
          onToggleExpand={toggleExpandCell}
        />
      )}

      {/* Floating save button */}
      {hasPendingChanges && !isHistorical && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SaveIcon />}
            onClick={() => setSaveModalOpen(true)}
            sx={{
              borderRadius: 8,
              px: 3,
              boxShadow: 6,
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Guardar sesión ({pendingCount} cambio{pendingCount !== 1 ? 's' : ''})
          </Button>
        </Box>
      )}

      {/* Save session modal */}
      <SaveSessionModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        pendingChanges={changes}
        columnsByMonth={columnsByMonth}
        planId={planId}
        sucursalId={effectiveSucursalId}
        year={year}
        onSaved={() => {
          setSaveModalOpen(false);
          clearPendingChanges();
          refresh();
        }}
      />

      {/* Add plan item modal */}
      <AddPlanItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        month={addModalMonth}
        year={year}
        planId={planId}
        sucursalId={effectiveSucursalId}
        existingTrainingTypeIds={existingTypeIdsForMonth}
        onSaved={() => { setAddModalOpen(false); refresh(); }}
      />

      {/* Session view drawer */}
      <SessionViewDrawer
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        sessionId={viewDrawerData.sessionId}
        empleadoId={viewDrawerData.empleadoId}
        trainingTypeName={viewDrawerData.trainingTypeName}
      />
    </Box>
  );
}
