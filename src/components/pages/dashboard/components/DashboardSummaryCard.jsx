import React from "react";
import {
  Paper,
  Box,
  Typography,
  Badge,
  IconButton,
  Button
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WarningIcon from "@mui/icons-material/Warning";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";

export default function DashboardSummaryCard({
  selectedEmpresa,
  empresaSeleccionada,
  selectedSucursal,
  sucursalSeleccionada,
  selectedYear,
  selectedMonth,
  alertasCount,
  onAlertClick,
  generandoReporte,
  puedeGenerarReporte,
  onOpenReport
}) {
  const periodLabel = new Date(
    selectedYear,
    selectedMonth - 1
  ).toLocaleString("es-ES", {
    month: "long",
    year: "numeric"
  });

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        backgroundColor: "white",
        mb: 4
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <BusinessIcon sx={{ color: "#4f46e5" }} />
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontWeight: 500 }}
            >
              Empresa
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              {selectedEmpresa === "todas"
                ? "Todas las empresas"
                : empresaSeleccionada?.nombre || "Sin empresa"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StorefrontIcon sx={{ color: "#0ea5e9" }} />
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontWeight: 500 }}
            >
              Sucursal
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              {selectedSucursal === "todas"
                ? "Todas las sucursales"
                : sucursalSeleccionada?.nombre || "Sin sucursal"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontWeight: 500 }}
          >
            Período
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: "#111827" }}
          >
            {periodLabel}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {alertasCount > 0 && (
          <Badge badgeContent={alertasCount} color="error" sx={{ mr: 1 }}>
            <IconButton
              onClick={onAlertClick}
              sx={{
                color: "#f97316",
                backgroundColor: "rgba(251, 146, 60, 0.12)",
                "&:hover": {
                  backgroundColor: "rgba(251, 146, 60, 0.2)"
                }
              }}
            >
              <WarningIcon />
            </IconButton>
          </Badge>
        )}

        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={onOpenReport}
          disabled={generandoReporte || !puedeGenerarReporte}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(79,70,229,0.25)"
          }}
        >
          {generandoReporte ? "Generando..." : "Generar Reporte PDF"}
        </Button>
      </Box>
    </Paper>
  );
}

