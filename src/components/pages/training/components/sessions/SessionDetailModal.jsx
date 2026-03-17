import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  Box,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { empleadoService } from '../../../../../services/empleadoService';
import { resolveFileAccess } from '../../../../../services/fileResolverService';
import {
  trainingAttendanceService,
  trainingCatalogService,
  trainingCertificateService,
  trainingEvidenceService
} from '../../../../../services/training';
import {
  generateCertificatePDFBlob,
  downloadCertificatePDF
} from '../../../../../services/training/trainingCertificatePdfService';
import {
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
} from '../../../../../types/trainingDomain';

function attendanceDisplayStatus(status) {
  return status === TRAINING_ATTENDANCE_STATUSES.PRESENT ? 'Presente' : 'Ausente';
}

const evaluationLabels = {
  [TRAINING_EVALUATION_STATUSES.APPROVED]: 'Aprobado',
  [TRAINING_EVALUATION_STATUSES.FAILED]: 'Desaprobado',
  [TRAINING_EVALUATION_STATUSES.PENDING]: 'Pendiente',
  [TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE]: 'No aplica'
};

/** Escala de calificación en el módulo de capacitación (Rating 1..max). */
const SCORE_MAX = 3;

const evidenceTypeLabels = {
  photo: 'Foto',
  signed_sheet: 'Planilla firmada',
  digital_signature: 'Firma digital',
  exam_file: 'Archivo de evaluación',
  document: 'Documento'
};

function formatDate(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('es-AR');
}

/** Vista previa y descarga de una evidencia (usa fileId en fileReference). */
function EvidenceItem({ evidence, typeLabel }) {
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');
  const fileRef = evidence?.fileReference ? { fileId: evidence.fileReference } : null;

  useEffect(() => {
    if (!fileRef?.fileId) {
      setAccess(null);
      return;
    }
    let alive = true;
    resolveFileAccess(fileRef)
      .then((result) => {
        if (alive) setAccess(result);
      })
      .catch((err) => {
        if (alive) setError(err?.message || 'No se pudo cargar');
      });
    return () => { alive = false; };
  }, [evidence?.fileReference]);

  const viewUrl = access?.viewUrl || access?.downloadUrl;
  const isImage = evidence?.evidenceType === 'photo' || access?.previewType === 'image';

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="body2" fontWeight={600}>
        {typeLabel}
      </Typography>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{error}</Typography>
      )}
      {viewUrl && isImage && (
        <Box sx={{ mt: 1, mb: 1, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}>
          <img
            src={viewUrl}
            alt={evidence?.notes || 'Evidencia'}
            style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }}
          />
        </Box>
      )}
      {viewUrl && !isImage && access?.previewType === 'pdf' && (
        <Box sx={{ mt: 1, mb: 1, height: 220, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}>
          <iframe title={typeLabel} src={viewUrl} style={{ width: '100%', height: '100%', border: 0 }} />
        </Box>
      )}
      {viewUrl && !isImage && access?.previewType !== 'pdf' && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Vista previa no disponible para este tipo de archivo.
        </Typography>
      )}
      {!viewUrl && !error && fileRef?.fileId && (
        <Box sx={{ mt: 1 }}>
          <CircularProgress size={20} />
        </Box>
      )}
      {(access?.downloadUrl || viewUrl) && (
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          component="a"
          href={access?.downloadUrl || viewUrl}
          download
          target="_blank"
          rel="noreferrer"
          sx={{ mt: 1 }}
        >
          Descargar
        </Button>
      )}
      {evidence?.notes && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{evidence.notes}</Typography>
      )}
    </Paper>
  );
}

function employeeDisplayName(emp) {
  if (!emp) return '';
  if (emp.nombreCompleto) return emp.nombreCompleto;
  if (emp.apellido && emp.nombre) return `${emp.apellido}, ${emp.nombre}`;
  return emp.nombre || emp.apellido || emp.email || emp.id || '';
}

