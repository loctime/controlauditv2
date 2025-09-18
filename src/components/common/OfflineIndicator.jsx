import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  LinearProgress,
  Typography,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert
} from '@mui/material';
import {
  WifiOff,
  Wifi,
  Sync,
  SyncProblem,
  CheckCircle,
  CloudOff,
  CloudDone,
  Storage,
  PhotoCamera,
  Assignment
} from '@mui/icons-material';
import { useConnectivity } from '../../hooks/useConnectivity';
import autoSaveService from '../../components/pages/auditoria/auditoria/services/autoSaveService';
import syncQueueService from '../../services/syncQueue';
import { formatBytes } from '../../services/offlineDatabase';

/**
 * Componente indicador de estado offline/online
 * Muestra el estado de conectividad y progreso de sincronización
 */
const OfflineIndicator = ({ userProfile }) => {
  const { isOnline, connectionType, timeOffline } = useConnectivity();
  const [offlineStats, setOfflineStats] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Actualizar estadísticas periódicamente
  useEffect(() => {
    const updateStats = async () => {
      if (userProfile?.uid) {
        try {
          const stats = await autoSaveService.getOfflineStats();
          const queue = await syncQueueService.getQueueStats();
          setOfflineStats(stats);
          setQueueStats(queue);
        } catch (error) {
          console.error('Error al obtener estadísticas offline:', error);
        }
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, [userProfile?.uid]);

  // Listener para cambios en el procesamiento
  useEffect(() => {
    const removeListener = syncQueueService.addListener((event, data) => {
      if (event === 'processing_started') {
        setIsProcessing(true);
      } else if (event === 'processing_stopped') {
        setIsProcessing(false);
      }
    });

    return removeListener;
  }, []);

  // Función para sincronizar manualmente
  const handleManualSync = async () => {
    try {
      setIsProcessing(true);
      await syncQueueService.processQueue();
    } catch (error) {
      console.error('Error en sincronización manual:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para limpiar datos fallidos
  const handleClearFailed = async () => {
    try {
      await syncQueueService.clearFailedItems();
      // Actualizar estadísticas
      const stats = await autoSaveService.getOfflineStats();
      setOfflineStats(stats);
    } catch (error) {
      console.error('Error al limpiar datos fallidos:', error);
    }
  };

  // Determinar el estado y color del indicador
  const getIndicatorState = () => {
    if (!isOnline) {
      return {
        color: 'error',
        icon: <WifiOff />,
        text: 'Sin conexión',
        tooltip: `Offline desde hace ${Math.floor(timeOffline / 60000)} minutos`
      };
    }

    if (isProcessing) {
      return {
        color: 'warning',
        icon: <Sync />,
        text: 'Sincronizando...',
        tooltip: 'Sincronizando datos offline'
      };
    }

    if (queueStats && queueStats.total > 0) {
      return {
        color: 'info',
        icon: <CloudOff />,
        text: `${queueStats.total} pendientes`,
        tooltip: `${queueStats.total} items en cola de sincronización`
      };
    }

    return {
      color: 'success',
      icon: <CloudDone />,
      text: 'Sincronizado',
      tooltip: 'Todos los datos están sincronizados'
    };
  };

  const indicatorState = getIndicatorState();

  return (
    <>
      {/* Indicador principal */}
      <Tooltip title={indicatorState.tooltip}>
        <Chip
          icon={indicatorState.icon}
          label={indicatorState.text}
          color={indicatorState.color}
          size="small"
          variant="outlined"
          onClick={() => setShowDetails(true)}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: `${indicatorState.color}.light`,
              color: 'white'
            }
          }}
        />
      </Tooltip>

      {/* Barra de progreso si está sincronizando */}
      {isProcessing && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <LinearProgress 
            color="primary" 
            sx={{ 
              height: 2,
              borderRadius: 1
            }} 
          />
        </Box>
      )}

      {/* Diálogo de detalles */}
      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Storage />
            <Typography variant="h6">
              Estado de Sincronización
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Estado de conectividad */}
          <Box mb={2}>
            <Alert 
              severity={isOnline ? 'success' : 'error'}
              icon={isOnline ? <Wifi /> : <WifiOff />}
            >
              {isOnline ? 'Conectado' : 'Sin conexión'}
              {connectionType !== 'unknown' && ` (${connectionType})`}
            </Alert>
          </Box>

          {/* Estadísticas de auditorías */}
          {offlineStats && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Auditorías Offline
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Assignment color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total" 
                    secondary={offlineStats.auditorias.total} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Sync color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Pendientes" 
                    secondary={offlineStats.auditorias.pending} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sincronizadas" 
                    secondary={offlineStats.auditorias.synced} 
                  />
                </ListItem>
                {offlineStats.auditorias.failed > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <SyncProblem color="error" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Fallidas" 
                      secondary={offlineStats.auditorias.failed} 
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}

          {/* Estadísticas de fotos */}
          {offlineStats && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
                Fotos Offline
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PhotoCamera color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total" 
                    secondary={offlineStats.fotos.total} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Storage color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Tamaño" 
                    secondary={formatBytes(offlineStats.fotos.totalSize)} 
                  />
                </ListItem>
              </List>
            </Box>
          )}

          {/* Estadísticas de cola */}
          {queueStats && queueStats.total > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                <Sync sx={{ mr: 1, verticalAlign: 'middle' }} />
                Cola de Sincronización
              </Typography>
              <List dense>
                {Object.entries(queueStats.byType).map(([type, count]) => (
                  <ListItem key={type}>
                    <ListItemIcon>
                      {type === 'CREATE_AUDITORIA' ? <Assignment /> : <PhotoCamera />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={type.replace('_', ' ')} 
                      secondary={count} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Información adicional */}
          {!isOnline && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Las auditorías se guardan localmente y se sincronizarán automáticamente 
                cuando se restaure la conexión.
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Cerrar
          </Button>
          {queueStats && queueStats.total > 0 && isOnline && (
            <Button 
              onClick={handleManualSync}
              disabled={isProcessing}
              startIcon={<Sync />}
              variant="contained"
            >
              Sincronizar Ahora
            </Button>
          )}
          {queueStats && queueStats.byRetries && Object.keys(queueStats.byRetries).some(retries => parseInt(retries) >= 5) && (
            <Button 
              onClick={handleClearFailed}
              color="error"
              startIcon={<SyncProblem />}
            >
              Limpiar Fallidos
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OfflineIndicator;
