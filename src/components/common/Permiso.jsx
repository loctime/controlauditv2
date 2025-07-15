import React from 'react';
import { usePermiso } from '../hooks/usePermiso';

/**
 * Componente para renderizar children solo si el usuario tiene el permiso indicado.
 * @param {string} permiso - Nombre del permiso (ej: 'puedeCompartirFormularios')
 * @param {ReactNode} children - Elementos a renderizar si tiene permiso
 * @param {ReactNode} fallback - Elemento alternativo si no tiene permiso
 */
const Permiso = ({ permiso, children, fallback = null }) => {
  const tienePermiso = usePermiso(permiso);
  // Debug log
  console.debug(`[Permiso] Render para '${permiso}':`, tienePermiso);
  return tienePermiso ? children : fallback;
};

export default Permiso; 