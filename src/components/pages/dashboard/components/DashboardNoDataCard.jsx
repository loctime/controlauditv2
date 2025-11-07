import React from "react";
import { Paper, Typography } from "@mui/material";

export default function DashboardNoDataCard() {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 5,
        p: 3,
        borderRadius: "16px",
        border: "1px dashed #cbd5f5",
        backgroundColor: "rgba(99,102,241,0.05)",
        textAlign: "center"
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#4f46e5" }}>
        Sin datos completos de empleados
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Registra empleados y accidentes para habilitar el análisis avanzado del
        dashboard.
      </Typography>
    </Paper>
  );
}

