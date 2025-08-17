import React from 'react';
import { Grid, Avatar, Typography, Box, Chip } from '@mui/material';
import { Person as PersonIcon, Email as EmailIcon } from '@mui/icons-material';

// Utilidad para agrupar permisos por categoría
const agruparPermisos = (permisos) => {
  if (!permisos) return {};
  const categorias = {
    auditorias: [],
    empresas: [],
    usuarios: [],
    sistema: [],
    otros: []
  };
  Object.entries(permisos).forEach(([key, value]) => {
    if (!value) return;
    if (key.includes('Auditorias')) categorias.auditorias.push(key);
    else if (key.includes('Empresas') || key.includes('Sucursales')) categorias.empresas.push(key);
    else if (key.includes('Usuarios') || key.includes('Socios')) categorias.usuarios.push(key);
    else if (key.includes('Sistema') || key.includes('Logs')) categorias.sistema.push(key);
    else categorias.otros.push(key);
  });
  return categorias;
};

const traducirPermiso = (key) => {
  if (key.includes('Crear')) return 'crear';
  if (key.includes('Editar')) return 'editar';
  if (key.includes('Eliminar')) return 'eliminar';
  if (key.includes('Gestionar')) return 'gestionar';
  if (key.includes('Compartir')) return 'compartir';
  if (key.includes('Agregar')) return 'agregar';
  if (key.includes('Ver')) return 'ver';
  return key.replace(/([A-Z])/g, ' $1').toLowerCase();
};

const PerfilHeader = ({ userProfile }) => {
  if (!userProfile) return null;
  // Log de depuración
  console.debug('[PerfilHeader] userProfile:', userProfile);
  return (
    <Grid container alignItems="center" spacing={2} sx={{ m: 0, p: 0, width: '100%', maxWidth: '100%' }}>
      {/* Avatar */}
      <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, p: 0, m: 0 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <PersonIcon fontSize="medium" />
        </Avatar>
      </Grid>
      {/* Info */}
      <Grid item xs={12} md={4} sx={{ p: 0, m: 0 }}>
        <Typography variant="h6" sx={{ mb: 0 }}>{userProfile.displayName}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem', lineHeight: 1.2 }}>
            <EmailIcon sx={{ fontSize: 15, mr: 0.5, verticalAlign: 'middle' }} />
            {userProfile.email}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            Miembro desde: {new Date(userProfile.createdAt?.seconds * 1000).toLocaleDateString()}
          </Typography>
        </Box>
      </Grid>
      {/* Espacio flexible para centrar permisos */}
      <Grid item md={1} sx={{ display: { xs: 'none', md: 'block' }, p: 0, m: 0 }} />
      {/* Permisos agrupados, comienzan en el centro */}
      <Grid item xs={12} md={5} sx={{ p: 0, m: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'flex-start', md: 'flex-start' } }}>
          {(() => {
            const cats = agruparPermisos(userProfile.permisos);
            return Object.entries(cats).filter(([cat, arr]) => arr.length > 0).map(([cat, arr]) => (
              <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'capitalize', minWidth: 70 }}>
                  {cat}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {arr.map((perm, idx) => (
                    <Chip
                      key={perm}
                      label={traducirPermiso(perm)}
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ fontSize: '0.80rem', height: 22 }}
                    />
                  ))}
                </Box>
              </Box>
            ));
          })()}
        </Box>
      </Grid>
    </Grid>
  );
};

export default PerfilHeader; 