import React, { useState, useMemo } from 'react';
import { Box, ButtonBase, Menu, MenuItem, Typography } from '@mui/material';

const truncate = (s, n) => {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '.' : s;
};

// Selector compacto dual (Empresa + Sucursal) representado como dos triángulos
// que se cruzan en la misma caja. Cada triángulo es un área clickable
// independiente (vía clip-path) que abre su propio Menu.
// Pensado para el navbar móvil, donde el espacio es crítico.
export default function TriangularEmpresaSucursalSelector({
  empresas = [],
  sucursales = [],
  selectedEmpresa,
  selectedSucursal,
  onEmpresaChange,
  onSucursalChange,
  width = 110,
  height = 60,
}) {
  const [anchorEmpresa, setAnchorEmpresa] = useState(null);
  const [anchorSucursal, setAnchorSucursal] = useState(null);

  const empresaLabel = useMemo(() => {
    if (!selectedEmpresa || selectedEmpresa === 'todas') return 'Todas';
    const found = empresas.find((e) => e.id === selectedEmpresa);
    return truncate(found?.nombre || 'Empresa', 9);
  }, [selectedEmpresa, empresas]);

  const sucursalLabel = useMemo(() => {
    if (!sucursales || sucursales.length === 0) return 'Sin suc.';
    if (!selectedSucursal || selectedSucursal === 'todas') return 'Todas';
    const found = sucursales.find((s) => s.id === selectedSucursal);
    return truncate(found?.nombre || 'Sucursal', 9);
  }, [selectedSucursal, sucursales]);

  const sucursalesDisabled = !sucursales || sucursales.length === 0;

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        flexShrink: 0,
        borderRadius: 0,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
      }}
    >
      {/* Triángulo inferior-izquierdo: EMPRESA */}
      <ButtonBase
        onClick={(e) => setAnchorEmpresa(e.currentTarget)}
        aria-label="Seleccionar empresa"
        sx={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
          backgroundColor: 'rgba(255,255,255,0.96)',
          '&:hover': { backgroundColor: '#fff' },
        }}
      >
        <Typography
          sx={{
            position: 'absolute',
            bottom: 3,
            left: 5,
            fontSize: '0.68rem',
            fontWeight: 700,
            lineHeight: 1,
            color: '#1976d2',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {empresaLabel}
        </Typography>
      </ButtonBase>

      {/* Triángulo superior-derecho: SUCURSAL */}
      <ButtonBase
        onClick={(e) => !sucursalesDisabled && setAnchorSucursal(e.currentTarget)}
        disabled={sucursalesDisabled}
        aria-label="Seleccionar sucursal"
        sx={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          backgroundColor: sucursalesDisabled ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.80)',
          '&:hover': { backgroundColor: sucursalesDisabled ? 'rgba(255,255,255,0.55)' : '#fff' },
        }}
      >
        <Typography
          sx={{
            position: 'absolute',
            top: 3,
            right: 5,
            fontSize: '0.68rem',
            fontWeight: 700,
            lineHeight: 1,
            color: sucursalesDisabled ? '#9ca3af' : '#1976d2',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {sucursalLabel}
        </Typography>
      </ButtonBase>

      {/* Diagonal divisoria puramente visual */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(to top right, transparent calc(50% - 0.6px), rgba(25, 118, 210, 0.5) 50%, transparent calc(50% + 0.6px))',
        }}
      />

      {/* Menu Empresa */}
      <Menu
        anchorEl={anchorEmpresa}
        open={Boolean(anchorEmpresa)}
        onClose={() => setAnchorEmpresa(null)}
        MenuListProps={{ dense: true }}
      >
        <MenuItem
          selected={!selectedEmpresa || selectedEmpresa === 'todas'}
          onClick={() => {
            onEmpresaChange && onEmpresaChange('todas');
            setAnchorEmpresa(null);
          }}
        >
          <Typography sx={{ fontWeight: 600, fontStyle: 'italic', fontSize: '0.85rem' }}>
            Todas las empresas
          </Typography>
        </MenuItem>
        {empresas.map((e) => (
          <MenuItem
            key={e.id}
            selected={selectedEmpresa === e.id}
            onClick={() => {
              onEmpresaChange && onEmpresaChange(e.id);
              setAnchorEmpresa(null);
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.nombre}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Menu Sucursal */}
      <Menu
        anchorEl={anchorSucursal}
        open={Boolean(anchorSucursal)}
        onClose={() => setAnchorSucursal(null)}
        MenuListProps={{ dense: true }}
      >
        <MenuItem
          selected={!selectedSucursal || selectedSucursal === 'todas'}
          onClick={() => {
            onSucursalChange && onSucursalChange('todas');
            setAnchorSucursal(null);
          }}
        >
          <Typography sx={{ fontWeight: 600, fontStyle: 'italic', fontSize: '0.85rem' }}>
            Todas las sucursales
          </Typography>
        </MenuItem>
        {sucursales?.map((s) => (
          <MenuItem
            key={s.id}
            selected={selectedSucursal === s.id}
            onClick={() => {
              onSucursalChange && onSucursalChange(s.id);
              setAnchorSucursal(null);
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.nombre}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
