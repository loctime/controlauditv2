import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '@/components/context/AuthContext';
import { useGlobalSelection } from '../../../../hooks/useGlobalSelection';
import { useTrainingMatrix, CELL_STATE } from '../../../../hooks/training/useTrainingMatrix';
import TrainingMatrixTable from '../components/matrix/TrainingMatrixTable';
import SessionCellDrawer from '../components/matrix/SessionCellDrawer';
import AddPlanItemModal from '../components/matrix/AddPlanItemModal';

/**
 * Pantalla de la matriz de capacitaciones.
 * Filas = empleados, columnas = items del plan agrupados por mes.
 */
export default function MatrixScreen() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const { sucursalId, sucursalesDisponibles, empresasDisponibles, setEmpresa, setSucursal, selectedEmpresa } = useGlobalSelection();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const {
    columnsByMonth,
    rows,
    planId,
    sessions,
    sessionByPlanItem,
    attendanceMap = {},
    loading,
    error,
    refresh
  } = useTrainingMatrix({
    ownerId,
    sucursalId: sucursalId === 'todas' ? null : sucursalId,
    year
  });

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContext, setDrawerContext] = useState(null);
  // { planItemId, planId, empleadoId, empleadoNombre, trainingTypeId, trainingTypeName, month, year, sucursalId, session, attendanceRecord }

  // AddPlanItem modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalMonth, setAddModalMonth] = useState(null);

  function handleCellClick(planItemId, empleadoId) {
    // Find the planItem column info
    let planItemCol = null;
    let itemMonth = null;
    for (const [month, cols] of Object.entries(columnsByMonth)) {
      const col = cols.find(c => c.planItemId === planItemId);
      if (col) {
        planItemCol = col;
        itemMonth = Number(month);
        break;
      }
    }
    if (!planItemCol) return;

    const row = rows.find(r => r.empleadoId === empleadoId);
    const cellState = row?.cellMap[planItemId];
    const session = sessionByPlanItem[planItemId] || null;

    // Attendance record for this employee in the session
    const attendanceRecord = cellState === CELL_STATE.NOT_APPLICABLE
      ? 'N/A'
      : (session ? (attendanceMap[session.id]?.[empleadoId] || null) : null);

    setDrawerContext({
      planItemId,
      planId,
      empleadoId,
      empleadoNombre: row?.nombre || '',
      trainingTypeId: planItemCol.trainingTypeId,
      trainingTypeName: planItemCol.name,
      month: itemMonth,
      year,
      sucursalId: sucursalId === 'todas' ? null : sucursalId,
      session,
      attendanceRecord
    });
    setDrawerOpen(true);
  }

  function handleAddToMonth(month) {
    setAddModalMonth(month);
    setAddModalOpen(true);
  }

  // Year options: current year ± 2
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const effectiveSucursalId = sucursalId === 'todas' ? null : sucursalId;

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
        {/* Empresa selector (if multiple) */}
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

        {/* Sucursal selector */}
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

        {/* Year selector */}
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
      </Stack>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* No sucursal selected warning */}
      {!effectiveSucursalId && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Seleccioná una sucursal para ver la matriz de capacitaciones.
        </Alert>
      )}

      {/* Matrix table */}
      {effectiveSucursalId && (
        <TrainingMatrixTable
          columnsByMonth={columnsByMonth}
          rows={rows}
          onCellClick={handleCellClick}
          onAddToMonth={handleAddToMonth}
          loading={loading}
        />
      )}

      {/* Session cell drawer */}
      {drawerContext && (
        <SessionCellDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          {...drawerContext}
          onSaved={() => { setDrawerOpen(false); refresh(); }}
        />
      )}

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
    </Box>
  );
}
