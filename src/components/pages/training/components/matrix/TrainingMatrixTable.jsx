import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MatrixCell from './MatrixCell';
import TrainingMonthCarousel from './TrainingMonthCarousel';
import { CELL_STATE } from '../../../../../hooks/training/useTrainingMatrix';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function pctColor(pct) {
  if (pct >= 75) return '#66bb6a';
  if (pct >= 50) return '#ffa726';
  if (pct >= 25) return '#ef9a9a';
  return '#ef5350';
}

// Helper to determine which training items to show (max 2, or all if expanded)
function getVisibleItems(cols, isExpanded) {
  if (isExpanded || cols.length <= 2) {
    return { visible: cols, hidden: 0 };
  }
  return { visible: cols.slice(0, 2), hidden: cols.length - 2 };
}

function getMonthColumnCount(cols, isExpanded) {
  const { visible, hidden } = getVisibleItems(cols, isExpanded);
  return visible.length;
}

/**
 * Tabla principal de la matriz de capacitaciones.
 *
 * @param {{
 *   columnsByMonth: Object,
 *   rows: Array,
 *   pendingChanges: Object,   // { [empleadoId_planItemId]: { newState } }
 *   onPendingChange: (planItemId: string, empleadoId: string, newState: any) => void,
 *   onCellClick: (planItemId: string, empleadoId: string, sessionId: string|null, trainingTypeName: string) => void,
 *   onAddToMonth: (month: number) => void,
 *   loading: boolean,
 *   noPlanMessage?: string,
 *   expandedCells?: Set<string>,  // Set of `${empleadoId}_${month}`
 *   onToggleExpand?: (empleadoId: string, month: number) => void
 * }} props
 */
