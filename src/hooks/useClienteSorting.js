import { useState, useMemo } from 'react';

export const useClienteSorting = (clientes) => {
  const [orderBy, setOrderBy] = useState('creadoPor');
  const [order, setOrder] = useState('desc');

  // Función para manejar el ordenamiento
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Función para ordenar los clientes
  const sortedClientes = useMemo(() => {
    const sorted = [...clientes].sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'nombre':
          aValue = (a.nombre || a.displayName || '').toLowerCase();
          bValue = (b.nombre || b.displayName || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'plan':
          aValue = (a.plan || 'estandar').toLowerCase();
          bValue = (b.plan || 'estandar').toLowerCase();
          break;
        case 'usuarios':
          aValue = a.usuariosActivos || 0;
          bValue = b.usuariosActivos || 0;
          break;
        case 'semaforo':
          // Ordenar por prioridad: rojo (1), amarillo (2), verde (3)
          const getSemaforoPriority = (semaforo) => {
            switch (semaforo) {
              case 'rojo': return 1;
              case 'amarillo': return 2;
              case 'verde': return 3;
              default: return 4;
            }
          };
          aValue = getSemaforoPriority(a.semaforo);
          bValue = getSemaforoPriority(b.semaforo);
          break;
        case 'estado':
          aValue = (a.estadoPago || 'al_dia').toLowerCase();
          bValue = (b.estadoPago || 'al_dia').toLowerCase();
          break;
        case 'vencimiento':
          aValue = a.fechaVencimiento ? (a.fechaVencimiento.toDate ? a.fechaVencimiento.toDate() : new Date(a.fechaVencimiento)) : new Date(0);
          bValue = b.fechaVencimiento ? (b.fechaVencimiento.toDate ? b.fechaVencimiento.toDate() : new Date(b.fechaVencimiento)) : new Date(0);
          break;
        case 'demo':
          aValue = a.esDemo ? 1 : 0;
          bValue = b.esDemo ? 1 : 0;
          break;
        case 'creadoPor':
          aValue = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt) : new Date(0);
          bValue = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt) : new Date(0);
          break;
        default:
          aValue = a[orderBy] || '';
          bValue = b[orderBy] || '';
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [clientes, orderBy, order]);

  return {
    orderBy,
    order,
    handleRequestSort,
    sortedClientes
  };
};
