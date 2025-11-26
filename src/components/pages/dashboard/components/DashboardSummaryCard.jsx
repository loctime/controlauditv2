import React, { useMemo } from "react";
import {
  Paper,
  Box,
  Typography,
  Badge,
  IconButton,
  Button,
  LinearProgress,
  Chip,
  useTheme
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
  onOpenReport,
  sucursales,
  onToggleTargets,
  targetsProgresos = {},
  targetsLoading = false,
  onToggleAcciones,
  accionesEstadisticas = {},
  accionesLoading = false
}) {
  const theme = useTheme();

  const periodLabel = new Date(
    selectedYear,
    selectedMonth - 1
  ).toLocaleString("es-ES", {
    month: "long",
    year: "numeric"
  });

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

  const getColorTarget = (porcentaje) => {
    if (porcentaje >= 100) return 'success';
    if (porcentaje >= 80) return 'success';
    if (porcentaje >= 50) return 'warning';
    return 'error';
  };

  const accionesTotales = accionesEstadisticas?.total || 0;
  const accionesPendientes = accionesEstadisticas?.pendientes || 0;
  const accionesVencidas = accionesEstadisticas?.vencidas || 0;
  const accionesCompletadas = accionesEstadisticas?.completadas || 0;
  const accionesPorcentaje =
    accionesTotales > 0 ? Math.round((accionesCompletadas / accionesTotales) * 100) : 0;

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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          {resumenTargets && resumenTargets.sucursalesConTarget > 0 && (
            <Box 
              onClick={onToggleTargets}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                minWidth: 200,
                px: 2,
                py: 1,
                borderRadius: '12px',
                backgroundColor: theme.palette.grey[50],
                border: `1px solid ${theme.palette.grey[200]}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.grey[100],
                  borderColor: theme.palette.grey[300],
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>
                    Target Mensual
                  </Typography>
                  <Chip
                    label={`${resumenTargets.completadas} / ${resumenTargets.target}`}
                    size="small"
                    color={getColorTarget(resumenTargets.porcentaje)}
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      pointerEvents: 'none'
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(resumenTargets.porcentaje, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3
                    }
                  }}
                  color={getColorTarget(resumenTargets.porcentaje)}
                />
              </Box>
              
            </Box>
            
          )}

          {(accionesLoading || accionesTotales > 0) && (
            <Box 
              onClick={accionesLoading ? undefined : onToggleAcciones}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                minWidth: 200,
                px: 2,
                py: 1,
                borderRadius: '12px',
                backgroundColor: theme.palette.grey[50],
                border: `1px solid ${theme.palette.grey[200]}`,
                cursor: accionesLoading ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: accionesLoading ? 0.6 : 1,
                '&:hover': accionesLoading ? {} : {
                  backgroundColor: theme.palette.grey[100],
                  borderColor: theme.palette.grey[300],
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>
                    Acciones Req.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Chip
                      label={
                        accionesLoading
                          ? 'Cargando...'
                          : `${accionesPendientes} pend.`
                      }
                      size="small"
                      color={accionesVencidas > 0 ? 'error' : accionesPendientes > 0 ? 'warning' : 'default'}
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        pointerEvents: 'none'
                      }}
                    />
                    {!accionesLoading && (
                      <Chip
                        label={`${accionesCompletadas}/${accionesTotales}`}
                        size="small"
                        color={accionesCompletadas > 0 ? 'success' : 'default'}
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={accionesLoading ? 0 : accionesPorcentaje}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3
                    }
                  }}
                  color={accionesCompletadas > 0 ? 'success' : 'warning'}
                />
              </Box>
            </Box>
          )}
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

