import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton
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
    <Tooltip title={indicatorState.tooltip}>
      <IconButton
        size="small"
        sx={{
          p: 0.5,
          minWidth: 'auto',
          width: 24,
          height: 24,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)'
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
  );
};

export default OfflineIndicatorMobile;
