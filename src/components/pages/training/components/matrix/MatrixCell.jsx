import { Box, Tooltip } from '@mui/material';
import { CELL_STATE } from '../../../../../hooks/training/useTrainingMatrix';

const CELL_CONFIG = {
  [CELL_STATE.NOT_TRAINED]: {
    bg: '#ef5350',
    hoverBg: '#c62828',
    label: '0',
    tooltip: 'No capacitado'
  },
  [CELL_STATE.IN_PROGRESS]: {
    bg: '#ffa726',
    hoverBg: '#e65100',
    label: '1',
    tooltip: 'En curso'
  },
  [CELL_STATE.COMPLETE]: {
    bg: '#66bb6a',
    hoverBg: '#2e7d32',
    label: '2',
    tooltip: 'Capacitación completa'
  },
  [CELL_STATE.NOT_APPLICABLE]: {
    bg: '#bdbdbd',
    hoverBg: '#9e9e9e',
    label: 'N/A',
    tooltip: 'No aplica'
  }
};

/**
 * Celda de la matriz. Muestra el estado con color + número.
 * Al hacer click llama a onClick si el estado no es NOT_APPLICABLE.
 */
export default function MatrixCell({ state, onClick }) {
  const config = CELL_CONFIG[state] ?? CELL_CONFIG[CELL_STATE.NOT_TRAINED];
  const clickable = state !== CELL_STATE.NOT_APPLICABLE;

  return (
    <Tooltip title={config.tooltip} placement="top">
      <Box
        onClick={clickable ? onClick : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: 36,
          bgcolor: config.bg,
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.85rem',
          borderRadius: 0,
          cursor: clickable ? 'pointer' : 'default',
          transition: 'background-color 0.15s',
          '&:hover': clickable ? { bgcolor: config.hoverBg } : {}
        }}
      >
        {config.label}
      </Box>
    </Tooltip>
  );
}
