import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#2563eb", "#f97316"];

function AuditClassificationTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, value, payload: dataPoint } = payload[0];

  return (
    <Box
      sx={{
        bgcolor: "rgba(17, 24, 39, 0.85)",
        color: "white",
        p: 1.25,
        borderRadius: 1,
        minWidth: 160
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
      <Typography variant="body2">Hallazgos: {value}</Typography>
      <Typography variant="body2">
        Participación: {dataPoint.percentage}%
      </Typography>
    </Box>
  );
}

export default function AuditClassificationPie({ stats }) {
  const { total, data } = useMemo(() => {
    const totalClasificaciones = stats?.total || 0;
    if (!stats || totalClasificaciones === 0) {
      return {
        total: 0,
        data: []
      };
    }

    const buildEntry = (name, value, color) => ({
      name,
      value,
      color,
      percentage: totalClasificaciones
        ? Number(((value / totalClasificaciones) * 100).toFixed(1))
        : 0
    });

    return {
      total: totalClasificaciones,
      data: [
        buildEntry("Condición", stats.condicion || 0, COLORS[0]),
        buildEntry("Actitud", stats.actitud || 0, COLORS[1])
      ].filter((entry) => entry.value > 0)
    };
  }, [stats]);

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        border: "1px solid #e5e7eb"
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#111827",
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          🥧 Condición vs Actitud
        </Typography>

        {total > 0 && data.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {data.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<AuditClassificationTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Divider />

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1
              }}
            >
              {data.map((entry) => (
                <Chip
                  key={entry.name}
                  label={`${entry.name}: ${entry.value} (${entry.percentage}%)`}
                  size="small"
                  sx={{
                    fontWeight: 500,
                    backgroundColor: `${entry.color}20`,
                    color: entry.color
                  }}
                />
              ))}
              <Chip
                label={`Total clasificaciones: ${total}`}
                size="small"
                sx={{
                  fontWeight: 500,
                  backgroundColor: "#11182710",
                  color: "#111827"
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
              color: "#6b7280"
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Sin clasificaciones registradas
            </Typography>
            <Typography variant="caption">
              Aún no se han marcado condiciones o actitudes en el período
              seleccionado.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

