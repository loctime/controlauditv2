import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import { cerrarAusencia, updateAusencia } from "../../../../services/ausenciasService";

const formatDate = (value) => {
  if (!value) return "-";
  const date =
    value instanceof Date
      ? value
      : value?.toDate
        ? value.toDate()
        : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const statusColor = (estado) => {
  const normalized = (estado || "").toLowerCase();
  if (normalized.includes("cerr")) return "success";
  if (normalized.includes("progreso")) return "warning";
  return "info";
};

const tipoColor = (tipo) => {
  const normalized = (tipo || "").toLowerCase();
  if (normalized.includes("covid")) return "error";
  if (normalized.includes("ocupac")) return "success";
  if (normalized.includes("licen")) return "info";
  if (normalized.includes("accident")) return "warning";
  return "default";
};

export default function AusenciasTable({ ausencias, onRecargar }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAusencia, setSelectedAusencia] = useState(null);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return ausencias.slice(start, end);
  }, [ausencias, page, rowsPerPage]);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCerrarAusencia = async (ausencia) => {
    await cerrarAusencia(ausencia.id);
    if (onRecargar) {
      await onRecargar();
    }
  };

  const handleReabrirAusencia = async (ausencia) => {
    await updateAusencia(ausencia.id, {
      estado: "abierta",
      fechaFin: null
    });
    if (onRecargar) {
      await onRecargar();
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: "16px" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
              <TableCell>Observaciones</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" sx={{ py: 2, textAlign: "center" }}>
                    No hay ausencias registradas con los filtros seleccionados.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((ausencia) => {
                const estado = (ausencia.estado || "abierto").toLowerCase();
                const tipo =
                  ausencia.tipo ||
                  ausencia.categoria ||
                  ausencia.clasificacion ||
                  "Enfermedad";
                return (
                  <TableRow key={ausencia.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {ausencia.empleadoNombre || "Empleado no asignado"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          {ausencia.sucursalNombre || ausencia.sucursalId || "Sin sucursal"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        color={tipoColor(tipo)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={estado.charAt(0).toUpperCase() + estado.slice(1)}
                        color={statusColor(estado)}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>{formatDate(ausencia.fechaInicio)}</TableCell>
                    <TableCell>{formatDate(ausencia.fechaFin)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 240,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {ausencia.observaciones || "Sin observaciones"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Ver detalle">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedAusencia(ausencia)}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {estado.includes("cerr") ? (
                          <Tooltip title="Reabrir caso">
                            <IconButton
                              size="small"
                              onClick={() => handleReabrirAusencia(ausencia)}
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Cerrar caso">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleCerrarAusencia(ausencia)}
                            >
                              <DoneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={ausencias.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página"
        />
      </TableContainer>

      <Dialog
        open={Boolean(selectedAusencia)}
        onClose={() => setSelectedAusencia(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Detalle de ausencia
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
              Empleado
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {selectedAusencia?.empleadoNombre || "Empleado no asignado"}
            </Typography>

            <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
              Tipo
            </Typography>
            <Typography variant="body1">
              {selectedAusencia?.tipo || "Sin especificar"}
            </Typography>

            <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
              Estado
            </Typography>
            <Typography variant="body1">
              {selectedAusencia?.estado || "Abierto"}
            </Typography>

            <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
              Período
            </Typography>
            <Typography variant="body1">
              {formatDate(selectedAusencia?.fechaInicio)} -{" "}
              {formatDate(selectedAusencia?.fechaFin)}
            </Typography>

            <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
              Observaciones
            </Typography>
            <Typography variant="body2">
              {selectedAusencia?.observaciones || "Sin observaciones registradas"}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<CloseIcon />}
            onClick={() => setSelectedAusencia(null)}
            sx={{ textTransform: "none" }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


