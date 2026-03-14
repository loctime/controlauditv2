import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingPlanService } from '../../../../services/training';

export default function PlanItemsPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!ownerId || !planId) return;
    setLoading(true);
    setError('');
    try {
      const list = await trainingPlanService.listPlanItems(ownerId, { planId });
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los ítems del plan.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, planId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ownerId) {
    return (
      <Alert severity="warning">No hay contexto de owner disponible.</Alert>
    );
  }

  if (!planId) {
    return (
      <Alert severity="error">Falta el identificador del plan en la URL.</Alert>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/training')} sx={{ mb: 2 }}>
        Volver a capacitaciones
      </Button>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Ítems del plan
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Typography color="text.secondary">Cargando…</Typography>
        ) : items.length === 0 ? (
          <Typography color="text.secondary">No hay ítems en este plan.</Typography>
        ) : (
          <List dense>
            {items.map((item) => (
              <ListItem key={item.id}>
                <ListItemText
                  primary={`Tipo: ${item.trainingTypeId || '—'}`}
                  secondary={`Mes planificado: ${item.plannedMonth ?? '—'} · Estado: ${item.status ?? '—'}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
