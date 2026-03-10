import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService } from '../../../../services/training';

export default function CatalogScreen() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    modality: 'in_person',
    recommendedDurationMinutes: 60,
    validityMonths: 12,
    requiresEvaluation: true,
    requiresSignature: true,
    requiresCertificate: true,
    status: 'active'
  });

  const load = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const catalog = await trainingCatalogService.listAll(ownerId);
      setItems(catalog);
    } catch (err) {
      console.error('[CatalogScreen] load error', err);
      setError('Unable to load training catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ownerId]);

  const create = async () => {
    if (!ownerId) return;
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await trainingCatalogService.create(ownerId, {
        ...form,
        recommendedDurationMinutes: Number(form.recommendedDurationMinutes || 0),
        validityMonths: Number(form.validityMonths || 0)
      });
      setForm((prev) => ({ ...prev, name: '', description: '' }));
      await load();
    } catch (err) {
      setError(err.message || 'Unable to create training type.');
    } finally {
      setSaving(false);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for training catalog.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Create Training Type</Typography>
            <Stack spacing={1.5}>
              <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <TextField multiline rows={2} label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <TextField select label="Modality" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>
                <MenuItem value="in_person">In Person</MenuItem>
                <MenuItem value="virtual">Virtual</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </TextField>
              <TextField type="number" label="Recommended Duration (minutes)" value={form.recommendedDurationMinutes} onChange={(e) => setForm({ ...form, recommendedDurationMinutes: e.target.value })} />
              <TextField type="number" label="Validity (months)" value={form.validityMonths} onChange={(e) => setForm({ ...form, validityMonths: e.target.value })} />
              <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
              <Button variant="contained" onClick={create} disabled={saving}>{saving ? 'Saving...' : 'Create Training Type'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Catalog</Typography>
            {loading ? <CircularProgress /> : (
              <Stack spacing={1}>
                {items.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{item.name} ({item.status})</Typography>
                    <Typography variant="body2" color="text.secondary">{item.category} · {item.modality} · {item.validityMonths} months</Typography>
                    <Typography variant="body2">{item.description || 'No description'}</Typography>
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
