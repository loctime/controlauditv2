import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel
} from '@mui/material';
import ClienteRow from './ClienteRow';

const ClienteTable = ({ 
  sortedClientes, 
  orderBy, 
  order, 
  onRequestSort,
  expandedRows,
  onExpandRow,
  operariosPorCliente,
  onEditCliente,
  onConfirmPago,
  onConfirmDemo,
  onToggleActivo,
  onOpenHistorial
}) => {
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Detalles</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'nombre'}
                  direction={orderBy === 'nombre' ? order : 'asc'}
                  onClick={() => onRequestSort('nombre')}
                >
                  Cliente
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? order : 'asc'}
                  onClick={() => onRequestSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'plan'}
                  direction={orderBy === 'plan' ? order : 'asc'}
                  onClick={() => onRequestSort('plan')}
                >
                  Plan
                </TableSortLabel>
              </TableCell>
              <TableCell width="80px">
                <TableSortLabel
                  active={orderBy === 'usuarios'}
                  direction={orderBy === 'usuarios' ? order : 'asc'}
                  onClick={() => onRequestSort('usuarios')}
                >
                  Usuarios
                </TableSortLabel>
              </TableCell>
              <TableCell width="80px">
                <TableSortLabel
                  active={orderBy === 'semaforo'}
                  direction={orderBy === 'semaforo' ? order : 'asc'}
                  onClick={() => onRequestSort('semaforo')}
                >
                  Semaforo
                </TableSortLabel>
              </TableCell>
              <TableCell width="100px">
                <TableSortLabel
                  active={orderBy === 'estado'}
                  direction={orderBy === 'estado' ? order : 'asc'}
                  onClick={() => onRequestSort('estado')}
                >
                  Estado
                </TableSortLabel>
              </TableCell>
              <TableCell width="120px">
                <TableSortLabel
                  active={orderBy === 'vencimiento'}
                  direction={orderBy === 'vencimiento' ? order : 'asc'}
                  onClick={() => onRequestSort('vencimiento')}
                >
                  Vencimiento
                </TableSortLabel>
              </TableCell>
              <TableCell width="80px">
                <TableSortLabel
                  active={orderBy === 'demo'}
                  direction={orderBy === 'demo' ? order : 'asc'}
                  onClick={() => onRequestSort('demo')}
                >
                  Demo
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'creadoPor'}
                  direction={orderBy === 'creadoPor' ? order : 'asc'}
                  onClick={() => onRequestSort('creadoPor')}
                >
                  Creado
                </TableSortLabel>
              </TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedClientes.map((cliente) => (
              <ClienteRow
                key={cliente.id}
                cliente={cliente}
                expanded={expandedRows[cliente.id]}
                operarios={operariosPorCliente[cliente.id] || []}
                onExpand={() => onExpandRow(cliente.id)}
                onEdit={() => onEditCliente(cliente)}
                onConfirmPago={() => onConfirmPago(cliente)}
                onConfirmDemo={() => onConfirmDemo(cliente)}
                onToggleActivo={() => onToggleActivo(cliente)}
                onOpenHistorial={() => onOpenHistorial(cliente)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ClienteTable;