export default function TrainingMatrixTable({
  columnsByMonth,
  rows,
  pendingChanges = {},
  onPendingChange,
  onCellClick,
  onAddToMonth,
  loading,
  noPlanMessage,
  expandedCells = new Set(),
  onToggleExpand = () => {}
}) {
  // Sorted month numbers that appear in the plan
  const months = Object.keys(columnsByMonth)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (months.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {noPlanMessage || 'No hay plan de capacitaciones para este período. Usá el botón "+" para agregar capacitaciones.'}
        </Typography>
      </Paper>
    );
  }

  // Legend
  const LEGEND = [
    { state: CELL_STATE.NOT_TRAINED, label: 'No capacitado' },
    { state: CELL_STATE.IN_PROGRESS, label: 'En curso' },
    { state: CELL_STATE.COMPLETE, label: 'Capacitación completa' }
  ];

  const legendColors = {
    [CELL_STATE.NOT_TRAINED]: '#ef5350',
    [CELL_STATE.IN_PROGRESS]: '#ffa726',
    [CELL_STATE.COMPLETE]: '#66bb6a'
  };

  return (
    <Box>
      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        {LEGEND.map(({ state, label }) => (
          <Chip
            key={state}
            label={`${state}  ${label}`}
            size="small"
            sx={{ bgcolor: legendColors[state], color: '#fff', fontWeight: 600, fontSize: '0.78rem' }}
          />
        ))}
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            {/* Row 1: month headers */}
            <TableRow>
              <TableCell
                sx={{
                  minWidth: 160,
                  fontWeight: 700,
                  bgcolor: '#f5f5f5',
                  borderRight: '1px solid #e0e0e0',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3
                }}
              >
                NOMBRE
              </TableCell>

              {months.map(month => {
                const cols = columnsByMonth[month] || [];
                const isExpanded = expandedCells.has(`_${month}`);
                const colSpan = getMonthColumnCount(cols, isExpanded);
                const hiddenCount = Math.max(cols.length - 2, 0);
                const hasHidden = hiddenCount > 0;
                return (
                  <TableCell
                    key={month}
                    colSpan={colSpan}
                    align="center"
                    sx={{
                      fontWeight: 700,
                      bgcolor: '#e3f2fd',
                      borderLeft: '2px solid #90caf9',
                      borderRight: '2px solid #90caf9',
                      py: 0.75,
                      position: 'relative',
                      overflow: 'visible'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <span>{MONTH_NAMES[month]}</span>
                      <Tooltip title="Agregar capacitación a este mes">
                        <IconButton
                          size="small"
                          onClick={() => onAddToMonth(month)}
                          sx={{ color: '#42a5f5', p: 0.25 }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {hasHidden && (
                      <Button
                        size="small"
                        onClick={() => onToggleExpand('_', month)}
                        sx={{
                          position: 'absolute',
                          right: -16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          minWidth: 28,
                          height: 24,
                          px: 0.75,
                          fontSize: '0.78rem',
                          lineHeight: 1,
                          fontWeight: 700,
                          borderRadius: '12px',
                          zIndex: 20,
                          color: '#1565c0',
                          bgcolor: '#fff',
                          border: '1px solid #64b5f6',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                          '&:hover': { bgcolor: '#e3f2fd', borderColor: '#42a5f5' }
                        }}
                      >
                        {isExpanded ? '−' : `+${hiddenCount}`}
                      </Button>
                    )}
                  </TableCell>
                );
              })}

              {/* % Completo header */}
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  bgcolor: '#f5f5f5',
                  borderLeft: '2px solid #e0e0e0',
                  minWidth: 100,
                  position: 'sticky',
                  right: 0,
                  zIndex: 2
                }}
              >
                % COMPLETO
              </TableCell>
            </TableRow>

            {/* Row 2: training name sub-headers */}
            <TableRow>
              <TableCell
                sx={{
                  bgcolor: '#fafafa',
                  borderRight: '1px solid #e0e0e0',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3
                }}
              />

              {months.map(month => {
                const cols = columnsByMonth[month] || [];
                const isExpanded = expandedCells.has(`_${month}`);
                const { visible, hidden } = getVisibleItems(cols, isExpanded);

                return [
                  // Visible training items
                  ...visible.map((col, idx) => (
                    <TableCell
                      key={col.planItemId}
                      align="center"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#555',
                        bgcolor: '#fafafa',
                        borderLeft: '1px solid #e8e8e8',
                        borderRight: idx === visible.length - 1 ? '2px solid #90caf9' : undefined,
                        minWidth: 90,
                        maxWidth: 90,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        py: 0.5,
                        position: 'relative'
                      }}
                    >
                      <Tooltip title={col.name} placement="top">
                        <span>{col.name.length > 12 ? col.name.slice(0, 10) + '…' : col.name}</span>
                      </Tooltip>
                    </TableCell>
                  )),
                  
                ].filter(Boolean);
              })}

              <TableCell sx={{ bgcolor: '#fafafa', borderLeft: '2px solid #e0e0e0' }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    months.reduce((acc, m) => {
                      const cols = columnsByMonth[m] || [];
                      const isExpanded = expandedCells.has(`_${m}`);
                      return acc + getMonthColumnCount(cols, isExpanded);
                    }, 0) + 2
                  }
                  align="center"
                  sx={{ py: 4, color: 'text.secondary' }}
                >
                  No hay empleados en esta sucursal.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow
                  key={row.empleadoId}
                  sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}
                >
                  {/* Employee name */}
                  <TableCell
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.82rem',
                      borderRight: '1px solid #e0e0e0',
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'white',
                      zIndex: 1,
                      whiteSpace: 'nowrap',
                      maxWidth: 180,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      py: 0
                    }}
                  >
                    {row.nombre}
                  </TableCell>

                  {/* Cells per month */}
                  {months.map(month => {
                    const cols = columnsByMonth[month] || [];
                    const isExpanded = expandedCells.has(`_${month}`);
                    const { visible, hidden } = getVisibleItems(cols, isExpanded);

                    return [
                      // Visible training cells
                      ...visible.map((col, idx) => (
                        <TableCell
                          key={col.planItemId}
                          align="center"
                          sx={{
                            p: 0,
                            borderLeft: '1px solid #e8e8e8',
                            borderRight: idx === visible.length - 1 ? '2px solid #90caf9' : undefined,
                            minWidth: 60
                          }}
                        >
                          <MatrixCell
                            state={row.cellMap[col.planItemId].estado}
                            sessionId={row.cellMap[col.planItemId].sessionId}
                            pendingState={pendingChanges[`${row.empleadoId}_${col.planItemId}`]?.newState}
                            onPendingChange={newState => onPendingChange(col.planItemId, row.empleadoId, newState)}
                            onSessionClick={() => onCellClick(col.planItemId, row.empleadoId, row.cellMap[col.planItemId].sessionId, col.name)}
                          />
                        </TableCell>
                      )),
                    ];
                  })}

                  {/* % Completo */}
                  <TableCell
                    align="center"
                    sx={{
                      borderLeft: '2px solid #e0e0e0',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      color: pctColor(row.pct),
                      bgcolor: `${pctColor(row.pct)}22`,
                      py: 0,
                      position: 'sticky',
                      right: 0,
                      zIndex: 2
                    }}
                  >
                    {row.pct}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
