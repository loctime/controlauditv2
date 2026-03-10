import {
  Alert,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";

const StatCard = ({ label, value }) => (
  <Paper
    elevation={0}
    sx={{
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      p: 2,
      backgroundColor: "#f9fafb"
    }}
  >
    <Typography variant="caption" sx={{ color: "#6b7280" }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}>
      {value}
    </Typography>
  </Paper>
);

export default function AbsenteeismDashboard({
  kpis,
  rankingEmpleados,
  rankingSucursales,
  loading,
  error
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: { xs: 2, md: 3 },
        borderRadius: "16px",
        border: "1px solid #e5e7eb"
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mb: 2 }}>
        Dashboard de Ausentismo
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No se pudieron cargar algunas métricas de ausentismo.
        </Alert>
      )}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Empleados ausentes hoy"
            value={loading ? "..." : kpis?.empleadosAusentesHoy ?? 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Días perdidos del mes"
            value={loading ? "..." : kpis?.diasPerdidosMes ?? 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Promedio duración ausencia"
            value={loading ? "..." : `${kpis?.promedioDuracionAusencia ?? 0} días`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total ausencias del mes"
            value={loading ? "..." : kpis?.totalAusenciasMes ?? 0}
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#374151", mb: 1 }}>
            Top 10 empleados por días ausente
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell align="right">Días</TableCell>
                <TableCell align="right">Ausencias</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rankingEmpleados || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2" sx={{ py: 1.5, color: "#6b7280" }}>
                      Sin datos para ranking de empleados.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (rankingEmpleados || []).map((item) => (
                  <TableRow key={item.empleadoId || item.empleadoNombre}>
                    <TableCell>{item.empleadoNombre}</TableCell>
                    <TableCell align="right">{item.totalDiasAusente}</TableCell>
                    <TableCell align="right">{item.totalAusencias}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#374151", mb: 1 }}>
            Ranking de sucursales por días ausente
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sucursal</TableCell>
                <TableCell align="right">Días</TableCell>
                <TableCell align="right">Ausencias</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rankingSucursales || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2" sx={{ py: 1.5, color: "#6b7280" }}>
                      Sin datos para ranking de sucursales.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (rankingSucursales || []).map((item) => (
                  <TableRow key={item.sucursalId || item.sucursalNombre}>
                    <TableCell>
                      <Stack spacing={0}>
                        <Typography variant="body2">{item.sucursalNombre}</Typography>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          {item.empresaNombre || ""}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{item.totalDiasAusente}</TableCell>
                    <TableCell align="right">{item.totalAusencias}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </Paper>
  );
}
