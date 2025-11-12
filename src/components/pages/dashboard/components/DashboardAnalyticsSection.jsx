import React, { useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";
import MetricChips from "../../../pages/dashboard-higiene/components/MetricChips";

export default function DashboardAnalyticsSection({
  metricas,
  auditoriasMetrics
}) {
  const resumenMetricas = useMemo(
    () => ({
      totalEmpleados: metricas?.totalEmpleados ?? 0,
      empleadosActivos: metricas?.empleadosActivos ?? 0,
      promedioTrabajadores: metricas?.promedioTrabajadores ?? 0,
      empleadosEnReposo: metricas?.empleadosEnReposo ?? 0,
      horasTrabajadas: metricas?.horasTrabajadas ?? 0,
      horasPerdidas: metricas?.horasPerdidas ?? 0,
      diasPerdidos: metricas?.diasPerdidos ?? 0,
      diasSinAccidentes: metricas?.diasSinAccidentes ?? 0
    }),
    [metricas]
  );

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
            variant="h5"
            component="h5"
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
            metricas={resumenMetricas}
            analysis={null}
            auditorias={auditoriasMetrics}
          />
        </Paper>
      </Box>
    </>
  );
}

