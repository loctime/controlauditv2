import React from "react";
import { Box, Chip, Tooltip } from "@mui/material";
import {
  FactCheck as AuditIcon,
  CheckCircle as CompletedIcon,
  PendingActions as PendingIcon,
  ReportProblem as AlertIcon,
  Build as BuildIcon,
  Engineering as EngineeringIcon,
  Psychology as PsychologyIcon,
  Percent as PercentIcon
} from "@mui/icons-material";

const chipStyles = {
  fontWeight: 600,
  fontSize: "0.85rem",
  px: 1.5,
  py: 0.5
};

export default function AuditSummaryChips({
  auditoriasMetrics
}) {
  // Si no hay auditoriasMetrics, usar valores por defecto
  const metrics = auditoriasMetrics || {
    total: 0,
    completadas: 0,
    pendientes: 0,
    auditoriasConMayorNC: 0,
    totalNoConformes: 0,
    totalNecesitaMejora: 0,
    totalCondicion: 0,
    totalActitud: 0
  };

  const chips = [
    {
      label: `Auditorías: ${metrics.total}`,
      icon: <AuditIcon fontSize="small" />,
      tooltip: "Total de auditorías registradas en el período seleccionado",
      sx: {
        borderColor: "#1d4ed8",
        color: "#1d4ed8",
        backgroundColor: "rgba(59,130,246,0.08)"
      }
    },
    {
      label: `Completadas: ${metrics.completadas}`,
      icon: <CompletedIcon fontSize="small" />,
      tooltip: "Auditorías finalizadas y cerradas",
      sx: {
        borderColor: "#16a34a",
        color: "#15803d",
        backgroundColor: "rgba(74,222,128,0.15)"
      }
    },
    {
      label: `Pendientes: ${metrics.pendientes}`,
      icon: <PendingIcon fontSize="small" />,
      tooltip: "Auditorías agendadas o en progreso",
      sx: {
        borderColor: metrics.pendientes > 0 ? "#f97316" : "#9ca3af",
        color: metrics.pendientes > 0 ? "#c2410c" : "#4b5563",
        backgroundColor: metrics.pendientes > 0 ? "rgba(251,191,36,0.18)" : "rgba(148,163,184,0.18)"
      }
    },
    {
      label: `Aud. con mayor % NC: ${metrics.auditoriasConMayorNC || 0}`,
      icon: <PercentIcon fontSize="small" />,
      tooltip: "Auditorías con igual o mayor cantidad de respuestas 'No conforme' que 'Conforme'",
      sx: {
        borderColor: (metrics.auditoriasConMayorNC || 0) > 0 ? "#dc2626" : "#9ca3af",
        color: (metrics.auditoriasConMayorNC || 0) > 0 ? "#b91c1c" : "#4b5563",
        backgroundColor: (metrics.auditoriasConMayorNC || 0) > 0 ? "rgba(248,113,113,0.18)" : "rgba(148,163,184,0.18)"
      }
    },
    {
      label: `Total No conformes: ${metrics.totalNoConformes || 0}`,
      icon: <AlertIcon fontSize="small" />,
      tooltip: "Total de hallazgos 'No conforme' detectados en todas las auditorías",
      sx: {
        borderColor: (metrics.totalNoConformes || 0) > 0 ? "#dc2626" : "#9ca3af",
        color: (metrics.totalNoConformes || 0) > 0 ? "#b91c1c" : "#4b5563",
        backgroundColor: (metrics.totalNoConformes || 0) > 0 ? "rgba(248,113,113,0.18)" : "rgba(148,163,184,0.18)"
      }
    },
    {
      label: `Total Necesita mejora: ${metrics.totalNecesitaMejora || 0}`,
      icon: <BuildIcon fontSize="small" />,
      tooltip: "Total de hallazgos 'Necesita mejora' detectados en todas las auditorías",
      sx: {
        borderColor: (metrics.totalNecesitaMejora || 0) > 0 ? "#f97316" : "#9ca3af",
        color: (metrics.totalNecesitaMejora || 0) > 0 ? "#c2410c" : "#4b5563",
        backgroundColor: (metrics.totalNecesitaMejora || 0) > 0 ? "rgba(251,191,36,0.18)" : "rgba(148,163,184,0.18)"
      }
    },
    {
      label: `Total Condición: ${metrics.totalCondicion || 0}`,
      icon: <EngineeringIcon fontSize="small" />,
      tooltip: "Total de preguntas clasificadas como 'Condición' en todas las auditorías",
      sx: {
        borderColor: "#1d4ed8",
        color: "#1d4ed8",
        backgroundColor: "rgba(59,130,246,0.08)"
      }
    },
    {
      label: `Total Actitud: ${metrics.totalActitud || 0}`,
      icon: <PsychologyIcon fontSize="small" />,
      tooltip: "Total de preguntas clasificadas como 'Actitud' en todas las auditorías",
      sx: {
        borderColor: "#1d4ed8",
        color: "#1d4ed8",
        backgroundColor: "rgba(59,130,246,0.08)"
      }
    }
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        justifyContent: "center"
      }}
    >
      {chips.map(({ label, icon, sx, tooltip }) => {
        const chipComponent = (
          <Chip
            key={label}
            icon={icon}
            label={label}
            variant="outlined"
            sx={{
              ...chipStyles,
              ...sx,
              "& .MuiChip-icon": { color: "inherit" }
            }}
          />
        );

        return tooltip ? (
          <Tooltip key={label} title={tooltip} arrow>
            {chipComponent}
          </Tooltip>
        ) : (
          <React.Fragment key={label}>{chipComponent}</React.Fragment>
        );
      })}
    </Box>
  );
}

