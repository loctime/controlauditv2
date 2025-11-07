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
  Button
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const optionsConfig = [
  { key: "comparacionAnoAnterior", label: "Comparación con Año Anterior" },
  { key: "distribucionPorArea", label: "Distribución de Accidentes por Área" },
  { key: "capacitacionesPorTipo", label: "Capacitaciones por Tipo" },
  { key: "horasSemanales", label: "Horas Semanales en el Encabezado" }
];

export default function DashboardReportDialog({
  open,
  onClose,
  reportOptions,
  onOptionChange,
  generandoReporte,
  onGenerateReport
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: "bold"
        }}
      >
        <PictureAsPdfIcon />
        Opciones del Reporte PDF
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selecciona las secciones adicionales que deseas incluir en el reporte:
        </Typography>
        <FormGroup>
          {optionsConfig.map((option) => (
            <FormControlLabel
              key={option.key}
              control={
                <Checkbox
                  checked={reportOptions[option.key]}
                  onChange={(event) =>
                    onOptionChange(option.key, event.target.checked)
                  }
                  color="primary"
                />
              }
              label={option.label}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={onGenerateReport}
          disabled={generandoReporte}
        >
          {generandoReporte ? "Generando..." : "Generar Reporte"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

