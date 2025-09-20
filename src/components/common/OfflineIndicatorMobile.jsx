import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  WifiOff,
  Wifi,
  Sync,
  CloudOff,
  CloudDone
} from '@mui/icons-material';
import { useConnectivity } from '../../hooks/useConnectivity';
import syncQueueService from '../../services/syncQueue';

/**
 * Componente indicador offline compacto para móvil
 * Versión simplificada del indicador principal
 */
const OfflineIndicatorMobile = ({ userProfile }) => {
  const { isOnline, timeOffline } = useConnectivity();
  const [queueStats, setQueueStats] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Actualizar estadísticas de cola
  useEffect(() => {
    const updateStats = async () => {
      if (userProfile?.uid) {
        try {
          const queue = await syncQueueService.getQueueStats();
          setQueueStats(queue);
        } catch (error) {
          console.error('Error al obtener estadísticas de cola:', error);
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
    if (!isOnline) {
      setSnackbarMessage('Sin conexión a internet');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      return;
    }

    if (isProcessing) {
      setSnackbarMessage('Ya se está sincronizando...');
      setSnackbarSeverity('info');
      setShowSnackbar(true);
      return;
    }

    try {
      setIsProcessing(true);
      setSnackbarMessage('Iniciando sincronización...');
      setSnackbarSeverity('info');
      setShowSnackbar(true);
      
      await syncQueueService.processQueue();
      
      setSnackbarMessage('Sincronización completada');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      console.error('Error en sincronización manual:', error);
      setSnackbarMessage('Error en sincronización');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determinar el estado y color del indicador
  const getIndicatorState = () => {
    if (!isOnline) {
      return {
        color: 'error',
        icon: <WifiOff sx={{ fontSize: '0.8rem' }} />,
        tooltip: `Sin conexión (${Math.floor(timeOffline / 60000)} min)`
      };
    }

    if (isProcessing) {
      return {
        color: 'warning',
        icon: <Sync sx={{ fontSize: '0.8rem' }} />,
        tooltip: 'Sincronizando...'
      };
    }

    if (queueStats && queueStats.total > 0) {
      return {
        color: 'info',
        icon: <CloudOff sx={{ fontSize: '0.8rem' }} />,
        tooltip: `${queueStats.total} items pendientes`
      };
    }

    return {
      color: 'success',
      icon: <CloudDone sx={{ fontSize: '0.8rem' }} />,
      tooltip: 'Sincronizado'
    };
  };

  const indicatorState = getIndicatorState();

  return (
    <>
      <Tooltip title={indicatorState.tooltip}>
        <IconButton
          size="small"
          onClick={handleManualSync}
          disabled={!isOnline && !queueStats?.total}
          sx={{
            p: 0.5,
            minWidth: 'auto',
            width: 24,
            height: 24,
            cursor: (isOnline || queueStats?.total) ? 'pointer' : 'default',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            },
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed'
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: `${indicatorState.color}.main`,
              color: 'white',
              '&:hover': {
                backgroundColor: `${indicatorState.color}.dark`
              }
            }}
          >
            {indicatorState.icon}
          </Box>
        </IconButton>
      </Tooltip>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicatorMobile;
