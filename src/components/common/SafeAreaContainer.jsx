import React from 'react';
import { Box } from '@mui/material';
import { useSafeArea, useIsMobile } from '../../hooks/useSafeArea';

/**
 * Componente contenedor que maneja automáticamente las safe areas
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido del contenedor
 * @param {Object} props.sx - Estilos adicionales de MUI
 * @param {boolean} props.fullHeight - Si debe ocupar toda la altura disponible
 * @param {boolean} props.respectSafeArea - Si debe respetar las safe areas (por defecto true)
 */
const SafeAreaContainer = ({ 
  children, 
  sx = {}, 
  fullHeight = false, 
  respectSafeArea = true,
  ...props 
}) => {
  const safeArea = useSafeArea();
  const isMobile = useIsMobile();

  const safeAreaStyles = respectSafeArea && isMobile ? {
    paddingTop: `${safeArea.top}px`,
    paddingBottom: `${safeArea.bottom}px`,
    paddingLeft: `${safeArea.left}px`,
    paddingRight: `${safeArea.right}px`,
    minHeight: fullHeight ? `calc(100vh - ${safeArea.top + safeArea.bottom}px)` : 'auto',
  } : {};

  return (
    <Box
      sx={{
        ...safeAreaStyles,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default SafeAreaContainer;
