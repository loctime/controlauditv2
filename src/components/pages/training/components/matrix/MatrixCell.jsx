import { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import HistoryIcon from '@mui/icons-material/History';
import ClearIcon from '@mui/icons-material/Clear';
import { CELL_STATE } from '../../../../../hooks/training/useTrainingMatrix';

const STATE_CONFIG = {
  [CELL_STATE.BLANK]: { bg: '#ffffff', label: '', tooltip: 'Sin registro' },
  [CELL_STATE.RED]: { bg: '#ef5350', label: 'Ausente', tooltip: 'Ausente' },
  [CELL_STATE.GREEN]: { bg: '#66bb6a', label: 'Presente', tooltip: 'Presente' },
  [CELL_STATE.GRAY]: { bg: '#bdbdbd', label: 'N/A', tooltip: 'No aplica' }
};

const SELECTOR_OPTIONS = [
  { state: CELL_STATE.RED, icon: <CloseIcon sx={{ fontSize: 14 }} />, label: 'Ausente', color: '#ef5350' },
  { state: CELL_STATE.GREEN, icon: <CheckIcon sx={{ fontSize: 14 }} />, label: 'Presente', color: '#66bb6a' },
  { state: CELL_STATE.GRAY, icon: <RemoveIcon sx={{ fontSize: 14 }} />, label: 'No aplica', color: '#9e9e9e' }
];

/**
 * Celda de la matriz.
 *
 * Props:
 *   cellData      — { estado, sessionIds, isTerminal }
 *   pendingState  — cambio pendiente local (undefined si no hay)
 *   onPendingChange(newState) — callback al seleccionar opción en selector
 *   onSessionClick() — callback al click en celda guardada
 */
export default function MatrixCell({ cellData, pendingState, onPendingChange, onSessionClick }) {
  const [hovered, setHovered] = useState(false);

  const baseState = cellData?.estado ?? CELL_STATE.BLANK;
  const displayState = pendingState !== undefined ? pendingState : baseState;
  const isPending = pendingState !== undefined && pendingState !== baseState;
  const hasSessions = (cellData?.sessionIds?.length || 0) > 0;

  const config = STATE_CONFIG[displayState] ?? STATE_CONFIG[CELL_STATE.BLANK];

  // Regla nueva de editabilidad:
  // Solo PRESENTE (GREEN) bloquea edición. AUSENTE/GRAY/BLANK siempre editables.
  const canEdit = baseState !== CELL_STATE.GREEN;
  const canOpenDrawer = (displayState === CELL_STATE.GREEN || displayState === CELL_STATE.GRAY) && hasSessions;

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={canOpenDrawer ? onSessionClick : undefined}
      sx={{
        position: 'relative',
        width: '100%',
        height: 36,
        bgcolor: config.bg,
        border: displayState === CELL_STATE.BLANK ? '1px solid #eeeeee' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: isPending ? '2px dashed #f59e0b' : 'none',
        outlineOffset: '-2px',
        transition: 'background-color 0.15s',
        cursor: canOpenDrawer ? 'pointer' : (canEdit ? 'default' : 'not-allowed')
      }}
    >
      {/* Selector inline — solo si es pendiente o sin guardar */}
      {hovered && canEdit && (
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
          {/* Desmarcar button — mostrar si hay algo pendiente que no sea BLANK */}
          {isPending && (
            <Tooltip title="Desmarcar" placement="top">
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  // Volver al estado original guardado para eliminar el pendiente.
                  onPendingChange(baseState);
                }}
                sx={{
                  width: 22,
                  height: 22,
                  p: 0,
                  color: '#999',
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: '#99999933' }
                }}
              >
                <ClearIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Label */}
      {!hovered && config.label && (
        <Box
          component="span"
          sx={{
            color: displayState === CELL_STATE.BLANK ? '#666' : '#fff',
            fontWeight: 700,
            fontSize: '0.72rem',
            pointerEvents: 'none'
          }}
        >
          {config.label}
        </Box>
      )}

      {/* Tooltip para celdas guardadas */}
      {canOpenDrawer && !hovered && (
        <Tooltip title="Ver sesiones">
          <Box sx={{ position: 'absolute', inset: 0 }} />
        </Tooltip>
      )}

      {/* Marca visual para "Presente" ya guardado en sesión anterior */}
      {baseState === CELL_STATE.GREEN && hasSessions && pendingState === undefined && (
        <Tooltip title="Presente registrado en sesión anterior">
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.6)'
            }}
          >
            <HistoryIcon sx={{ fontSize: 10, color: '#2e7d32' }} />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}
