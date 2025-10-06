import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, IconButton, Collapse, Alert } from '@mui/material';
import { ExpandMore, ExpandLess, BugReport, Save } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const AuditoriaDebugInfo = () => {
  const { userProfile } = useAuth();
  const [debugInfo, setDebugInfo] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSupermax = !!userProfile && userProfile.role === 'supermax';

  // Solo mostrar para supermax
  console.log('[AuditoriaDebugInfo] userProfile:', userProfile);
  console.log('[AuditoriaDebugInfo] role:', userProfile?.role);
  console.log('[AuditoriaDebugInfo] should show:', userProfile?.role === 'supermax');
  
  // Render condicional post-hooks

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      if (!window.indexedDB) {
        setDebugInfo({ error: 'IndexedDB no disponible' });
        setLoading(false);
        return;
      }

      // Intentar abrir la base de datos directamente
      let db;
      try {
        const request = indexedDB.open('controlaudit_offline_v1', 2);
        
        db = await new Promise((resolve, reject) => {
          request.onsuccess = function(event) {
            resolve(event.target.result);
          };
          
          request.onerror = function(event) {
            reject(event.target.error);
          };
          
          request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings', { keyPath: 'key' });
            }
          };
        });
      } catch (error) {
        console.error('Error al abrir base de datos:', error);
        throw error;
      }

      // Obtener información del cache del usuario
      const userCache = await new Promise((resolve) => {
        if (!db.objectStoreNames.contains('settings')) {
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        store.get('complete_user_cache').onsuccess = function(e) {
          const cached = e.target.result;
          if (cached && cached.value && cached.value.userProfile) {
            resolve(cached.value.userProfile);
          } else {
            resolve(null);
          }
        };
        
        store.get('complete_user_cache').onerror = function() {
          resolve(null);
        };
      });

      // Obtener auditorías pendientes de sincronización
      const pendingAuditorias = await new Promise((resolve) => {
        if (!db.objectStoreNames.contains('auditorias')) {
          resolve([]);
          return;
        }
        
        const transaction = db.transaction(['auditorias'], 'readonly');
        const store = transaction.objectStore('auditorias');
        
        store.getAll().onsuccess = function(e) {
          const auditorias = e.target.result || [];
          const pending = auditorias.filter(a => a.status === 'pending_sync');
          resolve(pending);
        };
        
        store.getAll().onerror = function() {
          resolve([]);
        };
      });

      setDebugInfo({
        userCache,
        pendingAuditorias,
        hasUserCache: !!userCache,
        hasPendingAuditorias: pendingAuditorias.length > 0
      });
    } catch (error) {
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  if (!isSupermax) return null;
  if (!debugInfo && !loading) {
    return null;
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        position: 'fixed', 
        bottom: 10, 
        left: 10, 
        zIndex: 9999,
        maxWidth: 280,
        backgroundColor: '#fff3e0',
        border: '1px solid #ff9800'
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
          <Save color="warning" fontSize="small" />
          <Typography variant="caption" fontWeight="bold">
            Debug Auditoría
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Box sx={{ p: 1, pt: 0 }}>
          {loading ? (
            <Typography variant="caption">Cargando...</Typography>
          ) : debugInfo?.error ? (
            <Alert severity="error" sx={{ p: 1 }}>
              <Typography variant="caption">{debugInfo.error}</Typography>
            </Alert>
          ) : (
            <Box>
              <Typography variant="caption" fontWeight="bold" gutterBottom>
                Estado del Cache:
              </Typography>
              
              <Typography variant="caption" display="block" gutterBottom>
                <strong>Usuario en Cache:</strong> 
                <Chip 
                  label={debugInfo.hasUserCache ? '✅ Sí' : '❌ No'} 
                  size="small" 
                  color={debugInfo.hasUserCache ? 'success' : 'error'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              
              {debugInfo.userCache && (
                <Box sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                    Datos del Usuario:
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>ClienteAdminId:</strong> 
                    <Chip 
                      label={debugInfo.userCache.clienteAdminId || 'NULL'} 
                      size="small" 
                      color={debugInfo.userCache.clienteAdminId ? 'success' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Email:</strong> 
                    <Chip 
                      label={debugInfo.userCache.email || 'NULL'} 
                      size="small" 
                      color={debugInfo.userCache.email ? 'success' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              )}
              
              <Typography variant="caption" display="block" gutterBottom sx={{ mt: 1 }}>
                <strong>Auditorías Pendientes:</strong> 
                <Chip 
                  label={debugInfo.pendingAuditorias?.length || 0} 
                  size="small" 
                  color={debugInfo.hasPendingAuditorias ? 'warning' : 'default'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              
              {debugInfo.hasPendingAuditorias && (
                <Alert severity="warning" sx={{ p: 1, mt: 1 }}>
                  <Typography variant="caption">
                    Hay {debugInfo.pendingAuditorias.length} auditoría(s) esperando sincronización
                  </Typography>
                </Alert>
              )}
              
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    cursor: 'pointer', 
                    color: 'primary.main',
                    textDecoration: 'underline'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    loadDebugInfo();
                  }}
                >
                  Actualizar
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AuditoriaDebugInfo;
