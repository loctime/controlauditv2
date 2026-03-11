import React, { useState } from 'react';
import { Alert, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';

export default function AuditExportPanel({ onExportPdf, onExportZip, companies = [], branches = [] }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    companyId: '',
    branchId: ''
  });

  const filteredBranches = branches.filter((branch) => !form.companyId || branch.empresaId === form.companyId);

  const runExport = async (type) => {
    setError('');
    setBusy(true);
    try {
      const payload = {
        year: Number(form.year),
        companyId: form.companyId || null,
        branchId: form.branchId || null
      };

      const result = type === 'pdf'
        ? await onExportPdf(payload)
        : await onExportZip(payload);

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'No se pudo exportar el paquete de evidencia.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Audit Export</Typography>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={3}>
          <TextField type="number" label="Año" fullWidth value={form.year} onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField select fullWidth label="Empresa" value={form.companyId} onChange={(e) => setForm((prev) => ({ ...prev, companyId: e.target.value, branchId: '' }))}>
            <MenuItem value="">Todas</MenuItem>
            {companies.map((company) => <MenuItem key={company.id} value={company.id}>{company.nombre || company.id}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={5}>
          <TextField select fullWidth label="Sucursal" value={form.branchId} onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value }))}>
            <MenuItem value="">Todas</MenuItem>
            {filteredBranches.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.nombre || branch.id}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={() => runExport('pdf')} disabled={busy}>{busy ? 'Exportando...' : 'Exportar PDF'}</Button>
        <Button variant="outlined" onClick={() => runExport('zip')} disabled={busy}>{busy ? 'Exportando...' : 'Exportar ZIP/JSON'}</Button>
      </Stack>
    </Paper>
  );
}
