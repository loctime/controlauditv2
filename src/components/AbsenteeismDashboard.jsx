import {
  Alert,
  Chip,
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

const EmptyCell = ({ colSpan, message }) => (
  <TableRow>
    <TableCell colSpan={colSpan}>
      <Typography variant="body2" sx={{ py: 1.5, color: "#6b7280" }}>
        {message}
      </Typography>
    </TableCell>
  </TableRow>
);

export default function AbsenteeismDashboard({
  kpis,
  rankingEmpleados,
  rankingSucursales,
  topBradford = [],
  ausenciasByMotivo = [],
  monthlyTrend = [],
  organizationalKpis = {},
  alertsResumen = {},
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
          No se pudieron cargar algunas metricas de ausentismo.
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
            label="Dias perdidos del mes"
            value={loading ? "..." : kpis?.diasPerdidosMes ?? 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Promedio duracion ausencia"
            value={loading ? "..." : `${kpis?.promedioDuracionAusencia ?? 0} dias`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total ausencias del mes"
            value={loading ? "..." : kpis?.totalAusenciasMes ?? 0}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Tasa de ausentismo"
            value={loading ? "..." : `${organizationalKpis?.tasaAusentismo ?? 0}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Dias perdidos / empleado"
            value={loading ? "..." : organizationalKpis?.diasPerdidosPorEmpleado ?? 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Alertas activas"
            value={loading ? "..." : alertsResumen?.activas ?? alertsResumen?.total ?? 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e5e7eb", borderRadius: "12px", p: 2, backgroundColor: "#f9fafb" }}
          >
            <Typography variant="caption" sx={{ color: "#6b7280" }}>
              Resumen alertas
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap" }}>
              <Chip size="small" label={`Bradford: ${alertsResumen?.bradford_alto ?? 0}`} />
              <Chip size="small" label={`Reincidencia: ${alertsResumen?.reincidencia ?? 0}`} />
              <Chip size="small" label={`Prolongada: ${alertsResumen?.ausencia_prolongada ?? 0}`} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#374151", mb: 1 }}>
            Top 10 empleados por dias ausente
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell align="right">Dias</TableCell>
                <TableCell align="right">Ausencias</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rankingEmpleados || []).length === 0 ? (
                <EmptyCell colSpan={3} message="Sin datos para ranking de empleados." />
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
            Ranking de sucursales por dias ausente
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sucursal</TableCell>
                <TableCell align="right">Dias</TableCell>
                <TableCell align="right">Ausencias</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rankingSucursales || []).length === 0 ? (
                <EmptyCell colSpan={3} message="Sin datos para ranking de sucursales." />
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

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#374151", mb: 1 }}>
            Top Bradford
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Riesgo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(topBradford || []).length === 0 ? (
                <EmptyCell colSpan={3} message="Sin datos Bradford en el periodo." />
              ) : (
                (topBradford || []).slice(0, 10).map((item) => (
                  <TableRow key={`br-${item.empleadoId}`}>
                    <TableCell>{item.empleadoNombre}</TableCell>
                    <TableCell align="right">{item.bradfordScore}</TableCell>
                    <TableCell align="right">{item.bradfordRisk}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#374151", mb: 1 }}>
            Ausencias por motivo
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Motivo</TableCell>
                <TableCell align="right">Cant.</TableCell>
                <TableCell align="right">Dias</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(ausenciasByMotivo || []).length === 0 ? (
                <EmptyCell colSpan={3} message="Sin datos por motivo." />
              ) : (
                (ausenciasByMotivo || []).slice(0, 10).map((item) => (
                  <TableRow key={`mot-${item.motivo}`}>
                    <TableCell>{item.motivo}</TableCell>
                    <TableCell align="right">{item.cantidad}</TableCell>
                    <TableCell align="right">{item.diasPerdidos}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#374151", mb: 1 }}>
            Tendencia mensual
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mes</TableCell>
                <TableCell align="right">Ausencias</TableCell>
                <TableCell align="right">Dias</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(monthlyTrend || []).length === 0 ? (
                <EmptyCell colSpan={3} message="Sin tendencia disponible." />
              ) : (
                (monthlyTrend || []).slice(-6).map((item) => (
                  <TableRow key={`tr-${item.key}`}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell align="right">{item.ausencias}</TableCell>
                    <TableCell align="right">{item.diasPerdidos}</TableCell>
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
