import React, { useState, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  Grid,
  Stack,
  Chip,
  Divider,
  Button,
  Collapse,
  IconButton
} from "@mui/material";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TimerIcon from "@mui/icons-material/Timer";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Link as RouterLink } from "react-router-dom";

const SUMMARY_ITEMS = [
  {
    key: "ocupacionales",
    label: "Enfermedades ocupacionales",
    icon: <HealthAndSafetyIcon fontSize="small" sx={{ color: "#15803d" }} />,
    color: "#22c55e",
    background: "#f0fdf4",
    border: "#bbf7d0"
  },
  {
    key: "activas",
    label: "Ausencias activas",
    icon: <PendingActionsIcon fontSize="small" sx={{ color: "#f97316" }} />,
    color: "#f97316",
    background: "#fff7ed",
    border: "#fed7aa"
  },
  {
    key: "diasPerdidosTotales",
    label: "Días perdidos (ausencias)",
    icon: <TimerIcon fontSize="small" sx={{ color: "#2563eb" }} />,
    color: "#2563eb",
    background: "#eff6ff",
    border: "#bfdbfe",
    formatter: (value) => `${value || 0}`
  }
];

const formatEstado = (estado) => {
  if (!estado) return "Abierto";
  const texto = estado.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// Tipos predefinidos que no deben mostrarse como tarjetas personalizadas
const TIPOS_PREDEFINIDOS = new Set([
  "ocupacional",
  "covid",
  "accidente",
  "licencia",
  "enfermedad",
  "otro"
]);

export default function DashboardOccupationalHealthCard({ saludOcupacional }) {
  const [casosExpandidos, setCasosExpandidos] = useState(false);
  const resumen = saludOcupacional?.resumen || {};
  const casosRecientes =
    saludOcupacional?.casosRecientes || saludOcupacional?.casos || [];
  const todosLosCasos = saludOcupacional?.casos || [];

  // Crear mapeo de tipo (clave) -> etiqueta desde los casos
  const tipoToEtiqueta = useMemo(() => {
    const mapa = {};
    todosLosCasos.forEach((caso) => {
      if (caso.tipo && caso.etiqueta && !mapa[caso.tipo]) {
        mapa[caso.tipo] = caso.etiqueta;
      }
    });
    return mapa;
  }, [todosLosCasos]);

  // Obtener tipos personalizados (que no son predefinidos) con conteo > 0
  const tiposPersonalizados = useMemo(() => {
    const porTipo = resumen.porTipo || {};
    return Object.entries(porTipo)
      .filter(([tipo, conteo]) => {
        // Solo incluir tipos personalizados con conteo > 0
        return (
          !TIPOS_PREDEFINIDOS.has(tipo) &&
          typeof conteo === "number" &&
          conteo > 0
        );
      })
      .map(([tipo, conteo]) => ({
        tipo,
        etiqueta: tipoToEtiqueta[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1),
        conteo
      }))
      .sort((a, b) => b.conteo - a.conteo); // Ordenar por conteo descendente
  }, [resumen.porTipo, tipoToEtiqueta]);

  const hasSummary =
    Object.keys(resumen).length > 0 &&
    (resumen.ocupacionales ||
      resumen.covid ||
      resumen.activas ||
      resumen.diasPerdidosTotales ||
      tiposPersonalizados.length > 0);

  const hasCases = Array.isArray(casosRecientes) && casosRecientes.length > 0;

  if (!hasSummary && !hasCases) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 2,
          backgroundColor: "white",
          borderRadius: "16px",
          border: "1px solid #e5e7eb"
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#111827",
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          🏥 SALUD OCUPACIONAL
        </Typography>
        <Box
          sx={{
            py: 3,
            px: 2,
            borderRadius: "12px",
            backgroundColor: "#f9fafb",
            border: "1px dashed #d1d5db",
            textAlign: "center"
          }}
        >
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            No se registran ausencias o enfermedades en el período seleccionado.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        backgroundColor: "white",
        borderRadius: "16px",
        border: "1px solid #e5e7eb"
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "#111827",
          mb: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1
        }}
      >
        🏥 SALUD OCUPACIONAL
      </Typography>

      {hasSummary && (
        <Grid container spacing={1.25}>
          {SUMMARY_ITEMS.map((item) => {
            const value = resumen[item.key] || 0;
            const displayValue =
              typeof item.formatter === "function"
                ? item.formatter(value)
                : value;

            // Solo mostrar "Enfermedades ocupacionales" si hay valor > 0
            if (item.key === "ocupacionales" && value === 0) {
              return null;
            }

            return (
              <Grid item xs={12} sm={6} key={item.key}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: item.background,
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${item.border}`
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {item.icon}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: item.color }}
                  >
                    {displayValue}
                  </Typography>
                </Box>
              </Grid>
            );
          })}

          {/* Mostrar tipos personalizados */}
          {tiposPersonalizados.map((tipoPersonalizado) => (
            <Grid item xs={12} sm={6} key={`personalizado-${tipoPersonalizado.tipo}`}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#f9fafb",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <HealthAndSafetyIcon
                    fontSize="small"
                    sx={{ color: "#6b7280" }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {tipoPersonalizado.etiqueta}
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#374151" }}
                >
                  {tipoPersonalizado.conteo}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {hasCases && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: "#4b5563", fontWeight: 600 }}
            >
              Casos recientes
            </Typography>
            <IconButton
              size="small"
              onClick={() => setCasosExpandidos(!casosExpandidos)}
              sx={{
                color: "#4b5563",
                "&:hover": {
                  backgroundColor: "#f3f4f6"
                }
              }}
            >
              {casosExpandidos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={casosExpandidos}>
            <Stack spacing={1.25}>
              {casosRecientes.slice(0, 5).map((caso) => (
                <Box
                  key={caso.id}
                  sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    backgroundColor: "#f9fafb",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "#111827" }}
                    >
                      {caso.empleadoNombre || "Empleado sin nombre"}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${caso.diasEnPeriodo || 0} día${
                        (caso.diasEnPeriodo || 0) === 1 ? "" : "s"
                      }`}
                      sx={{
                        backgroundColor: "#e0f2fe",
                        color: "#1d4ed8",
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: "#1f2937" }}>
                    {caso.etiqueta || "Ausencia registrada"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280" }}>
                    Estado: {formatEstado(caso.estado)}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Button
              component={RouterLink}
              to="/salud-ocupacional"
              sx={{
                mt: 2,
                textTransform: "none",
                fontWeight: 600,
                alignSelf: "flex-start"
              }}
            >
              Gestionar ausencias
            </Button>
          </Collapse>
        </>
      )}
    </Paper>
  );
}


