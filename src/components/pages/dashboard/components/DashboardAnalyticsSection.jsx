import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import MetricChips from "../../../pages/dashboard-higiene/components/MetricChips";
import AccidentesBreakdown from "../../../pages/dashboard-higiene/components/AccidentesBreakdown";
import CapacitacionesMetrics from "../../../pages/dashboard-higiene/components/CapacitacionesMetrics";
import GraficoIndices from "../../../pages/dashboard-higiene/components/GraficoIndices";

export default function DashboardAnalyticsSection({
  datos,
  accidentesAnalysis,
  auditoriasMetrics,
  capacitacionesMetrics,
  selectedYear
}) {
  return (
    <>
      <Box sx={{ mt: 1.5 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            backgroundColor: "white"
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            📊 Resumen Integrado
          </Typography>
          <MetricChips
            metricas={datos.metricas}
            analysis={accidentesAnalysis}
            auditorias={auditoriasMetrics}
          />
        </Paper>
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <AccidentesBreakdown analysis={accidentesAnalysis} />
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <CapacitacionesMetrics metrics={capacitacionesMetrics} />
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            backgroundColor: "white"
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            📈 Tendencias de Índices
          </Typography>
          <GraficoIndices datos={datos} periodo={selectedYear} />
        </Paper>
      </Box>
    </>
  );
}

