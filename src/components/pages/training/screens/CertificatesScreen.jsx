import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { empleadoService } from '../../../../services/empleadoService';
import { trainingCatalogService, trainingCertificateService, trainingSessionService } from '../../../../services/training';
import CertificatesListView from '../components/certificates/CertificatesListView';

function labelEstadoCertificado(status) {
  const map = {
    active: 'Activo',
    revoked: 'Revocado',
    expired: 'Vencido'
  };
  return map[status] || status;
}

export default function CertificatesScreen() {
  const { userProfile, userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [viewCertificate, setViewCertificate] = useState(null);

  const [form, setForm] = useState({
    certificateNumber: '',
    employeeId: '',
    trainingTypeId: '',
    sessionId: '',
    issuedAt: new Date().toISOString().slice(0, 10),
    validFrom: new Date().toISOString().slice(0, 10),
    expiresAt: '',
    fileReference: '',
    status: 'active'
  });

  const employeeMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const trainingMap = useMemo(() => Object.fromEntries(trainings.map((t) => [t.id, t])), [trainings]);

  const load = async () => {
    if (!ownerId) return;
    setError('');
    try {
      const [emps, cats, sess, active, revoked, expired] = await Promise.all([
        empleadoService.getEmpleadosBySucursales(ownerId, userSucursales.map((s) => s.id)),
        trainingCatalogService.listAll(ownerId),
        trainingSessionService.listSessions(ownerId),
        trainingCertificateService.listByStatus(ownerId, 'active'),
        trainingCertificateService.listByStatus(ownerId, 'revoked').catch(() => []),
        trainingCertificateService.listByStatus(ownerId, 'expired').catch(() => [])
      ]);
      const merged = [...active, ...revoked, ...expired];
      setEmployees(emps);
      setTrainings(cats);
      setSessions(sess);
      setCertificates(merged);
    } catch (err) {
      console.error('[CertificatesScreen] load error', err);
      setError(err.message || 'No se pudieron cargar los certificados.');
    }
  };

  useEffect(() => {
    load();
  }, [ownerId]);

  const createCertificate = async () => {
    if (!ownerId) return;
    if (!form.employeeId || !form.trainingTypeId || !form.sessionId) {
      setError('Empleado, capacitacion y sesion son obligatorios.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await trainingCertificateService.create(ownerId, {
        ...form,
        revoked: false
      });
      setForm((prev) => ({ ...prev, certificateNumber: '', employeeId: '', trainingTypeId: '', sessionId: '' }));
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo emitir el certificado.');
    } finally {
      setSaving(false);
    }
  };

  const revokeCertificate = async (certificate) => {
    if (!ownerId) return;
    try {
      await trainingCertificateService.revoke(ownerId, certificate.id, 'revoked_from_ui');
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo revocar el certificado.');
    }
  };

  const downloadCertificate = (certificate) => {
    if (certificate.fileReference?.startsWith('http')) {
      window.open(certificate.fileReference, '_blank', 'noopener,noreferrer');
      return;
    }
    setError('La referencia del archivo del certificado no es una URL descargable.');
  };

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para certificados.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Emitir certificado</Typography>
            <Stack spacing={1.5}>
              <TextField label="Numero de certificado" value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} />
              <TextField select label="Empleado" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>{employee.nombre || employee.id}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Capacitacion" value={form.trainingTypeId} onChange={(e) => setForm({ ...form, trainingTypeId: e.target.value })}>
                {trainings.map((training) => (
                  <MenuItem key={training.id} value={training.id}>{training.name}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Sesion" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })}>
                {sessions.map((session) => (
                  <MenuItem key={session.id} value={session.id}>{session.trainingTypeId} · {session.branchId}</MenuItem>
                ))}
              </TextField>
              <TextField type="date" label="Fecha de emision" InputLabelProps={{ shrink: true }} value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })} />
              <TextField type="date" label="Valido desde" InputLabelProps={{ shrink: true }} value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              <TextField type="date" label="Vencimiento" InputLabelProps={{ shrink: true }} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              <TextField label="Referencia de archivo" value={form.fileReference} onChange={(e) => setForm({ ...form, fileReference: e.target.value })} />
              <Button variant="contained" onClick={createCertificate} disabled={saving}>{saving ? 'Guardando...' : 'Emitir certificado'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <CertificatesListView
            certificates={certificates.map((certificate) => ({
              ...certificate,
              employeeName: employeeMap[certificate.employeeId]?.nombre,
              trainingName: trainingMap[certificate.trainingTypeId]?.name
            }))}
            onView={setViewCertificate}
            onDownload={downloadCertificate}
            onRevoke={revokeCertificate}
          />
        </Grid>
      </Grid>

      <Dialog open={Boolean(viewCertificate)} onClose={() => setViewCertificate(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalle de certificado</DialogTitle>
        <DialogContent>
          {viewCertificate && (
            <Stack spacing={1}>
              <Typography><strong>Numero:</strong> {viewCertificate.certificateNumber || viewCertificate.id}</Typography>
              <Typography><strong>Empleado:</strong> {viewCertificate.employeeName || viewCertificate.employeeId}</Typography>
              <Typography><strong>Capacitacion:</strong> {viewCertificate.trainingName || viewCertificate.trainingTypeId}</Typography>
              <Typography><strong>Estado:</strong> {labelEstadoCertificado(viewCertificate.status)}</Typography>
              <Typography><strong>Archivo:</strong> {viewCertificate.fileReference || '-'}</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
