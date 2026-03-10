import React, { useEffect, useState } from 'react';
import { Alert, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { trainingEvidenceService } from '../../../../../services/training';

const evidenceTypes = ['photo', 'signed_sheet', 'digital_signature', 'exam_file', 'document'];

function labelEvidencia(tipo) {
  const map = {
    photo: 'Foto',
    signed_sheet: 'Planilla firmada',
    digital_signature: 'Firma digital',
    exam_file: 'Archivo de evaluación',
    document: 'Documento'
  };
  return map[tipo] || tipo;
}

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
      setError(err.message || 'No se pudo cargar la evidencia.');
    }
  };

  useEffect(() => {
    load();
  }, [ownerId, session?.id]);

  const addEvidence = async () => {
    if (!ownerId || !session?.id) return;
    if (!form.fileReference) {
      setError('La referencia del archivo es obligatoria.');
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
      setError(err.message || 'No se pudo cargar el metadato de evidencia.');
    }
  };

  if (!session) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Evidencias</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <TextField select fullWidth label="Tipo de evidencia" value={form.evidenceType} onChange={(e) => setForm({ ...form, evidenceType: e.target.value })}>
            {evidenceTypes.map((type) => <MenuItem key={type} value={type}>{labelEvidencia(type)}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={5}>
          <TextField fullWidth label="Referencia de archivo" value={form.fileReference} onChange={(e) => setForm({ ...form, fileReference: e.target.value })} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={addEvidence}>Cargar evidencia</Button>
        <Button variant="outlined" onClick={load}>Actualizar evidencias</Button>
      </Stack>

      <Stack spacing={1}>
        {evidenceList.map((evidence) => (
          <Paper key={evidence.id} variant="outlined" sx={{ p: 1.5 }}>
            <Typography sx={{ fontWeight: 700 }}>{labelEvidencia(evidence.evidenceType)}</Typography>
            <Typography variant="body2" color="text.secondary">{evidence.fileReference}</Typography>
            <Typography variant="body2">{evidence.notes || 'Sin notas'}</Typography>
          </Paper>
        ))}
        {evidenceList.length === 0 && <Alert severity="info">No hay evidencia cargada para esta sesión.</Alert>}
      </Stack>
    </Paper>
  );
}

