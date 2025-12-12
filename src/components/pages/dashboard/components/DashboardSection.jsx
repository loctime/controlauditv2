import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';

/**
 * Componente wrapper para enmarcar secciones del dashboard
 * @param {string} title - Título de la sección
 * @param {React.ReactNode} children - Contenido de la sección
 * @param {string} dataSection - Atributo data-grafico-seccion (opcional)
 * @param {boolean} showTitle - Si mostrar el título en el header (default: true)
 * @param {boolean} removePadding - Si remover el padding interno (para componentes que ya tienen su propio padding)
 */
export default function DashboardSection({ 
  title, 
  children, 
  dataSection,
  showTitle = true,
  removePadding = false,
  sx = {}
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        overflow: 'hidden',
        mb: 2,
        ...sx
      }}
      data-grafico-seccion={dataSection}
    >
      {title && showTitle && (
        <>
          <Box
            sx={{
              px: 3,
              py: 2,
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}
          >
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                color: '#111827',
                fontSize: '1.125rem'
              }}
            >
              {title}
            </Typography>
          </Box>
          <Divider />
        </>
      )}
      <Box sx={removePadding ? {} : { p: 3 }}>
        {children}
      </Box>
    </Paper>
  );
}

