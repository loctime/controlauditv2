import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Typography,
  Button
} from '@mui/material';
import {
  ReportProblem as AccidenteIcon,
  Warning as IncidenteIcon,
  Image as ImageIcon,
  People as PeopleIcon
} from '@mui/icons-material';

/**
 * Tabla de accidentes
 */
const AccidentesTabla = React.memo(({
  accidentes,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onVerDetalle,
  onCerrarAccidente
}) => {
  const accidentesPaginados = accidentes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getEstadoColor = (estado) => estado === 'abierto' ? 'error' : 'success';

  const getTipoIcon = (tipo) => tipo === 'accidente' ? <AccidenteIcon /> : <IncidenteIcon />;

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Involucrados</TableCell>
              <TableCell>Imágenes</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accidentesPaginados.map((accidente) => (
              <TableRow key={accidente.id} hover>
                <TableCell>
                  <Chip
                    icon={getTipoIcon(accidente.tipo)}
                    label={accidente.tipo}
                    color={accidente.tipo === 'accidente' ? 'error' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {accidente.fechaHora?.toDate?.()?.toLocaleString() || 'N/A'}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {accidente.descripcion}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon fontSize="small" />
                    <Typography variant="body2">
                      {accidente.tipo === 'accidente'
                        ? accidente.empleadosInvolucrados?.length || 0
                        : accidente.testigos?.length || 0}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {accidente.imagenes?.length > 0 && (
                    <Chip
                      icon={<ImageIcon />}
                      label={accidente.imagenes.length}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={accidente.estado}
                    color={getEstadoColor(accidente.estado)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => onVerDetalle(accidente)}>
                      Ver
                    </Button>
                    {accidente.estado === 'abierto' && (
                      <Button
                        size="small"
                        color="success"
                        onClick={() => onCerrarAccidente(accidente.id)}
                      >
                        Cerrar
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={accidentes.length}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Filas por página:"
      />
    </>
  );
});

AccidentesTabla.displayName = 'AccidentesTabla';

export default AccidentesTabla;

