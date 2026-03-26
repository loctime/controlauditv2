import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  Drawer,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '@/components/context/AuthContext';
import { trainingAttendanceService } from '../../../../../services/training/trainingAttendanceService';
import { convertirShareTokenAUrl } from '../../../../../utils/imageUtils';
import { TRAINING_ATTENDANCE_STATUSES, TRAINING_EVALUATION_STATUSES } from '../../../../../types/trainingDomain';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && value?.seconds != null) return new Date(value.seconds * 1000);
  return new Date(value);
}

function resolveEmployeeStatus(attendance) {
  if (!attendance) return { label: 'Sin registro', color: '#616161', bg: '#eeeeee' };

  const isNoAplica =
    attendance.status === 'NOT_APPLICABLE' ||
    (attendance.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.INVITED &&
      attendance.evaluationStatus === TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE);

  if (isNoAplica) {
    return { label: 'N/A', color: '#616161', bg: '#eeeeee' };
  }

  const isPresente =
    attendance.attended === true ||
    attendance.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT;

  if (isPresente) {
    return { label: 'PRESENTE', color: '#2e7d32', bg: '#e8f5e9' };
  }

  return { label: 'AUSENTE', color: '#c62828', bg: '#ffebee' };
}

function formatSessionDate(record) {
  const dateValue = record?.sourceExecutedDate || record?.sourceSessionCreatedAt || record?.updatedAt;
  const date = toDate(dateValue);
  if (!date || Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return `${date.toLocaleDateString('es-AR')} \u2014 ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderEvidenceList(evidenceIds = [], sessionKey) {
  if (!evidenceIds.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        Sin evidencia
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {evidenceIds.map((shareToken, idx) => {
        const url = convertirShareTokenAUrl(shareToken);
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        return isImage ? (
          <Box
            key={`${sessionKey}-img-${idx}`}
            component="img"
            src={url}
            alt={`Evidencia ${idx + 1}`}
            sx={{ width: '100%', borderRadius: 1, maxHeight: 180, objectFit: 'cover' }}
          />
        ) : (
          <Typography
            key={`${sessionKey}-file-${idx}`}
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
  );
}

/**
 * Drawer lateral para ver el historial anual de capacitaciones por empleado.
 *
 * @param {{
 *  open: boolean,
 *  onClose: () => void,
 *  empleadoId: string,
 *  empleadoNombre: string,
 *  year: number,
 *  catalogMap?: Object
 * }} props
 */
export default function EmployeeTrainingDrawer({
  open,
  onClose,
  empleadoId,
  empleadoNombre,
  year,
  catalogMap = {}
}) {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  useEffect(() => {
    if (!open || !ownerId || !empleadoId) return;

    setLoading(true);
    setError('');

    (async () => {
      try {
        const list = await trainingAttendanceService.listAttendanceByEmployee(ownerId, empleadoId);
        setRecords(Array.isArray(list) ? list : []);
      } catch (err) {
        setError(err?.message || 'Error al cargar capacitaciones del empleado.');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, ownerId, empleadoId]);

  const groupedItems = useMemo(() => {
    const filtered = (records || []).filter((r) => Number(r?.periodYear) === Number(year));
    const byKey = {};
    filtered.forEach((record) => {
      const key = `${record.trainingTypeId || 'unknown'}_${record.periodMonth || 0}`;
      if (!byKey[key]) {
        byKey[key] = {
          key,
          trainingTypeId: record.trainingTypeId,
          periodMonth: record.periodMonth,
          records: []
        };
      }
      byKey[key].records.push(record);
    });

    return Object.values(byKey)
      .map((item) => {
        const sortedRecords = [...item.records].sort((a, b) => {
          const aDate = toDate(a?.updatedAt || a?.sourceExecutedDate || a?.sourceSessionCreatedAt);
          const bDate = toDate(b?.updatedAt || b?.sourceExecutedDate || b?.sourceSessionCreatedAt);
          return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
        });
        const latest = sortedRecords[0];
        return {
          ...item,
          records: sortedRecords,
          trainingTypeName: catalogMap[item.trainingTypeId]?.name || catalogMap[item.trainingTypeId] || item.trainingTypeId || 'N/A',
          status: resolveEmployeeStatus(latest)
        };
      })
      .sort((a, b) => {
        const monthDiff = Number(a.periodMonth || 0) - Number(b.periodMonth || 0);
        if (monthDiff !== 0) return monthDiff;
        return (a.trainingTypeName || '').localeCompare(b.trainingTypeName || '');
      });
  }, [records, year, catalogMap]);

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          mt: '64px',
          height: 'calc(100vh - 64px)',
          overflow: 'auto'
        }
      }}
    >
      <Stack spacing={2} sx={{ p: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Empleado
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {empleadoNombre || 'Empleado'}
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && groupedItems.length === 0 && (
          <Typography color="text.secondary">
            No hay capacitaciones registradas para {year}.
          </Typography>
        )}

        {!loading && groupedItems.map((item) => {
          const isExpanded = expandedKeys.has(item.key);
          const monthLabel = MONTH_NAMES[item.periodMonth] || `Mes ${item.periodMonth || ''}`;

          return (
            <Box key={item.key} sx={{ border: '1px solid #eeeeee', borderRadius: 1.5, p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                    {item.trainingTypeName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {monthLabel}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'inline-flex',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: item.status.bg,
                    color: item.status.color,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.status.label}
                </Box>

                <IconButton size="small" onClick={() => toggleExpand(item.key)}>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
                  />
                </IconButton>
              </Box>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {item.records.map((record) => (
                    <Box key={record.id} sx={{ border: '1px solid #f0f0f0', borderRadius: 1, p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatSessionDate(record)}
                      </Typography>
                      {renderEvidenceList(record.evidenceIds || [], record.id)}
                    </Box>
                  ))}
                </Stack>
              </Collapse>
            </Box>
          );
        })}

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </Drawer>
  );
}
