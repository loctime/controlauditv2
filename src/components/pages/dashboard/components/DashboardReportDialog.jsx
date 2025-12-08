import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Divider,
  Chip,
  Grid
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const optionsConfig = [
  { 
    key: "comparacionAnoAnterior", 
    label: "Comparación con Año Anterior",
    description: "Incluye comparación de índices con el año anterior"
  },
  { 
    key: "distribucionPorArea", 
    label: "Distribución de Accidentes por Área",
    description: "Muestra el top 5 de áreas con más accidentes"
  },
  { 
    key: "capacitacionesPorTipo", 
    label: "Capacitaciones por Tipo",
    description: "Desglose de capacitaciones (Charlas, Entrenamientos, Formales)"
  },
  { 
    key: "horasSemanales", 
    label: "Horas Semanales en el Encabezado",
    description: "Incluye horas semanales en la portada del reporte"
  }
];

export default function DashboardReportDialog({
  open,
  onClose,
  reportOptions,
  onOptionChange,
  generandoReporte,
  onGenerateReport,
  empresaSeleccionada = null,
  sucursalSeleccionada = null,
  selectedYear = null,
  selectedMonth = null
}) {
  const periodoLabel = selectedYear && selectedMonth
    ? new Date(selectedYear, selectedMonth - 1).toLocaleString("es-ES", {
        month: "long",
        year: "numeric"
      })
    : "No especificado";

  const empresaNombre = empresaSeleccionada?.nombre || 
    (empresaSeleccionada === "todas" ? "Todas las empresas" : "Sin empresa");
  const sucursalNombre = sucursalSeleccionada?.nombre || 
    (sucursalSeleccionada === "todas" ? "Todas las sucursales" : "Sin sucursal");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: "bold",
          pb: 1
        }}
      >
        <PictureAsPdfIcon sx={{ color: "#4f46e5" }} />
        Configuración del Reporte PDF
      </DialogTitle>
      <DialogContent dividers>
        {/* Información del Reporte */}
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            backgroundColor: "#f9fafb",
            borderRadius: 2,
            border: "1px solid #e5e7eb"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <BusinessIcon sx={{ fontSize: 16, color: "#4f46e5" }} />
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                <strong>Empresa:</strong> {empresaNombre}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <StorefrontIcon sx={{ fontSize: 16, color: "#0ea5e9" }} />
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                <strong>Sucursal:</strong> {sucursalNombre}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <CalendarMonthIcon sx={{ fontSize: 16, color: "#059669" }} />
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                <strong>Período:</strong> {periodoLabel}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Opciones del Reporte */}
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, mb: 2, color: "#111827" }}
        >
          Secciones Adicionales
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecciona las secciones adicionales que deseas incluir en el reporte:
        </Typography>
        <FormGroup>
          {optionsConfig.map((option) => (
            <Box
              key={option.key}
              sx={{
                p: 1.5,
                mb: 1,
                borderRadius: 1,
                border: "1px solid #e5e7eb",
                backgroundColor: reportOptions[option.key] ? "#f0f9ff" : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#f9fafb",
                  borderColor: "#d1d5db"
                }
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportOptions[option.key]}
                    onChange={(event) =>
                      onOptionChange(option.key, event.target.checked)
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.label}
                    </Typography>
                    {option.description && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", display: "block", mt: 0.5 }}
                      >
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ margin: 0, width: "100%" }}
              />
            </Box>
          ))}
        </FormGroup>

        {/* Información sobre secciones incluidas */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#fef3c7", borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: "#92400e", fontWeight: 500 }}>
            ℹ️ El reporte incluirá automáticamente: Resumen Ejecutivo, Índices Técnicos, 
            Targets Mensuales, Acciones Requeridas, Análisis de Accidentes, 
            Cumplimiento de Capacitaciones, Metas y Objetivos, Gráficos y Alertas.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={generandoReporte}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={onGenerateReport}
          disabled={generandoReporte}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(79,70,229,0.25)"
          }}
        >
          {generandoReporte ? "Generando..." : "Generar Reporte PDF"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

