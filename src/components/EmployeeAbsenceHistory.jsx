import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from "@mui/material";

const formatDate = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export default function EmployeeAbsenceHistory({ rows, loading, error }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return (rows || []).slice(start, end);
  }, [rows, page, rowsPerPage]);

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
        Historial de ausencias por empleado
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No se pudo cargar el historial completo.
        </Alert>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Empleado</TableCell>
            <TableCell>Empresa</TableCell>
            <TableCell>Sucursal</TableCell>
            <TableCell>Fecha inicio</TableCell>
            <TableCell>Fecha fin</TableCell>
            <TableCell align="right">Días</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Certificado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9}>
                <Typography variant="body2" sx={{ py: 2, color: "#6b7280", textAlign: "center" }}>
                  Cargando historial...
                </Typography>
              </TableCell>
            </TableRow>
          ) : paginatedRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <Typography variant="body2" sx={{ py: 2, color: "#6b7280", textAlign: "center" }}>
                  No hay ausencias para mostrar.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.empleadoNombre || "-"}</TableCell>
                <TableCell>{row.empresaNombre || "-"}</TableCell>
                <TableCell>{row.sucursalNombre || "-"}</TableCell>
                <TableCell>{formatDate(row.fechaInicio)}</TableCell>
                <TableCell>{formatDate(row.fechaFin)}</TableCell>
                <TableCell align="right">{row.diasAusente || 0}</TableCell>
                <TableCell>{row.tipo || "-"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.estado || "abierta"}
                    color={(row.estado || "").toLowerCase().includes("cerr") ? "success" : "info"}
                  />
                </TableCell>
                <TableCell>
                  {row.certificado?.available ? (
                    row.certificado?.url ? (
                      <Button
                        size="small"
                        variant="outlined"
                        href={row.certificado.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Disponible
                      </Button>
                    ) : (
                      <Chip size="small" color="success" label="Disponible" variant="outlined" />
                    )
                  ) : (
                    <Chip size="small" label="Sin dato" variant="outlined" />
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={(rows || []).length}
        page={page}
        onPageChange={(_event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Filas por página"
      />
    </Paper>
  );
}


