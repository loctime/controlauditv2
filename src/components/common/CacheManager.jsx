import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Storage,
  Refresh,
  Delete,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import {
  getCacheStats,
  refreshCompleteCache,
  clearCompleteUserCache,
  hasCompleteCache
} from '../../services/completeOfflineCache';
import { useAuth } from '../context/AuthContext';
import { useConnectivity } from '../../hooks/useConnectivity';

const CacheManager = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { userProfile } = useAuth();
  const { isOnline } = useConnectivity();
  
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState(null);

  // Cargar estadísticas del cache
  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error cargando estadísticas de cache:', error);
    }
  };

  const handleRefreshCache = async () => {
    if (!isOnline) {
      alert('Necesitas conexión a internet para actualizar el cache');
      return;
    }

    setLoading(true);
    try {
      await refreshCompleteCache();
      await loadCacheStats();
      alert('Cache actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando cache:', error);
      alert('Error actualizando cache: ' + error.message);
    }
    setLoading(false);
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await clearCompleteUserCache();
      await loadCacheStats();
      alert('Cache limpiado correctamente');
    } catch (error) {
      console.error('Error limpiando cache:', error);
      alert('Error limpiando cache: ' + error.message);
    }
    setLoading(false);
    setDialogOpen(false);
  };

  const openDialog = (actionType) => {
    setAction(actionType);
    setDialogOpen(true);
  };

  const getCacheStatusColor = () => {
    if (!cacheStats?.hasCache) return 'error';
    if (cacheStats.age > 3) return 'warning';
    return 'success';
  };

  const getCacheStatusIcon = () => {
    if (!cacheStats?.hasCache) return <Warning />;
    if (cacheStats.age > 3) return <Warning />;
    return <CheckCircle />;
  };

  if (!cacheStats) {
    return (
      <Card>
        <CardContent>
          <Typography>Cargando información de cache...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Storage sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6">
            Cache Offline Completo
          </Typography>
        </Box>

        {/* Estado del cache */}
        <Box display="flex" alignItems="center" mb={2}>
          <Chip
            icon={getCacheStatusIcon()}
            label={cacheStats.hasCache ? 'Disponible' : 'No disponible'}
            color={getCacheStatusColor()}
            size="small"
            sx={{ mr: 1 }}
          />
          {cacheStats.hasCache && (
            <Chip
              label={`${cacheStats.age} días`}
              variant="outlined"
              size="small"
              color={cacheStats.age > 3 ? 'warning' : 'success'}
            />
          )}
        </Box>

        {/* Estadísticas */}
        {cacheStats.hasCache && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Datos cacheados:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip label={`${cacheStats.empresas} empresas`} size="small" />
              <Chip label={`${cacheStats.formularios} formularios`} size="small" />
              <Chip label={`${cacheStats.sucursales} sucursales`} size="small" />
              <Chip label={`${cacheStats.auditorias} auditorías`} size="small" />
            </Box>
          </Box>
        )}

        {/* Información */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            El cache completo permite usar la aplicación sin conexión a internet.
            Incluye empresas, formularios, sucursales y auditorías.
          </Typography>
        </Alert>

        {/* Acciones */}
        <Box display="flex" gap={1} flexWrap="wrap">
          {isOnline && (
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefreshCache}
              disabled={loading}
              size="small"
            >
              Actualizar Cache
            </Button>
          )}
          
          {cacheStats.hasCache && (
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={() => openDialog('clear')}
              disabled={loading}
              size="small"
              color="error"
            >
              Limpiar Cache
            </Button>
          )}
        </Box>

        {/* Progress */}
        {loading && (
          <Box mt={2}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {action === 'refresh' ? 'Actualizando cache...' : 'Limpiando cache...'}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Dialog de confirmación */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirmar Acción</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres limpiar todo el cache offline?
            Esto eliminará todos los datos cacheados y requerirá conexión a internet
            para volver a cargar la información.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleClearCache} 
            color="error"
            disabled={loading}
          >
            Limpiar Cache
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CacheManager;
