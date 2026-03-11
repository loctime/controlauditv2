import { useMemo, useState } from "react";
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import EditIcon from "@mui/icons-material/Edit";
import { cerrarAusencia, updateAusencia } from "../../../../services/ausenciasService";
import { useAuth } from '@/components/context/AuthContext';

const ORIGEN_LABELS = {
  manual: 'Manual',
  accidente: 'Accidente',
  incidente: 'Incidente',
  salud_ocupacional: 'Salud ocupacional',
  licencia_medica: 'Licencia medica',
  permiso: 'Permiso',
  enfermedad: 'Enfermedad'
};

const normalizeStatus = (estado) => {
  const normalized = String(estado || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (normalized.includes('cerr') || normalized.includes('finaliz') || normalized.includes('resuelt')) {
    return 'cerrada';
  }
  if (normalized.includes('progreso')) {
    return 'en_progreso';
  }
  return 'abierta';
};

const statusLabel = (estado) => {
  const canonical = normalizeStatus(estado);
  if (canonical === 'en_progreso') return 'En progreso';
  if (canonical === 'cerrada') return 'Cerrada';
  return 'Abierta';
};

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
  const normalized = normalizeStatus(estado);
  if (normalized === 'cerrada') return "success";
  if (normalized === 'en_progreso') return "warning";
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

export default function AusenciasTable({
  ausencias,
  onRecargar,
  onOpenDetail,
  onEditAusencia
}) {
  const { userProfile } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [ausenciaPorCerrar, setAusenciaPorCerrar] = useState(null);
  const [cerrando, setCerrando] = useState(false);

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

  const handleConfirmarCierre = async () => {
    if (!ausenciaPorCerrar || !userProfile?.uid) return;
    try {
      setCerrando(true);
      await cerrarAusencia(ausenciaPorCerrar.id, {}, userProfile);
      if (onRecargar) {
        await onRecargar();
      }
    } finally {
      setCerrando(false);
      setAusenciaPorCerrar(null);
    }
  };

  const handleReabrirAusencia = async (ausencia) => {
    if (!userProfile?.uid) return;
    await updateAusencia(ausencia.id, {
      estado: "abierta",
      fechaFin: null
    }, userProfile);
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
              <TableCell>Origen</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
              <TableCell>Archivos</TableCell>
              <TableCell>Observaciones</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography variant="body2" sx={{ py: 2, textAlign: "center" }}>
                    No hay ausencias registradas con los filtros seleccionados.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((ausencia) => {
                const estado = normalizeStatus(ausencia.estado);
                const tipo =
                  ausencia.tipo ||
                  ausencia.categoria ||
                  ausencia.clasificacion ||
                  "Enfermedad";
                const filesCount = typeof ausencia.filesCount === 'number' ? Math.max(0, ausencia.filesCount) : 0;
                const origen = String(ausencia.origen || 'manual').toLowerCase();
                const origenLabel = ORIGEN_LABELS[origen] || origen;
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
                      <Stack spacing={0.5}>
                        <Chip
                          size="small"
                          label={origenLabel}
                          variant="outlined"
                        />
                        {ausencia.origenId && (
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            ID: {ausencia.origenId}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabel(estado)}
                        color={statusColor(estado)}
                        variant="filled"
                        sx={
                          statusColor(estado) === "info"
                            ? {
                                backgroundColor: "#01579b",
                                color: "#ffffff",
                                "& .MuiChip-label": {
                                  color: "#ffffff",
                                  fontWeight: 500
                                }
                              }
                            : {}
                        }
                      />
                    </TableCell>
                    <TableCell>{formatDate(ausencia.fechaInicio)}</TableCell>
                    <TableCell>{formatDate(ausencia.fechaFin)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={filesCount}
                        variant={filesCount > 0 ? 'filled' : 'outlined'}
                        color={filesCount > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {ausencia.observaciones || ausencia.motivo || "Sin observaciones"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Ver detalle">
                          <IconButton
                            size="small"
                            onClick={() => onOpenDetail?.(ausencia)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onEditAusencia?.(ausencia)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {estado === 'cerrada' ? (
                          <Tooltip title="Reabrir caso">
                            <IconButton
                              size="small"
                              onClick={() => handleReabrirAusencia(ausencia)}
                            >
                              <RestartAltIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Cerrar caso">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setAusenciaPorCerrar(ausencia)}
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
          labelRowsPerPage="Filas por pagina"
        />
      </TableContainer>

      <Dialog
        open={Boolean(ausenciaPorCerrar)}
        onClose={() => (cerrando ? null : setAusenciaPorCerrar(null))}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar cierre</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Quieres cerrar el caso de ausencia para{' '}
            <strong>{ausenciaPorCerrar?.empleadoNombre || "este empleado"}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAusenciaPorCerrar(null)}
            disabled={cerrando}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmarCierre}
            disabled={cerrando}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {cerrando ? "Cerrando..." : "Cerrar caso"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
