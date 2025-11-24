import { useState, useMemo } from 'react';

/**
 * Hook para ordenamiento de accidentes
 */
export const useAccidentesSorting = (accidentes) => {
  const [orderBy, setOrderBy] = useState('fechaHora');
  const [order, setOrder] = useState('desc');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedAccidentes = useMemo(() => {
    return [...accidentes].sort((a, b) => {
      // Primero separar por estado: abiertos primero, cerrados después
      const aAbierto = a.estado === 'abierto';
      const bAbierto = b.estado === 'abierto';
      
      if (aAbierto !== bAbierto) {
        return aAbierto ? -1 : 1; // Abiertos primero
      }
      
      // Si tienen el mismo estado, ordenar por el campo seleccionado
      let aValue, bValue;

      switch (orderBy) {
        case 'fechaHora':
          aValue = a.fechaHora?.toDate?.() || new Date(a.fechaHora || 0);
          bValue = b.fechaHora?.toDate?.() || new Date(b.fechaHora || 0);
          break;
        case 'estado':
          aValue = (a.estado || '').toLowerCase();
          bValue = (b.estado || '').toLowerCase();
          break;
        case 'tipo':
          aValue = (a.tipo || '').toLowerCase();
          bValue = (b.tipo || '').toLowerCase();
          break;
        case 'descripcion':
          aValue = (a.descripcion || '').toLowerCase();
          bValue = (b.descripcion || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [accidentes, orderBy, order]);

  return { orderBy, order, handleRequestSort, sortedAccidentes };
};

