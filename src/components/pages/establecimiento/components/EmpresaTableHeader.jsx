import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';

/**
 * Header de tabla de empresas
 */
const EmpresaTableHeader = React.memo(() => (
  <TableHead>
    <TableRow>
      <TableCell></TableCell>
      <TableCell><strong>Empresa</strong></TableCell>
      <TableCell><strong>Propietario</strong></TableCell>
      <TableCell><strong>Dirección</strong></TableCell>
      <TableCell><strong>Teléfono</strong></TableCell>
      <TableCell><strong>Sucursales</strong></TableCell>
      <TableCell><strong>Empleados</strong></TableCell>
      <TableCell><strong>Capacitaciones</strong></TableCell>
      <TableCell><strong>Accidentes</strong></TableCell>
      <TableCell><strong>Acciones</strong></TableCell>
    </TableRow>
  </TableHead>
));

EmpresaTableHeader.displayName = 'EmpresaTableHeader';

export default EmpresaTableHeader;




