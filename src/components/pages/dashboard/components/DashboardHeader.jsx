import React from "react";
import { Paper, Typography } from "@mui/material";

export default function DashboardHeader({ companyName, period }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        borderRadius: "16px"
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          mb: 1
        }}
      >
        SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO
      </Typography>
      
    </Paper>
  );
}

