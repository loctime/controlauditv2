import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  Drawer,
  IconButton,
  Stack,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '@/components/context/AuthContext';
import { trainingAttendanceService } from '../../../../../services/training/trainingAttendanceService';
import { TRAINING_ATTENDANCE_STATUSES, TRAINING_EVALUATION_STATUSES } from '../../../../../types/trainingDomain';
import EvidencePreviewList from './EvidencePreviewList';

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

/**
 * Drawer lateral para ver el historial anual de capacitaciones por empleado.
 * Incluye dos vistas:
 * - Tab 0 "Por capacitación": Agrupa por tipo de capacitación (actual)
 * - Tab 1 "Por mes": Agrupa por mes, dentro de cada mes las capacitaciones (nuevo)
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
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!open || !ownerId || !empleadoId) return;

    setLoading(true);
    setError('');

    (async () => {
      try {
        console.log('?? Llamando con ownerId:', ownerId, 'empleadoId:', empleadoId);
        const list = await trainingAttendanceService.listAttendanceByEmployee(ownerId, empleadoId);
        console.log('?? Total sin filtro:', list?.length);
        setRecords(Array.isArray(list) ? list : []);
        
        // Logs de diagnóstico para identificar problema con filtro de año
        console.log('?? Records cargados:', list?.length, 'año buscado:', year);
        console.log('?? Muestra de campos:', list?.slice(0, 3).map(r => ({
          id: r.id,
          periodYear: r.periodYear,
          periodMonth: r.periodMonth,
          periodKey: r.periodKey,
          employeeId: r.employeeId
        })));
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

  const groupedByMonth = useMemo(() => {
    const filtered = (records || []).filter((r) => Number(r?.periodYear) === Number(year));
    const byMonth = {};

    filtered.forEach((record) => {
      const month = record.periodMonth || 0;
      if (!byMonth[month]) {
        byMonth[month] = {};
      }

      const trainingTypeId = record.trainingTypeId || 'unknown';
      if (!byMonth[month][trainingTypeId]) {
        byMonth[month][trainingTypeId] = {
          trainingTypeId,
          trainingTypeName: catalogMap[trainingTypeId]?.name || catalogMap[trainingTypeId] || trainingTypeId || 'N/A',
          records: []
        };
      }
      byMonth[month][trainingTypeId].records.push(record);
    });

    return Object.entries(byMonth)
      .map(([monthNum, typesMap]) => ({
        month: Number(monthNum),
        monthLabel: MONTH_NAMES[monthNum] || `Mes ${monthNum}`,
        trainingTypes: Object.values(typesMap)
          .map((tt) => ({
            ...tt,
            status: resolveEmployeeStatus(tt.records[0]),
            records: tt.records.sort((a, b) => {
              const aDate = toDate(a?.updatedAt || a?.sourceExecutedDate || a?.sourceSessionCreatedAt);
              const bDate = toDate(b?.updatedAt || b?.sourceExecutedDate || b?.sourceSessionCreatedAt);
              return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
            })
          }))
          .sort((a, b) => (a.trainingTypeName || '').localeCompare(b.trainingTypeName || ''))
      }))
      .sort((a, b) => a.month - b.month);
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
      <Stack spacing={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #eeeeee' }}>
          <Typography variant="body2" color="text.secondary">
            Empleado
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {empleadoNombre || 'Empleado'}
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            px: 2,
            borderBottom: '1px solid #eeeeee'
          }}
        >
          <Tab label="Por capacitación" index={0} />
          <Tab label="Por mes" index={1} />
        </Tabs>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Loading state */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {/* TAB 0: Por capacitación */}
          {activeTab === 0 && !loading && (
            <Stack spacing={2}>
              {groupedItems.length === 0 && (
                <Typography color="text.secondary">
                  No hay capacitaciones registradas para {year}.
                </Typography>
              )}

              {groupedItems.map((item) => {
                const isExpanded = expandedKeys.has(item.key);
                const monthLabel = MONTH_NAMES[item.periodMonth] || `Mes ${item.periodMonth || ''}`;

                return (
                  <Box key={item.key} sx={{ border: '1px solid #eeeeee', borderRadius: 1.5, overflow: 'hidden' }}>
                    {/* Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        bgcolor: '#f5f5f5',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f0f0f0' }
                      }}
                      onClick={() => toggleExpand(item.key)}
                    >
                      <ExpandMoreIcon
                        fontSize="small"
                        sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
                      />
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
                    </Box>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Stack spacing={1} sx={{ p: 1.5 }}>
                        {item.records.map((record) => (
                          <Box key={record.id} sx={{ border: '1px solid #f0f0f0', borderRadius: 1, p: 1, bgcolor: '#ffffff' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatSessionDate(record)}
                            </Typography>
                            <EvidencePreviewList evidenceIds={record.evidenceIds || []} previewHeight={140} />
                          </Box>
                        ))}
                      </Stack>
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* TAB 1: Por mes */}
          {activeTab === 1 && !loading && (
            <Stack spacing={1.5}>
              {groupedByMonth.length === 0 && (
                <Typography color="text.secondary">
                  No hay capacitaciones registradas para {year}.
                </Typography>
              )}

              {groupedByMonth.map((monthGroup) => {
                const monthKey = `month-${monthGroup.month}`;
                const isMonthExpanded = expandedKeys.has(monthKey);

                return (
                  <Box key={monthKey} sx={{ border: '1px solid #eeeeee', borderRadius: 1.5, overflow: 'hidden' }}>
                    {/* Month Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        bgcolor: '#f5f5f5',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f0f0f0' }
                      }}
                      onClick={() => toggleExpand(monthKey)}
                    >
                      <ExpandMoreIcon
                        fontSize="small"
                        sx={{ transform: isMonthExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                          {monthGroup.monthLabel}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {monthGroup.trainingTypes.length} capacitación{monthGroup.trainingTypes.length !== 1 ? 'es' : ''}
                      </Typography>
                    </Box>

                    <Collapse in={isMonthExpanded} timeout="auto" unmountOnExit>
                      <Stack spacing={1} sx={{ p: 1.5 }}>
                        {monthGroup.trainingTypes.map((tt) => {
                          const ttKey = `tt-${monthGroup.month}-${tt.trainingTypeId}`;
                          const isTtExpanded = expandedKeys.has(ttKey);

                          return (
                            <Box key={ttKey} sx={{ border: '1px solid #f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
                              {/* Training Type Header */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  p: 1,
                                  bgcolor: '#fafafa',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                                onClick={() => toggleExpand(ttKey)}
                              >
                                <ExpandMoreIcon
                                  fontSize="small"
                                  sx={{ transform: isTtExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                    {tt.trainingTypeName}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    px: 0.75,
                                    py: 0.25,
                                    borderRadius: 0.75,
                                    bgcolor: tt.status.bg,
                                    color: tt.status.color,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {tt.status.label}
                                </Box>
                              </Box>

                              <Collapse in={isTtExpanded} timeout="auto" unmountOnExit>
                                <Stack spacing={0.75} sx={{ p: 1, bgcolor: '#fafafa' }}>
                                  {tt.records.map((record) => (
                                    <Box key={record.id} sx={{ border: '1px solid #eeeeee', borderRadius: 0.75, p: 0.75, bgcolor: '#ffffff' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {formatSessionDate(record)}
                                      </Typography>
                                      <EvidencePreviewList evidenceIds={record.evidenceIds || []} previewHeight={100} />
                                    </Box>
                                  ))}
                                </Stack>
                              </Collapse>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* Error state */}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </Stack>
    </Drawer>
  );
}
