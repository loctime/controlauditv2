import React from "react";
import { Box, Chip } from "@mui/material";
import {
  FactCheck as AuditIcon,
  CheckCircle as CompletedIcon,
  PendingActions as PendingIcon,
  ReportProblem as AlertIcon
} from "@mui/icons-material";

const chipStyles = {
  fontWeight: 600,
  fontSize: "0.85rem",
  px: 1.5,
  py: 0.5
};

export default function AuditSummaryChips({
  total = 0,
  completed = 0,
  pending = 0,
  nonConformities = 0
}) {
  const chips = [
    {
      label: `Auditorías: ${total}`,
      icon: <AuditIcon fontSize="small" />,
      sx: {
        borderColor: "#1d4ed8",
        color: "#1d4ed8",
        backgroundColor: "rgba(59,130,246,0.08)"
      }
    },
    {
      label: `Completadas: ${completed}`,
      icon: <CompletedIcon fontSize="small" />,
      sx: {
        borderColor: "#16a34a",
        color: "#15803d",
        backgroundColor: "rgba(74,222,128,0.15)"
      }
    },
    {
      label: `Pendientes: ${pending}`,
      icon: <PendingIcon fontSize="small" />,
      sx: {
        borderColor: "#f97316",
        color: "#c2410c",
        backgroundColor: "rgba(251,191,36,0.18)"
      }
    },
    {
      label: `No conformes: ${nonConformities}`,
      icon: <AlertIcon fontSize="small" />,
      sx: {
        borderColor: nonConformities > 0 ? "#dc2626" : "#9ca3af",
        color: nonConformities > 0 ? "#b91c1c" : "#4b5563",
        backgroundColor:
          nonConformities > 0 ? "rgba(248,113,113,0.18)" : "rgba(148,163,184,0.18)"
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
      {chips.map(({ label, icon, sx }) => (
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
      ))}
    </Box>
  );
}

