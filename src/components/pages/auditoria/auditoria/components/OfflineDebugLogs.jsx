import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Collapse, Chip, Alert } from '@mui/material';
import { ExpandMore, ExpandLess, BugReport, Close } from '@mui/icons-material';
import { useAuth } from '../../../../context/AuthContext';

// Array global para almacenar logs
window.offlineDebugLogs = window.offlineDebugLogs || [];

// Cargar logs desde localStorage al iniciar (para funcionar offline)
const loadLogsFromStorage = () => {
  try {
    const savedLogs = localStorage.getItem('offline_debug_logs');
    if (savedLogs) {
      const parsed = JSON.parse(savedLogs);
      window.offlineDebugLogs = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn('Error cargando logs desde localStorage:', e);
  }
  return [];
};

// Guardar logs en localStorage (para persistir offline)
const saveLogsToStorage = (logs) => {
  try {
    // Mantener solo los últimos 50 logs para no llenar localStorage
    const logsToSave = logs.slice(-50);
    localStorage.setItem('offline_debug_logs', JSON.stringify(logsToSave));
  } catch (e) {
    console.warn('Error guardando logs en localStorage:', e);
  }
};

const OfflineDebugLogs = () => {
  const { userProfile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Cargar logs guardados al iniciar
    const savedLogs = loadLogsFromStorage();
    if (savedLogs.length > 0) {
      window.offlineDebugLogs = savedLogs;
      setLogs(savedLogs);
    }

    // Interceptar console.log para capturar logs relacionados con offline
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (level, ...args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      // Solo capturar logs relacionados con offline/empresas/cache
      if (
        message.includes('[DEBUG Auditoria]') ||
        message.includes('cache') ||
        message.includes('offline') ||
        message.includes('empresas') ||
        message.includes('IndexedDB') ||
        message.includes('localStorage') ||
        message.includes('getCompleteUserCache') ||
        message.includes('saveCompleteUserCache') ||
        message.includes('getOfflineDatabase') ||
        message.includes('Settings store') ||
        message.includes('complete_user_cache')
      ) {
        const logEntry = {
          id: Date.now() + Math.random(),
          level,
          message,
          timestamp: new Date().toLocaleTimeString()
        };
        
        window.offlineDebugLogs.push(logEntry);
        
        // Mantener solo los últimos 50 logs
        if (window.offlineDebugLogs.length > 50) {
          window.offlineDebugLogs.shift();
        }
        
        // Guardar en localStorage para persistir offline
        saveLogsToStorage(window.offlineDebugLogs);
        
        setLogs([...window.offlineDebugLogs]);
      }
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', ...args);
    };

    // Cargar logs existentes
    setLogs([...window.offlineDebugLogs]);

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  if (!visible) return null;

  const errorLogs = logs.filter(l => l.level === 'error');
  const warnLogs = logs.filter(l => l.level === 'warn');
  const infoLogs = logs.filter(l => l.level === 'log');

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        left: { xs: 16, sm: 'auto' },
        maxWidth: { xs: 'calc(100% - 32px)', sm: 500 },
        maxHeight: expanded ? '70vh' : 'auto',
        zIndex: 9999,
        boxShadow: 6,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport fontSize="small" />
          <Typography variant="subtitle2" fontWeight="bold">
            Debug Offline
          </Typography>
          {errorLogs.length > 0 && (
            <Chip
              label={errorLogs.length}
              size="small"
              color="error"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
          {warnLogs.length > 0 && (
            <Chip
              label={warnLogs.length}
              size="small"
              color="warning"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <Box>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ color: 'inherit' }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setVisible(false)}
            sx={{ color: 'inherit' }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            maxHeight: '60vh',
            overflowY: 'auto',
            p: 1,
            bgcolor: 'background.default'
          }}
        >
          {logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No hay logs aún...
            </Typography>
          ) : (
            logs.slice().reverse().map((log) => (
              <Box
                key={log.id}
                sx={{
                  mb: 0.5,
                  p: 1,
                  borderRadius: 1,
                  bgcolor:
                    log.level === 'error'
                      ? 'error.light'
                      : log.level === 'warn'
                      ? 'warning.light'
                      : 'grey.100',
                  borderLeft: `3px solid ${
                    log.level === 'error'
                      ? 'error.main'
                      : log.level === 'warn'
                      ? 'warning.main'
                      : 'primary.main'
                  }`
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">
                    {log.timestamp}
                  </Typography>
                  <Chip
                    label={log.level}
                    size="small"
                    color={log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'default'}
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0
                  }}
                >
                  {log.message}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Collapse>

      {errorLogs.length > 0 && (
        <Alert severity="error" sx={{ m: 1, mt: 0 }}>
          {errorLogs.length} error(es) encontrado(s)
        </Alert>
      )}
    </Paper>
  );
};

export default OfflineDebugLogs;

