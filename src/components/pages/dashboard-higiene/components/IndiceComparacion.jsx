import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import IndiceCardCompact from './IndiceCardCompact';

/**
 * Wrapper para IndiceCardCompact que agrega comparación con año anterior
 */
const IndiceComparacion = React.memo(({ 
  titulo,
  valor,
  unidad,
  icono,
  labelChip,
  color,
  descripcion,
  comparacion
}) => {
  // Si no hay comparación, mostrar solo el card normal
  if (!comparacion || !comparacion.tieneComparacion) {
    return (
      <IndiceCardCompact
        titulo={titulo}
        valor={valor}
        unidad={unidad}
        icono={icono}
        labelChip={labelChip}
        color={color}
        descripcion={descripcion}
      />
    );
  }

  // Mapear título a nombre de comparación
  const mapeoTitulo = {
    'Tasa de Ausentismo': 'tasaAusentismo',
    'Índice de Frecuencia': 'indiceFrecuencia',
    'Índice de Incidencia': 'indiceIncidencia',
    'Índice de Gravedad': 'indiceGravedad'
  };

  const nombreComparacion = mapeoTitulo[titulo];
  const comparacionIndice = nombreComparacion ? comparacion[nombreComparacion] : null;

  if (!comparacionIndice || !comparacionIndice.variacion) {
    return (
      <IndiceCardCompact
        titulo={titulo}
        valor={valor}
        unidad={unidad}
        icono={icono}
        labelChip={labelChip}
        color={color}
        descripcion={descripcion}
      />
    );
  }

  const { variacion, anterior } = comparacionIndice;

  // Si es un índice nuevo, mostrar solo el card sin badge
  if (variacion.tipo === 'nuevo') {
    return (
      <IndiceCardCompact
        titulo={titulo}
        valor={valor}
        unidad={unidad}
        icono={icono}
        labelChip={labelChip}
        color={color}
        descripcion={descripcion}
      />
    );
  }

  // Determinar ícono y color según la variación
  let VariacionIcono = Remove;
  let colorVariacion = 'default';
  let textoVariacion = 'Sin cambio';

  if (variacion.tipo === 'mejora') {
    VariacionIcono = TrendingDown; // ↓ mejora (menor valor es mejor para índices)
    colorVariacion = 'success';
    textoVariacion = `Mejora ${variacion.valor}% vs ${comparacion.añoAnterior}`;
  } else if (variacion.tipo === 'empeora') {
    VariacionIcono = TrendingUp; // ↑ empeora (mayor valor es peor)
    colorVariacion = 'error';
    textoVariacion = `Aumenta ${variacion.valor}% vs ${comparacion.añoAnterior}`;
  }

  // Renderizar el card con badge de comparación
  return (
    <Box sx={{ position: 'relative' }}>
      <IndiceCardCompact
        titulo={titulo}
        valor={valor}
        unidad={unidad}
        icono={icono}
        labelChip={labelChip}
        color={color}
        descripcion={descripcion}
      />
      <Chip
        icon={<VariacionIcono />}
        label={textoVariacion}
        color={colorVariacion}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          fontSize: '0.7rem',
          height: 24,
          '& .MuiChip-icon': {
            fontSize: '0.9rem'
          }
        }}
      />
      {anterior !== null && (
        <Box sx={{ mt: 0.5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {comparacion.añoAnterior}: {anterior.toFixed(2)} {unidad}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

IndiceComparacion.displayName = 'IndiceComparacion';

export default IndiceComparacion;

