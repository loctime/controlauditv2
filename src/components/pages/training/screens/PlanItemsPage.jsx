import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingPlanService, trainingCatalogService } from '../../../../services/training';
import PlanItemsByMonthView from '../utils/PlanItemsByMonthView';

export default function PlanItemsPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [typeNameMap, setTypeNameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!ownerId || !planId) return;
    setLoading(true);
    setError('');
    try {
      const [planData, list, catalog] = await Promise.all([
        trainingPlanService.getPlanById(ownerId, planId),
        trainingPlanService.listPlanItems(ownerId, { planId }),
        trainingCatalogService.listAll(ownerId)
      ]);
      setPlan(planData || null);
      setItems(Array.isArray(list) ? list : []);
      const map = Object.fromEntries((catalog || []).map((c) => [c.id, c.name || c.id]));
      setTypeNameMap(map);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los ítems del plan.');
      setItems([]);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [ownerId, planId]);

  useEffect(() => {
    load();
  }, [load]);

  const title = plan?.year != null ? `PLAN ANUAL ${plan.year}` : null;

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
        ) : (
          <PlanItemsByMonthView
            items={items}
            typeNameMap={typeNameMap}
            title={title}
            showStatusChip
          />
        )}
      </Paper>
    </Box>
  );
}
