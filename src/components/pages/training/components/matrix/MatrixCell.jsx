import { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import { CELL_STATE } from '../../../../../hooks/training/useTrainingMatrix';

const STATE_CONFIG = {
  [CELL_STATE.NOT_TRAINED]: { bg: '#ef5350', label: '0', tooltip: 'No capacitado' },
  [CELL_STATE.IN_PROGRESS]:  { bg: '#ffa726', label: '1', tooltip: 'En curso' },
  [CELL_STATE.COMPLETE]:     { bg: '#66bb6a', label: '2', tooltip: 'Capacitación completa' },
  [CELL_STATE.NOT_APPLICABLE]: { bg: '#bdbdbd', label: 'N/A', tooltip: 'No aplica' }
};

const SELECTOR_OPTIONS = [
  { state: CELL_STATE.NOT_TRAINED, icon: <CloseIcon sx={{ fontSize: 14 }} />, label: 'No realizado', color: '#ef5350' },
  { state: CELL_STATE.COMPLETE,    icon: <CheckIcon  sx={{ fontSize: 14 }} />, label: 'Realizado',    color: '#66bb6a' },
  { state: CELL_STATE.NOT_APPLICABLE, icon: <RemoveIcon sx={{ fontSize: 14 }} />, label: 'No aplica', color: '#9e9e9e' }
];

/**
 * Celda de la matriz.
 *
 * Props:
 *   state         — estado guardado (CELL_STATE)
 *   sessionId     — id de sesión si hay estado guardado en Firestore
 *   pendingState  — cambio pendiente local (undefined si no hay)
 *   onPendingChange(newState) — callback al seleccionar opción en selector
 *   onSessionClick() — callback al click en celda guardada
 */
export default function MatrixCell({ state, sessionId, pendingState, onPendingChange, onSessionClick }) {
  const [hovered, setHovered] = useState(false);

  const displayState = pendingState !== undefined ? pendingState : state;
  const isPending = pendingState !== undefined && pendingState !== state;
  const isGuardada = sessionId !== null && pendingState === undefined;

  const config = STATE_CONFIG[displayState] ?? STATE_CONFIG[CELL_STATE.NOT_TRAINED];

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isGuardada ? onSessionClick : undefined}
      sx={{
        position: 'relative',
        width: '100%',
        height: 36,
        bgcolor: config.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: isPending ? '2px dashed #f59e0b' : 'none',
        outlineOffset: '-2px',
        transition: 'background-color 0.15s',
        cursor: isGuardada ? 'pointer' : 'default'
      }}
    >
      {/* Selector inline — solo si es pendiente o sin guardar */}
      {hovered && !isGuardada && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0.25,
            bgcolor: 'rgba(255,255,255,0.95)',
            borderRadius: 1,
            boxShadow: 2,
            p: 0.25,
            zIndex: 10
          }}
        >
          {SELECTOR_OPTIONS.map(opt => (
            <Tooltip key={opt.state} title={opt.label} placement="top">
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onPendingChange(opt.state);
                }}
                sx={{
                  width: 22,
                  height: 22,
                  p: 0,
                  color: opt.color,
                  bgcolor: displayState === opt.state ? `${opt.color}22` : 'transparent',
                  '&:hover': { bgcolor: `${opt.color}33` }
                }}
              >
                {opt.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      )}

      {/* Label */}
      {!hovered && (
        <Box
          component="span"
          sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', pointerEvents: 'none' }}
        >
          {config.label}
        </Box>
      )}

      {/* Tooltip para celdas guardadas */}
      {isGuardada && !hovered && (
        <Tooltip title="Ver sesión">
          <Box sx={{ position: 'absolute', inset: 0 }} />
        </Tooltip>
      )}
    </Box>
  );
}
