import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';

/**
 * Header de tabla de empresas
 */
const EmpresaTableHeader = React.memo(() => (
  <TableHead>
    <TableRow>
      <TableCell scope="col"></TableCell>
      <TableCell scope="col"><strong>Empresa</strong></TableCell>
      <TableCell scope="col"><strong>Propietario</strong></TableCell>
      <TableCell scope="col"><strong>Dirección</strong></TableCell>
      <TableCell scope="col"><strong>Teléfono</strong></TableCell>
      <TableCell scope="col"><strong>Sucursales</strong></TableCell>
      <TableCell scope="col"><strong>Empleados</strong></TableCell>
      <TableCell scope="col"><strong>Capacitaciones</strong></TableCell>
      <TableCell scope="col"><strong>Accidentes</strong></TableCell>
      <TableCell scope="col"><strong>Acciones</strong></TableCell>
    </TableRow>
  </TableHead>
));

EmpresaTableHeader.displayName = 'EmpresaTableHeader';

export default EmpresaTableHeader;





