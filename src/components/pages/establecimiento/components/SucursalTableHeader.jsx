import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';

/**
 * Header de tabla de sucursales
 */
const SucursalTableHeader = React.memo(() => (
  <TableHead>
    <TableRow>
      <TableCell><strong>Nombre</strong></TableCell>
      <TableCell><strong>Dirección</strong></TableCell>
      <TableCell><strong>Teléfono</strong></TableCell>
      <TableCell align="center"><strong>Horas/Semana</strong></TableCell>
      <TableCell align="center"><strong>Empleados</strong></TableCell>
      <TableCell align="center"><strong>Capacitaciones</strong></TableCell>
      <TableCell align="center"><strong>Accidentes</strong></TableCell>
      <TableCell align="center"><strong>Acciones Req.</strong></TableCell>
      <TableCell align="center"><strong>Target Mes</strong></TableCell>
      <TableCell align="center"><strong>Acciones</strong></TableCell>
    </TableRow>
  </TableHead>
));

SucursalTableHeader.displayName = 'SucursalTableHeader';

export default SucursalTableHeader;
