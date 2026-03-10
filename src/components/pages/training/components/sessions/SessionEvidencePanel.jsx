import React, { useEffect, useState } from 'react';
import { Alert, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { trainingEvidenceService } from '../../../../../services/training';

const evidenceTypes = ['photo', 'signed_sheet', 'digital_signature', 'exam_file', 'document'];

export default function SessionEvidencePanel({ ownerId, session }) {
  const [error, setError] = useState('');
  const [evidenceList, setEvidenceList] = useState([]);
  const [form, setForm] = useState({
    evidenceType: 'photo',
    fileReference: '',
    notes: ''
  });

  const load = async () => {
    if (!ownerId || !session?.id) return;
    try {
      const list = await trainingEvidenceService.listBySession(ownerId, session.id);
      setEvidenceList(list);
    } catch (err) {
      setError(err.message || 'Unable to load evidence.');
    }
  };

  useEffect(() => {
    load();
  }, [ownerId, session?.id]);

  const addEvidence = async () => {
    if (!ownerId || !session?.id) return;
    if (!form.fileReference) {
      setError('File reference is required.');
      return;
    }

    setError('');
    try {
      await trainingEvidenceService.create(ownerId, {
        evidenceType: form.evidenceType,
        sessionId: session.id,
        companyId: session.companyId,
        branchId: session.branchId,
        fileReference: form.fileReference,
        notes: form.notes,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.instructorId || null
      });
      setForm({ evidenceType: 'photo', fileReference: '', notes: '' });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to upload evidence metadata.');
    }
  };

  if (!session) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Evidence</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <TextField select fullWidth label="Evidence Type" value={form.evidenceType} onChange={(e) => setForm({ ...form, evidenceType: e.target.value })}>
            {evidenceTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={5}>
          <TextField fullWidth label="File Reference" value={form.fileReference} onChange={(e) => setForm({ ...form, fileReference: e.target.value })} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={addEvidence}>Upload Evidence</Button>
        <Button variant="outlined" onClick={load}>Refresh Evidence</Button>
      </Stack>

      <Stack spacing={1}>
        {evidenceList.map((evidence) => (
          <Paper key={evidence.id} variant="outlined" sx={{ p: 1.5 }}>
            <Typography sx={{ fontWeight: 700 }}>{evidence.evidenceType}</Typography>
            <Typography variant="body2" color="text.secondary">{evidence.fileReference}</Typography>
            <Typography variant="body2">{evidence.notes || 'No notes'}</Typography>
          </Paper>
        ))}
        {evidenceList.length === 0 && <Alert severity="info">No evidence uploaded for this session.</Alert>}
      </Stack>
    </Paper>
  );
}
