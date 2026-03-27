import { useMemo, useState } from 'react';
import {
  Box,
  Collapse,
  Drawer,
  IconButton,
  Stack,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

function getSessionDate(session) {
  return toDate(session?.executedDate || session?.scheduledDate || session?.createdAt);
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

function resolveAggregateStatus(records = []) {
  if (!records.length) return { label: 'Sin registro', color: '#616161', bg: '#eeeeee' };
  const hasPresent = records.some((r) => resolveEmployeeStatus(r).label === 'PRESENTE');
  if (hasPresent) return { label: 'PRESENTE', color: '#2e7d32', bg: '#e8f5e9' };
  const hasNoAplica = records.some((r) => resolveEmployeeStatus(r).label === 'N/A');
  if (hasNoAplica) return { label: 'N/A', color: '#616161', bg: '#eeeeee' };
  return { label: 'AUSENTE', color: '#c62828', bg: '#ffebee' };
}

/**
 * Drawer lateral para ver el estado de empleados en un mes.
 * Incluye dos vistas:
 * - Tab 0 "Por empleado": Lista empleados con sus asistencias en el mes
 * - Tab 1 "Por capacitación": Agrupa sesiones por tipo de capacitación
 *
 * @param {{
 *  open: boolean,
 *  onClose: () => void,
 *  month: number,
 *  year: number,
 *  rows: Array,
 *  sessions: Array,
 *  attendanceMap: Object,
 *  catalogMap?: Object
 * }} props
 */
export default function MonthAttendanceDrawer({
  open,
  onClose,
  month,
  year,
  rows = [],
  sessions = [],
  attendanceMap = {},
  catalogMap = {}
}) {
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [activeTab, setActiveTab] = useState(0);

  const sessionsInMonth = useMemo(() => {
    return (sessions || []).filter((session) => {
      const matchesMonth = Number(session?.periodMonth) === Number(month);
      if (!matchesMonth) return false;
      if (!year) return true;
      const date = getSessionDate(session);
      return date ? date.getFullYear() === Number(year) : true;
    });
  }, [sessions, month, year]);

  const employeeRows = useMemo(() => {
    return (rows || [])
      .map((row) => {
        const sessionRecords = sessionsInMonth
          .map((session) => {
            const attendance = attendanceMap?.[session.id]?.[row.empleadoId];
            if (!attendance) return null;
            return { session, attendance };
          })
          .filter(Boolean);

        const aggregateStatus = resolveAggregateStatus(sessionRecords.map((r) => r.attendance));
        return {
          empleadoId: row.empleadoId,
          nombre: row.nombre,
          status: aggregateStatus,
          sessionRecords
        };
      })
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [rows, sessionsInMonth, attendanceMap]);

  const trainingTypeGrouped = useMemo(() => {
    const grouped = {};

    sessionsInMonth.forEach((session) => {
      const trainingTypeId = session.trainingTypeId || 'unknown';
      const trainingTypeName = catalogMap?.[trainingTypeId]?.name || session.trainingTypeName || 'Sin tipo';

      if (!grouped[trainingTypeId]) {
        grouped[trainingTypeId] = {
          trainingTypeId,
          trainingTypeName,
          sessions: []
        };
      }
      grouped[trainingTypeId].sessions.push(session);
    });

    return Object.values(grouped).sort((a, b) =>
      (a.trainingTypeName || '').localeCompare(b.trainingTypeName || '')
    );
  }, [sessionsInMonth, catalogMap]);

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

  const monthLabel = MONTH_NAMES[month] || `Mes ${month || ''}`;

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
            Mes
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {monthLabel}
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
          <Tab label="Por empleado" index={0} />
          <Tab label="Por capacitación" index={1} />
        </Tabs>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* TAB 0: Por empleado */}
          {activeTab === 0 && (
            <Stack spacing={2}>
              {employeeRows.length === 0 && (
                <Typography color="text.secondary">
                  No hay empleados para mostrar.
                </Typography>
              )}

              {employeeRows.map((row) => {
                const isExpanded = expandedKeys.has(row.empleadoId);
                const hasSessions = row.sessionRecords.length > 0;

                return (
                  <Box key={row.empleadoId} sx={{ border: '1px solid #eeeeee', borderRadius: 1.5, overflow: 'hidden' }}>
                    {/* Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        bgcolor: '#f5f5f5',
                        cursor: hasSessions ? 'pointer' : 'default',
                        '&:hover': hasSessions ? { bgcolor: '#f0f0f0' } : {}
                      }}
                      onClick={() => hasSessions && toggleExpand(row.empleadoId)}
                    >
                      {hasSessions && (
                        <ExpandMoreIcon
                          fontSize="small"
                          sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
                        />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                          {row.nombre}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: row.status.bg,
                          color: row.status.color,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {row.status.label}
                      </Box>
                    </Box>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Stack spacing={1} sx={{ p: 1.5 }}>
                        {row.sessionRecords.map(({ session, attendance }) => {
                          const date = getSessionDate(session);
                          const status = resolveEmployeeStatus(attendance);
                          const dateLabel = date && !Number.isNaN(date.getTime())
                            ? `${date.toLocaleDateString('es-AR')} \u2014 ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Fecha no disponible';

                          return (
                            <Box key={`${row.empleadoId}-${session.id}`} sx={{ border: '1px solid #f0f0f0', borderRadius: 1, p: 1, bgcolor: '#ffffff' }}>
                              <Stack spacing={0.75}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {dateLabel}
                                </Typography>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    bgcolor: status.bg,
                                    color: status.color,
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    width: 'fit-content'
                                  }}
                                >
                                  {status.label}
                                </Box>
                                <EvidencePreviewList evidenceIds={attendance?.evidenceIds || []} previewHeight={140} />
                              </Stack>
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

          {/* TAB 1: Por capacitación */}
          {activeTab === 1 && (
            <Stack spacing={1.5}>
              {trainingTypeGrouped.length === 0 && (
                <Typography color="text.secondary">
                  No hay capacitaciones para mostrar.
                </Typography>
              )}

              {trainingTypeGrouped.map((trainingType) => {
                const trainingTypeKey = `tt-${trainingType.trainingTypeId}`;
                const isTrainingTypeExpanded = expandedKeys.has(trainingTypeKey);

                return (
                  <Box key={trainingTypeKey} sx={{ border: '1px solid #eeeeee', borderRadius: 1.5, overflow: 'hidden' }}>
                    {/* Training Type Header */}
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
                      onClick={() => toggleExpand(trainingTypeKey)}
                    >
                      <ExpandMoreIcon
                        fontSize="small"
                        sx={{ transform: isTrainingTypeExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                          {trainingType.trainingTypeName}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {trainingType.sessions.length} sesión{trainingType.sessions.length !== 1 ? 'es' : ''}
                      </Typography>
                    </Box>

                    <Collapse in={isTrainingTypeExpanded} timeout="auto" unmountOnExit>
                      <Stack spacing={1} sx={{ p: 1.5 }}>
                        {trainingType.sessions.map((session) => {
                          const sessionKey = `s-${session.id}`;
                          const isSessionExpanded = expandedKeys.has(sessionKey);
                          const sessionDate = getSessionDate(session);
                          const dateLabel = sessionDate && !Number.isNaN(sessionDate.getTime())
                            ? `${sessionDate.toLocaleDateString('es-AR')} \u2014 ${sessionDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Fecha no disponible';

                          // Get attendance records for this session
                          const sessionAttendance = rows.map((employee) => {
                            const attendance = attendanceMap?.[session.id]?.[employee.empleadoId];
                            return {
                              empleadoId: employee.empleadoId,
                              nombre: employee.nombre,
                              attendance,
                              status: resolveEmployeeStatus(attendance)
                            };
                          });

                          const hasAttendance = sessionAttendance.some((r) => r.attendance);

                          return (
                            <Box key={sessionKey} sx={{ border: '1px solid #f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
                              {/* Session Header */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  p: 1,
                                  bgcolor: '#fafafa',
                                  cursor: hasAttendance ? 'pointer' : 'default'
                                }}
                                onClick={hasAttendance ? () => toggleExpand(sessionKey) : undefined}
                              >
                                {hasAttendance && (
                                  <ExpandMoreIcon
                                    fontSize="small"
                                    sx={{ transform: isSessionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
                                  />
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                    {dateLabel}
                                  </Typography>
                                  {session.status && (
                                    <Typography variant="caption" color="text.secondary">
                                      {session.status}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>

                              {/* Session Attendance */}
                              <Collapse in={isSessionExpanded} timeout="auto" unmountOnExit>
                                <Stack spacing={0.75} sx={{ p: 1, bgcolor: '#fafafa' }}>
                                  {sessionAttendance
                                    .filter((r) => r.attendance)
                                    .map((record) => (
                                      <Box
                                        key={`${sessionKey}-${record.empleadoId}`}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                          p: 0.75,
                                          borderRadius: 0.75,
                                          bgcolor: '#ffffff',
                                          border: '1px solid #eeeeee'
                                        }}
                                      >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="body2" noWrap>
                                            {record.nombre}
                                          </Typography>
                                        </Box>
                                        <Box
                                          sx={{
                                            display: 'inline-flex',
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 0.75,
                                            bgcolor: record.status.bg,
                                            color: record.status.color,
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          {record.status.label}
                                        </Box>
                                      </Box>
                                    ))}
                                  {sessionAttendance.every((r) => !r.attendance) && (
                                    <Typography variant="caption" color="text.secondary">
                                      Sin registros
                                    </Typography>
                                  )}
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
        </Box>
      </Stack>
    </Drawer>
  );
}
