import React from "react";
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";

const severidadColorMap = {
  error: "error.main",
  warning: "warning.main",
  info: "info.main"
};

export default function DashboardAlertsPopover({
  open,
  anchorEl,
  onClose,
  alertas
}) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right"
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right"
      }}
    >
      <Box sx={{ p: 2, minWidth: 360, maxWidth: 420 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <WarningIcon sx={{ color: "warning.main" }} />
          Alertas y Pendientes ({alertas.length})
        </Typography>
        <List>
          {alertas.map((alerta, index) => (
            <ListItem
              key={`${alerta.titulo}-${index}`}
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: index < alertas.length - 1 ? "1px solid" : "none",
                borderColor: "divider"
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box sx={{ color: severidadColorMap[alerta.severidad] }}>
                  {alerta.icono}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: severidadColorMap[alerta.severidad]
                    }}
                  >
                    {alerta.titulo}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {alerta.descripcion}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Popover>
  );
}

