import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCertificateService } from '../../../../services/training';

export default function CertificatesScreen() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [certificates, setCertificates] = useState([]);
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

  const load = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');

    try {
      const active = await trainingCertificateService.listByStatus(ownerId, 'active');
      setCertificates(active);
    } catch (err) {
      console.error('[CertificatesScreen] load error', err);
      setError('Unable to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ownerId]);

  const createCertificate = async () => {
    if (!ownerId) return;
    if (!form.employeeId || !form.trainingTypeId || !form.sessionId) {
      setError('Employee, training type and session are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await trainingCertificateService.create(ownerId, {
        ...form,
        revoked: false
      });
      setForm((prev) => ({
        ...prev,
        certificateNumber: '',
        employeeId: '',
        trainingTypeId: '',
        sessionId: ''
      }));
      await load();
    } catch (err) {
      setError(err.message || 'Unable to create certificate.');
    } finally {
      setSaving(false);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for certificates.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Issue Certificate</Typography>
            <Stack spacing={1.5}>
              <TextField label="Certificate Number" value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} />
              <TextField label="Employee Id" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
              <TextField label="Training Type Id" value={form.trainingTypeId} onChange={(e) => setForm({ ...form, trainingTypeId: e.target.value })} />
              <TextField label="Session Id" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })} />
              <TextField type="date" label="Issued At" InputLabelProps={{ shrink: true }} value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })} />
              <TextField type="date" label="Valid From" InputLabelProps={{ shrink: true }} value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              <TextField type="date" label="Expires At" InputLabelProps={{ shrink: true }} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              <TextField label="File Reference" value={form.fileReference} onChange={(e) => setForm({ ...form, fileReference: e.target.value })} />
              <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="revoked">Revoked</MenuItem>
              </TextField>
              <Button variant="contained" onClick={createCertificate} disabled={saving}>{saving ? 'Saving...' : 'Issue Certificate'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Active Certificates</Typography>
            {loading ? <CircularProgress /> : (
              <Stack spacing={1}>
                {certificates.map((certificate) => (
                  <Paper key={certificate.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{certificate.certificateNumber || certificate.id}</Typography>
                    <Typography variant="body2" color="text.secondary">Employee: {certificate.employeeId} | Training: {certificate.trainingTypeId}</Typography>
                    <Typography variant="body2" color="text.secondary">Valid: {String(certificate.validFrom || '-')} to {String(certificate.expiresAt || '-')}</Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}