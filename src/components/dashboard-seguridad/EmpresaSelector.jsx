import React from "react";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Chip
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";

export default function EmpresaSelector({
  empresas,
  selectedEmpresa,
  onEmpresaChange
}) {
  if (!empresas || empresas.length === 0) {
    return (
      <Box
        sx={{
          p: 2,
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
          border: "1px solid #ffc107"
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No hay empresas disponibles
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        backgroundColor: "white",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <BusinessIcon sx={{ color: "#22a7f0" }} />
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "#6b7280",
            fontWeight: 500,
            mb: 0.5
          }}
        >
          Empresa
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={selectedEmpresa || "todas"}
            onChange={(e) => onEmpresaChange(e.target.value)}
            aria-label="Seleccionar empresa"
            sx={{
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none"
              },
              "& .MuiSelect-select": {
                padding: "4px 0",
                fontWeight: 600,
                color: "#111827"
              }
            }}
          >
            <MenuItem value="todas">
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, fontStyle: "italic" }}
              >
                Todas las empresas
              </Typography>
            </MenuItem>
            {empresas.map((empresa) => (
              <MenuItem key={empresa.id} value={empresa.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {empresa.nombre}
                  </Typography>
                  {empresa.codigo && (
                    <Chip
                      label={empresa.codigo}
                      size="small"
                      sx={{
                        height: "20px",
                        fontSize: "0.7rem",
                        backgroundColor: "#f3f4f6"
                      }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

