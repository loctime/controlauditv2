import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess, BugReport } from '@mui/icons-material';

const SimpleOfflineDebug = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const loadDebugInfo = async () => {
    try {
      if (!window.indexedDB) {
        setDebugInfo({ error: 'IndexedDB no disponible' });
        return;
      }

      // Importar la función de inicialización
      const { initOfflineDatabase } = await import('../../services/offlineDatabase');
      
      // Inicializar la base de datos si no existe
      let db;
      try {
        db = await initOfflineDatabase();
      } catch (error) {
        console.warn('Error al inicializar base de datos:', error);
        // Intentar abrir sin inicialización
        const request = indexedDB.open('controlaudit_offline_v1', 2);
        db = await new Promise((resolve, reject) => {
          request.onsuccess = function(event) {
            resolve(event.target.result);
          };
          request.onerror = function(event) {
            reject(event.target.error);
          };
        });
      }

      const cachedData = await new Promise((resolve) => {
        if (!db.objectStoreNames.contains('settings')) {
          resolve({ error: 'Base de datos no inicializada' });
          return;
        }
          
          const transaction = db.transaction(['settings'], 'readonly');
          const store = transaction.objectStore('settings');
          
          store.get('complete_user_cache').onsuccess = function(e) {
            const cached = e.target.result;
            if (cached && cached.value && cached.value.userProfile) {
              const userProfile = cached.value.userProfile;
              resolve({
                hasCache: true,
                clienteAdminId: userProfile.clienteAdminId || 'NULL',
                creadoPorEmail: userProfile.email || 'NULL',
                uid: userProfile.uid,
                role: userProfile.role
              });
            } else {
              resolve({ error: 'No hay usuario en cache' });
            }
          };
          
          store.get('complete_user_cache').onerror = function() {
            resolve({ error: 'Error al obtener cache' });
          };
        };
        
        request.onerror = function() {
          resolve({ error: 'Error al abrir IndexedDB' });
        };
      });
      
      setDebugInfo(cachedData);
    } catch (error) {
      setDebugInfo({ error: error.message });
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  if (!debugInfo) return null;

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        position: 'fixed', 
        bottom: 10, 
        right: 10, 
        zIndex: 9999,
        maxWidth: 250,
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 1,
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport color="primary" fontSize="small" />
          <Typography variant="caption" fontWeight="bold">
            Debug
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Box sx={{ p: 1, pt: 0 }}>
          {debugInfo.error ? (
            <Typography variant="caption" color="error">
              {debugInfo.error}
            </Typography>
          ) : (
            <Box>
              <Typography variant="caption" display="block" gutterBottom>
                <strong>ClienteAdminId:</strong> 
                <Chip 
                  label={debugInfo.clienteAdminId} 
                  size="small" 
                  color={debugInfo.clienteAdminId !== 'NULL' ? 'success' : 'error'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              
              <Typography variant="caption" display="block" gutterBottom>
                <strong>CreadoPorEmail:</strong> 
                <Chip 
                  label={debugInfo.creadoPorEmail} 
                  size="small" 
                  color={debugInfo.creadoPorEmail !== 'NULL' ? 'success' : 'error'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              
              <Typography variant="caption" display="block" gutterBottom>
                <strong>UID:</strong> {debugInfo.uid}
              </Typography>
              
              <Typography variant="caption" display="block" gutterBottom>
                <strong>Role:</strong> {debugInfo.role}
              </Typography>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  cursor: 'pointer', 
                  color: 'primary.main',
                  textDecoration: 'underline',
                  display: 'block',
                  textAlign: 'right',
                  mt: 1
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  loadDebugInfo();
                }}
              >
                Actualizar
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SimpleOfflineDebug;
