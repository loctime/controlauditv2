import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  Collapse,
  Grid
} from '@mui/material';
import { 
  TrendingUp as TrendIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import AccidentesBreakdown from '../../../pages/dashboard-higiene/components/AccidentesBreakdown';
import CapacitacionesMetrics from '../../../pages/dashboard-higiene/components/CapacitacionesMetrics';

export default function DashboardTrendCharts({
  accidentesAnalysis,
  capacitacionesMetrics,
  selectedYear
}) {
  const [showCharts, setShowCharts] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendIcon sx={{ color: '#f59e0b', mr: 1 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#111827',
              fontSize: '18px'
            }}
          >
            Gráficos de Tendencia
          </Typography>
        </Box>

        <Button
          onClick={() => setShowCharts(!showCharts)}
          startIcon={<ExpandMoreIcon sx={{ 
            transform: showCharts ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out'
          }} />}
          sx={{
            textTransform: 'none',
            color: '#6b7280',
            fontSize: '13px',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#f9fafb',
              color: '#374151'
            }
          }}
        >
          {showCharts ? 'Ocultar gráficos' : 'Ver gráficos'}
        </Button>
      </Box>

      <Collapse in={showCharts} timeout="auto">
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    mb: 1,
                    fontSize: '14px'
                  }}
                >
                  Análisis de Accidentes e Incidentes
                </Typography>
              </Box>
              <AccidentesBreakdown analysis={accidentesAnalysis} />
            </Grid>

            <Grid item xs={12} lg={6}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    mb: 1,
                    fontSize: '14px'
                  }}
                >
                  Cumplimiento de Capacitaciones
                </Typography>
              </Box>
              <CapacitacionesMetrics metrics={capacitacionesMetrics} />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}
