import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import { useAuth } from '@/components/context/AuthContext';
import CreateTrainingSession from '../sessions/CreateTrainingSession';
import { trainingPlanService } from '../../../../../services/training/trainingPlanService';
import {
  TRAINING_SESSION_STATUSES,
  TRAINING_ATTENDANCE_STATUSES
} from '../../../../../types/trainingDomain';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const STATUS_LABELS = {
  [TRAINING_SESSION_STATUSES.DRAFT]: 'Borrador',
  [TRAINING_SESSION_STATUSES.SCHEDULED]: 'Programada',
  [TRAINING_SESSION_STATUSES.IN_PROGRESS]: 'En curso',
  [TRAINING_SESSION_STATUSES.PENDING_CLOSURE]: 'Pendiente de cierre',
  [TRAINING_SESSION_STATUSES.CLOSED]: 'Cerrada',
  [TRAINING_SESSION_STATUSES.CANCELLED]: 'Cancelada'
};

const ATTENDANCE_LABELS = {
  [TRAINING_ATTENDANCE_STATUSES.INVITED]: 'Invitado',
  [TRAINING_ATTENDANCE_STATUSES.PRESENT]: 'Presente',
  [TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE]: 'Ausencia justificada',
  [TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE]: 'Ausencia injustificada',
  [TRAINING_ATTENDANCE_STATUSES.RESCHEDULED]: 'Reprogramado'
};

function formatDate(value) {
  if (!value) return '—';
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Drawer lateral que aparece al hacer click en una celda de la matriz.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   planItemId: string,
 *   planId: string,
 *   empleadoId: string,
 *   empleadoNombre: string,
 *   trainingTypeId: string,
 *   trainingTypeName: string,
 *   month: number,
 *   year: number,
 *   sucursalId: string,
 *   session: Object|null,           // existing session for this planItem (if any)
 *   attendanceRecord: Object|null,  // attendance for this employee in the session
 *   onSaved: () => void
 * }} props
 */
export default function SessionCellDrawer({
  open,
  onClose,
  planItemId,
  planId,
  empleadoId,
  empleadoNombre,
  trainingTypeId,
  trainingTypeName,
  month,
  year,
  sucursalId,
  session,
  attendanceRecord,
  onSaved
}) {
  const { userProfile, userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;
  const [savingNoAplica, setSavingNoAplica] = useState(false);
  const [noAplicaError, setNoAplicaError] = useState('');

  const companyId = userSucursales.find(s => s.id === sucursalId)?.empresaId || '';

  // First day of the planned month
  const scheduledDateIso = (() => {
    const d = new Date(year, (month || 1) - 1, 1);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d - offset).toISOString().slice(0, 16);
  })();

  const initialData = {
    trainingTypeId,
    companyId,
    branchId: sucursalId,
    scheduledDate: scheduledDateIso,
    planMode: planItemId ? 'plan' : 'ad_hoc',
    planItemId: planItemId || null
  };

  async function handleMarkNoAplica() {
    if (!ownerId || !planItemId) return;
    setSavingNoAplica(true);
    setNoAplicaError('');
    try {
      // Store noAplicaEmployeeIds on the plan item
      const { getDocument, updateDocument } = await import('../../../../../services/training/trainingBaseService');
      const item = await getDocument(ownerId, 'trainingPlanItem', planItemId);
      const current = item?.noAplicaEmployeeIds || [];
      if (!current.includes(empleadoId)) {
        await updateDocument(ownerId, 'trainingPlanItem', planItemId, {
          noAplicaEmployeeIds: [...current, empleadoId]
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setNoAplicaError(err?.message || 'Error al guardar');
    } finally {
      setSavingNoAplica(false);
    }
  }

  async function handleRemoveNoAplica() {
    if (!ownerId || !planItemId) return;
    setSavingNoAplica(true);
    setNoAplicaError('');
    try {
      const { getDocument, updateDocument } = await import('../../../../../services/training/trainingBaseService');
      const item = await getDocument(ownerId, 'trainingPlanItem', planItemId);
      const current = item?.noAplicaEmployeeIds || [];
      await updateDocument(ownerId, 'trainingPlanItem', planItemId, {
        noAplicaEmployeeIds: current.filter(id => id !== empleadoId)
      });
      onSaved();
      onClose();
    } catch (err) {
      setNoAplicaError(err?.message || 'Error al guardar');
    } finally {
      setSavingNoAplica(false);
    }
  }

  const isNoAplica = attendanceRecord === 'N/A'; // sentinel passed from MatrixScreen
  const isClosed = session?.status === TRAINING_SESSION_STATUSES.CLOSED;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440 },
          mt: '64px',
          height: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {trainingTypeName || 'Capacitación'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {MONTH_NAMES[month] || month} {year} · {empleadoNombre}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>

        {/* Existing session summary */}
        {session && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Sesión existente
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Estado: <strong>{STATUS_LABELS[session.status] || session.status}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fecha: <strong>{formatDate(session.executedDate || session.scheduledDate)}</strong>
              </Typography>
              {attendanceRecord && typeof attendanceRecord === 'object' && (
                <Typography variant="caption" color="text.secondary">
                  Asistencia de este empleado:{' '}
                  <strong>{ATTENDANCE_LABELS[attendanceRecord.attendanceStatus] || attendanceRecord.attendanceStatus}</strong>
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* No aplica section */}
        {isNoAplica ? (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button size="small" onClick={handleRemoveNoAplica} disabled={savingNoAplica}>
                Quitar
              </Button>
            }
          >
            Esta capacitación está marcada como "No aplica" para este empleado.
          </Alert>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<BlockIcon />}
              onClick={handleMarkNoAplica}
              disabled={savingNoAplica || isClosed}
              sx={{ color: '#757575', borderColor: '#bdbdbd' }}
            >
              Marcar como no aplica
            </Button>
          </Box>
        )}

        {noAplicaError && (
          <Alert severity="error" sx={{ mb: 2 }}>{noAplicaError}</Alert>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* CreateTrainingSession form (if session is not closed) */}
        {!isClosed && !isNoAplica && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              {session ? 'Actualizar sesión' : 'Registrar nueva sesión'}
            </Typography>
            <CreateTrainingSession
              ownerId={ownerId}
              mode="planned"
              compact
              initialData={initialData}
              onSaved={() => { onSaved(); onClose(); }}
              onCancel={onClose}
            />
          </>
        )}

        {isClosed && !isNoAplica && (
          <Alert severity="success">
            Esta sesión ya fue cerrada. Para modificarla, hacelo desde la pantalla de Historial.
          </Alert>
        )}
      </Box>
    </Drawer>
  );
}
