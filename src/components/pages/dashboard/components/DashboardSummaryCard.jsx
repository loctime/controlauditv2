import React, { useMemo } from "react";
import {
  Paper,
  Box,
  Badge,
  IconButton,
  Button
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WarningIcon from "@mui/icons-material/Warning";
import TargetsSummarySection from "./TargetsSummarySection";
import AccionesSummarySection from "./AccionesSummarySection";
import GoalsSummarySection from "./GoalsSummarySection";

export default function DashboardSummaryCard({
  alertasCount,
  onAlertClick,
  generandoReporte,
  puedeGenerarReporte,
  onOpenReport,
  sucursales,
  onToggleTargets,
  targetsProgresos = {},
  targetsLoading = false,
  onToggleAcciones,
  accionesEstadisticas = {},
  accionesLoading = false,
  onToggleGoals,
  goalsCapacitaciones = null,
  goalsAuditorias = null,
  goalsAccidentes = null,
  goalsLoading = false
}) {

  // Calcular resumen de targets usando los progresos pasados como prop
  const resumenTargets = useMemo(() => {
    const sucursalesConTarget = sucursales?.filter(s => (s.targetMensual || 0) > 0) || [];
    
    if (sucursalesConTarget.length === 0) {
      return null;
    }

    let totalCompletadas = 0;
    let totalTarget = 0;

    sucursalesConTarget.forEach(sucursal => {
      const progreso = targetsProgresos[sucursal.id];
      if (progreso) {
        totalCompletadas += progreso.completadas;
        totalTarget += progreso.target;
      } else if (sucursal.targetMensual) {
        totalTarget += sucursal.targetMensual;
      }
    });

    const porcentaje = totalTarget > 0 ? Math.round((totalCompletadas / totalTarget) * 100) : 0;

    return {
      completadas: totalCompletadas,
      target: totalTarget,
      porcentaje,
      sucursalesConTarget: sucursalesConTarget.length
    };
  }, [sucursales, targetsProgresos]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        backgroundColor: "white",
        mb: 1
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        gap: 1.25
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TargetsSummarySection
            resumen={resumenTargets}
            loading={targetsLoading}
            onToggle={onToggleTargets}
          />
          <AccionesSummarySection
            estadisticas={accionesEstadisticas}
            loading={accionesLoading}
            onToggle={onToggleAcciones}
          />
          <GoalsSummarySection
            goalsCapacitaciones={goalsCapacitaciones}
            goalsAuditorias={goalsAuditorias}
            goalsAccidentes={goalsAccidentes}
            loading={goalsLoading}
            onToggle={onToggleGoals}
          />
        </Box>

        {alertasCount > 0 && (
          <Badge badgeContent={alertasCount} color="error" sx={{ mr: 1 }}>
            <IconButton
              onClick={onAlertClick}
              aria-label={`Ver ${alertasCount} alerta${alertasCount > 1 ? 's' : ''}`}
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

