import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Drawer,
  Stack,
  Typography,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingSessionService } from '../../../../../services/training/trainingSessionService';
import { trainingAttendanceService } from '../../../../../services/training/trainingAttendanceService';
import { convertirShareTokenAUrl } from '../../../../../utils/imageUtils';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Drawer lateral para ver detalles de una sesión guardada.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   sessionId: string,
 *   empleadoId: string,
 *   trainingTypeName: string
 * }} props
 */
export default function SessionViewDrawer({
  open,
  onClose,
  sessionId,
  empleadoId,
  trainingTypeName
}) {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !ownerId || !sessionId || !empleadoId) return;

    setLoading(true);
    setError('');

    (async () => {
      try {
        const [sess, att] = await Promise.all([
          trainingSessionService.getSessionById(ownerId, sessionId),
          trainingAttendanceService.getAttendance(ownerId, sessionId, empleadoId)
        ]);

        setSession(sess);
        setAttendance(att);
      } catch (err) {
        setError(err?.message || 'Error al cargar la sesión.');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, ownerId, sessionId, empleadoId]);

  if (!session) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            mt: '64px',
            height: 'calc(100vh - 64px)'
          }
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      </Drawer>
    );
  }

  const scheduledDate = session.scheduledDate?.toDate?.() || new Date(session.scheduledDate);
  const dateStr = scheduledDate.toLocaleDateString('es-AR');
  const timeStr = scheduledDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const attendanceStatus = attendance?.attendanceStatus || 'N/A';
  const isPresent = attendanceStatus === 'present';
  const isNotApplicable = attendanceStatus === 'not_applicable';

  const evidenceIds = attendance?.evidenceIds || [];

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

        <Divider />

        {/* Fecha y hora */}
        <Box>
          <Typography variant="body2" color="text.secondary">
            Fecha y hora
          </Typography>
          <Typography variant="body1">
            {dateStr} a las {timeStr}
          </Typography>
        </Box>

        {/* Ubicación */}
        {session.location && (
          <>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Ubicación
              </Typography>
              <Typography variant="body1">{session.location}</Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Instructor */}
        <Box>
          <Typography variant="body2" color="text.secondary">
            Instructor
          </Typography>
          <Typography variant="body1">{session.instructorName || session.instructorId || 'N/A'}</Typography>
        </Box>

        <Divider />

        {/* Estado del empleado */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Estado del empleado
          </Typography>
          <Chip
            label={isPresent ? 'Realizado ✓' : isNotApplicable ? 'No aplica' : 'No realizado'}
            color={isPresent ? 'success' : isNotApplicable ? 'default' : 'error'}
            variant="outlined"
            size="small"
          />
        </Box>

        <Divider />

        {/* Evidencias */}
        {evidenceIds.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Evidencias ({evidenceIds.length})
            </Typography>
            <Stack spacing={1}>
              {evidenceIds.map((shareToken, idx) => {
                const url = convertirShareTokenAUrl(shareToken);
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

                return isImage ? (
                  <Box
                    key={idx}
                    component="img"
                    src={url}
                    alt={`Evidencia ${idx + 1}`}
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      maxHeight: 200,
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Typography
                    key={idx}
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ color: 'primary.main', cursor: 'pointer', wordBreak: 'break-all' }}
                  >
                    Archivo {idx + 1}
                  </Typography>
                );
              })}
            </Stack>
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </Drawer>
  );
}