export default function SessionDetailModal({ open, onClose, ownerId, session }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [employeeNameMap, setEmployeeNameMap] = useState({});
  const [catalogItem, setCatalogItem] = useState(null);
  const [generatingCertificateEmployeeId, setGeneratingCertificateEmployeeId] = useState(null);
  const [certificateError, setCertificateError] = useState('');
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState(null);

  const loadData = useCallback(async () => {
    if (!ownerId || !session?.id) return;
    const loadEmployees = async () => {
      const byId = new Map();
      if (session.branchId) {
        const byBranch = await empleadoService.getEmpleadosBySucursal(ownerId, session.branchId);
        (byBranch || []).forEach((e) => e.id && byId.set(e.id, e));
      }
      if (session.companyId) {
        const byCompany = await empleadoService.getEmpleadosByEmpresa(ownerId, session.companyId);
        (byCompany || []).forEach((e) => e.id && byId.set(e.id, e));
      }
      return Array.from(byId.values());
    };
    const [att, ev, employees, catalog] = await Promise.all([
      trainingAttendanceService.listAttendanceBySession(ownerId, session.id).catch((err) => {
        setError(err.message || 'Error al cargar participantes.');
        return [];
      }),
      trainingEvidenceService.listBySession(ownerId, session.id).catch(() => []),
      loadEmployees(),
      session.trainingTypeId ? trainingCatalogService.getById(ownerId, session.trainingTypeId).catch(() => null) : Promise.resolve(null)
    ]);
    setAttendance(att || []);
    setEvidence(ev || []);
    setCatalogItem(catalog || null);
    const nameMap = {};
    (employees || []).forEach((emp) => {
      const name = employeeDisplayName(emp);
      if (emp.id && name) nameMap[emp.id] = name;
    });
    setEmployeeNameMap(nameMap);
  }, [ownerId, session?.id, session?.branchId, session?.companyId, session?.trainingTypeId]);

  useEffect(() => {
    if (!open || !ownerId || !session?.id) {
      setAttendance([]);
      setEvidence([]);
      setEmployeeNameMap({});
      setCatalogItem(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError('');
    loadData().then(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [open, ownerId, session?.id, loadData]);

  const requiresEvaluation = catalogItem?.requiresEvaluation === true;
  const requiresScore = catalogItem?.requiresScore === true;

  const handleUpdateEvaluation = useCallback(async (record, field, value) => {
    if (!ownerId || !session?.id || !record?.employeeId) return;
    setUpdatingAttendanceId(record.employeeId);
    try {
      await trainingAttendanceService.upsertAttendance(ownerId, session.id, record.employeeId, {
        ...record,
        [field]: value,
        sessionData: session
      });
      await loadData();
    } catch (err) {
      setCertificateError(err?.message || 'Error al actualizar.');
    } finally {
      setUpdatingAttendanceId(null);
    }
  }, [ownerId, session?.id, session, loadData]);

  const canGenerateCertificate = (record) => {
    if (record.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.PRESENT) return false;
    if (!requiresEvaluation) return true;
    return record.evaluationStatus === TRAINING_EVALUATION_STATUSES.APPROVED;
  };

  const handleGenerateCertificate = async (record) => {
    if (!ownerId || !session?.id) return;
    setCertificateError('');
    setGeneratingCertificateEmployeeId(record.employeeId);
    try {
      const employeeName =
        employeeNameMap[record.employeeId] ||
        record.employeeDisplayName ||
        record.employeeName ||
        record.employeeId ||
        'Sin dato';
      const realizationDate = session.executedDate || session.scheduledDate || session.updatedAt || session.createdAt;
      const now = new Date();
      const issuedAt = record.validFrom || now;
      const certificateDisplayId = `CERT-${session.id || 'S'}-${record.employeeId || 'E'}`;
      const evaluationLabel =
        record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT
          ? (evaluationLabels[record.evaluationStatus] || record.evaluationStatus || '')
          : '';
      const blob = await generateCertificatePDFBlob({
        employeeName,
        trainingName: session.trainingTypeName || 'Sin dato',
        realizationDate,
        expiryDate: record.validUntil ?? null,
        companyName: session.companyName || '',
        branchName: session.branchName || '',
        instructorName: session.instructorName || '',
        score:
          record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT && record.score != null
            ? `${Number(record.score)}/${SCORE_MAX}`
            : '',
        evaluationStatus: evaluationLabel,
        issuedAt,
        certificateId: certificateDisplayId
      });
      const safeName = (employeeName || record.employeeId || 'certificado').replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '').trim().slice(0, 60) || 'certificado';
      downloadCertificatePDF(blob, `certificado-${safeName}.pdf`);

      // Crear certificado solo si aún no existe (primera emisión).
      if (!record.certificateId) {
        await trainingCertificateService.create(ownerId, {
          sessionId: session.id,
          employeeId: record.employeeId,
          trainingTypeId: session.trainingTypeId,
          validFrom: record.validFrom || null,
          expiresAt: record.validUntil || null,
          fileReference: null,
          issuedAt,
          displayId: certificateDisplayId,
          status: 'active'
        });
      }
      await loadData();
    } catch (err) {
      setCertificateError(err?.message || 'No se pudo generar el certificado.');
    } finally {
      setGeneratingCertificateEmployeeId(null);
    }
  };

  if (!session) return null;

  const presentCount = attendance.filter((r) => r.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT).length;
  const absentCount = attendance.length - presentCount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography component="span" variant="h6">Detalle de la sesión</Typography>
        <IconButton size="small" onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {certificateError && <Alert severity="error" onClose={() => setCertificateError('')}>{certificateError}</Alert>}

            {/* Resumen de la sesión */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Resumen</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Capacitación</Typography>
                  <Typography variant="body1">{session.trainingTypeName || 'Sin dato'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Empresa</Typography>
                  <Typography variant="body1">{session.companyName || 'Sin dato'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Sucursal</Typography>
                  <Typography variant="body1">{session.branchName || 'Sin dato'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Instructor</Typography>
                  <Typography variant="body1">{session.instructorName || 'Sin asignar'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Fecha</Typography>
                  <Typography variant="body1">{formatDate(session.scheduledDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Modalidad</Typography>
                  <Typography variant="body1">{session.modality || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">Ubicación</Typography>
                  <Typography variant="body1">{session.location || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Participantes: asistentes y ausentes */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Participantes ({presentCount} asistentes, {absentCount} ausentes)
              </Typography>
              <Table size="small" sx={{ '& td, & th': { borderColor: 'divider' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Participante</TableCell>
                    <TableCell>Asistencia</TableCell>
                    {requiresEvaluation && <TableCell>Evaluación</TableCell>}
                    <TableCell>Calificación</TableCell>
                    <TableCell>Notas</TableCell>
                    <TableCell>Certificado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">Sin participantes cargados.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {attendance.map((record, idx) => (
                    <TableRow key={record.id || record.employeeId || idx}>
                      <TableCell>
                        {employeeNameMap[record.employeeId] ||
                          record.employeeDisplayName ||
                          record.employeeName ||
                          record.employeeId ||
                          'Sin dato'}
                      </TableCell>
                      <TableCell>
                        {attendanceDisplayStatus(record.attendanceStatus)}
                      </TableCell>
                      {requiresEvaluation && (
                        <TableCell>
                          {record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT ? (
                            updatingAttendanceId === record.employeeId ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <Tooltip title="Aprobado">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUpdateEvaluation(record, 'evaluationStatus', TRAINING_EVALUATION_STATUSES.APPROVED)}
                                    sx={
                                      record.evaluationStatus === TRAINING_EVALUATION_STATUSES.APPROVED
                                        ? { bgcolor: 'success.main', color: 'success.contrastText', '&:hover': { bgcolor: 'success.dark' } }
                                        : { border: '1px solid', borderColor: 'divider' }
                                    }
                                  >
                                    <Typography component="span" fontWeight={700} sx={{ fontSize: '0.75rem' }}>A</Typography>
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reprobado">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUpdateEvaluation(record, 'evaluationStatus', TRAINING_EVALUATION_STATUSES.FAILED)}
                                    sx={
                                      record.evaluationStatus === TRAINING_EVALUATION_STATUSES.FAILED
                                        ? { bgcolor: 'error.main', color: 'error.contrastText', '&:hover': { bgcolor: 'error.dark' } }
                                        : { border: '1px solid', borderColor: 'divider' }
                                    }
                                  >
                                    <Typography component="span" fontWeight={700} sx={{ fontSize: '0.75rem' }}>R</Typography>
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT ? (
                          requiresScore && updatingAttendanceId !== record.employeeId ? (
                            <TextField
                              type="number"
                              size="small"
                              inputProps={{ min: 0, max: SCORE_MAX, step: 1 }}
                              value={record.score ?? ''}
                              onBlur={(e) => {
                                const v = e.target.value === '' ? null : Number(e.target.value);
                                if (v !== record.score && v !== (record.score ?? null)) {
                                  handleUpdateEvaluation(record, 'score', v);
                                }
                              }}
                              sx={{ width: 64 }}
                            />
                          ) : requiresScore && updatingAttendanceId === record.employeeId ? (
                            <CircularProgress size={20} />
                          ) : record.score != null ? (
                            `${Number(record.score)}/${SCORE_MAX}`
                          ) : (
                            '—'
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                      <TableCell>
                        {record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT ? (
                          canGenerateCertificate(record) ? (
                            generatingCertificateEmployeeId === record.employeeId ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleGenerateCertificate(record)}
                              >
                                {record.certificateId ? 'Descargar certificado PDF' : 'Generar certificado PDF'}
                              </Button>
                            )
                          ) : (
                            requiresEvaluation ? (
                              <Typography variant="caption" color="text.secondary">
                                Aprobar para generar certificado
                              </Typography>
                            ) : '—'
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Divider />

            {/* Evidencias */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Evidencias ({evidence.length})
              </Typography>
              {evidence.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No hay evidencias cargadas.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {evidence.map((ev) => (
                    <EvidenceItem
                      key={ev.id}
                      evidence={ev}
                      typeLabel={evidenceTypeLabels[ev.evidenceType] || ev.evidenceType}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
