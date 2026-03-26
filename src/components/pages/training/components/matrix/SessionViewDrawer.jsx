import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Drawer,
  Stack,
  Typography,
  Alert,
  Divider
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingSessionService } from '../../../../../services/training/trainingSessionService';
import { trainingAttendanceService } from '../../../../../services/training/trainingAttendanceService';
import { convertirShareTokenAUrl } from '../../../../../utils/imageUtils';
import { TRAINING_ATTENDANCE_STATUSES, TRAINING_EVALUATION_STATUSES } from '../../../../../types/trainingDomain';

/**
 * Drawer lateral para ver historial de sesiones de una celda.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   sessionIds: string[],
 *   empleadoId: string,
 *   trainingTypeName: string,
 *   isTerminal?: boolean
 * }} props
 */
export default function SessionViewDrawer({
  open,
  onClose,
  sessionIds = [],
  empleadoId,
  trainingTypeName,
  isTerminal = false
}) {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !ownerId || !empleadoId || !sessionIds.length) return;

    setLoading(true);
    setError('');

    (async () => {
      try {
        const uniqueSessionIds = [...new Set(sessionIds)];
        const loaded = await Promise.all(uniqueSessionIds.map(async (id) => {
          const [session, attendance] = await Promise.all([
            trainingSessionService.getSessionById(ownerId, id),
            trainingAttendanceService.getAttendance(ownerId, id, empleadoId)
          ]);
          return { sessionId: id, session, attendance };
        }));

        const toDateValue = (session) => {
          const raw = session?.executedDate || session?.scheduledDate || session?.createdAt;
          if (!raw) return new Date(0);
          if (typeof raw?.toDate === 'function') return raw.toDate();
          return new Date(raw);
        };

        loaded.sort((a, b) => toDateValue(b.session) - toDateValue(a.session));
        setItems(loaded.filter((x) => x.session));
      } catch (err) {
        setError(err?.message || 'Error al cargar la sesión.');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, ownerId, sessionIds, empleadoId]);

  function resolveEmployeeStatus(attendance) {
    if (!attendance) return { label: 'Sin registro', color: '#9e9e9e', bg: '#f5f5f5' };

    // No aplica SOLO cuando corresponde al caso "No aplica".
    // Importante: los ausentes pueden guardar evaluationStatus=NOT_APPLICABLE; eso NO debe transformarlos en GRAY/N/A.
    const isNoAplica =
      attendance.status === 'NOT_APPLICABLE' ||
      (attendance.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.INVITED &&
        attendance.evaluationStatus === TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE);

    if (isNoAplica) {
      return { label: 'No aplica', color: '#616161', bg: '#eeeeee' };
    }

    const isPresente =
      attendance.attended === true ||
      attendance.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT;

    if (isPresente) {
      return { label: 'Presente', color: '#2e7d32', bg: '#e8f5e9' };
    }

    // Si no es presente ni no-aplica, tratamos como Ausente.
    return { label: 'Ausente', color: '#c62828', bg: '#ffebee' };
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          mt: '64px',
          height: 'calc(100vh - 64px)',
          overflow: 'auto'
        }
      }}
    >
      <Stack spacing={2} sx={{ p: 2 }}>
        {/* Tipo capacitación */}
        <Box>
          <Typography variant="body2" color="text.secondary">
            Tipo de capacitación
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {trainingTypeName}
          </Typography>
        </Box>

        {isTerminal && (
          <Alert severity="info">
            Estado final — no se pueden registrar más cambios
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && items.map(({ sessionId, session, attendance }) => {
          const dateValue = session?.executedDate || session?.scheduledDate || session?.createdAt;
          const date = typeof dateValue?.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
          const status = resolveEmployeeStatus(attendance);
          const evidenceIds = attendance?.evidenceIds || [];

          return (
            <Box key={sessionId} sx={{ border: '1px solid #eeeeee', borderRadius: 1.5, p: 1.5 }}>
              <Stack spacing={1.25}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {date.toLocaleDateString('es-AR')} — {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </Typography>

                <Box sx={{ display: 'inline-flex', px: 1, py: 0.25, borderRadius: 1, bgcolor: status.bg, color: status.color, width: 'fit-content', fontSize: '0.78rem', fontWeight: 700 }}>
                  {status.label}
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Instructor: {session?.instructor || session?.instructorName || session?.instructorId || 'N/A'}
                </Typography>

                {evidenceIds.length > 0 && (
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary">
                      Evidencias ({evidenceIds.length})
                    </Typography>
                    {evidenceIds.map((shareToken, idx) => {
                      const url = convertirShareTokenAUrl(shareToken);
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      return isImage ? (
                        <Box
                          key={`${sessionId}-${idx}`}
                          component="img"
                          src={url}
                          alt={`Evidencia ${idx + 1}`}
                          sx={{ width: '100%', borderRadius: 1, maxHeight: 180, objectFit: 'cover' }}
                        />
                      ) : (
                        <Typography
                          key={`${sessionId}-${idx}`}
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          sx={{ color: 'primary.main', wordBreak: 'break-all' }}
                        >
                          Archivo {idx + 1}
                        </Typography>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            </Box>
          );
        })}

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </Drawer>
  );
}
