import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess, BugReport } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const OfflineDebugInfo = () => {
  const { userProfile } = useAuth();
  const [debugInfo, setDebugInfo] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSupermax = !!userProfile && userProfile.role === 'supermax';

  // Solo mostrar para supermax
  console.log('[OfflineDebugInfo] userProfile:', userProfile);
  console.log('[OfflineDebugInfo] role:', userProfile?.role);
  console.log('[OfflineDebugInfo] should show:', userProfile?.role === 'supermax');
  
  // Render condicional post-hooks

  const loadDebugInfo = async () => {
    setLoading(true);
    
    // Timeout de seguridad para evitar loading infinito
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setDebugInfo({
        error: 'Timeout al cargar información (15s)',
        hasCache: false
      });
    }, 15000);
    
    try {
      // Verificar si IndexedDB está disponible
      if (!window.indexedDB) {
        setDebugInfo({
          error: 'IndexedDB no disponible',
          hasCache: false
        });
        setLoading(false);
        clearTimeout(timeoutId);
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
            console.log('🔄 Inicializando base de datos offline desde debug...');
            
            // Crear object store 'settings' si no existe
            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings', { keyPath: 'key' });
              console.log('✅ Object store "settings" creado');
            }
            
            // Crear otras object stores básicas
            if (!db.objectStoreNames.contains('auditorias')) {
              const auditoriasStore = db.createObjectStore('auditorias', { keyPath: 'id' });
              auditoriasStore.createIndex('by-updatedAt', 'updatedAt');
              auditoriasStore.createIndex('by-status', 'status');
              auditoriasStore.createIndex('by-userId', 'userId');
            }
            
            console.log('✅ Base de datos offline inicializada desde debug');
          };
        });
      } catch (error) {
        console.error('Error al abrir base de datos:', error);
        throw error;
      }

      const cachedData = await new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains('settings')) {
          resolve({
            error: 'Object store "settings" no existe - Base de datos no inicializada',
            hasCache: false
          });
          return;
        }
        
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        store.get('complete_user_cache').onsuccess = function(e) {
          const cached = e.target.result;
          if (cached && cached.value) {
            const cacheData = cached.value;
            const userProfile = cacheData.userProfile;
            
            resolve({
              hasCache: true,
              cacheTimestamp: new Date(cacheData.timestamp).toLocaleString(),
              cacheAge: Math.round((Date.now() - cacheData.timestamp) / (1000 * 60 * 60 * 24) * 100) / 100,
              userProfile: userProfile ? {
                uid: userProfile.uid,
                email: userProfile.email,
                displayName: userProfile.displayName,
                role: userProfile.role,
                clienteAdminId: userProfile.clienteAdminId,
                clienteAdminIdFallback: userProfile.clienteAdminId || userProfile.uid
              } : null,
              cacheStats: {
                empresas: cacheData.empresas?.length || 0,
                formularios: cacheData.formularios?.length || 0,
                sucursales: cacheData.sucursales?.length || 0,
                auditorias: cacheData.auditorias?.length || 0
              }
            });
          } else {
            resolve({
              error: 'No hay cache completo disponible',
              hasCache: false
            });
          }
        };
        
        store.get('complete_user_cache').onerror = function(e) {
          resolve({
            error: 'Error al obtener cache',
            hasCache: false
          });
        };
      });
      
      setDebugInfo(cachedData);
      setLoading(false);
      clearTimeout(timeoutId);
    } catch (error) {
      setDebugInfo({
        error: `Error: ${error.message}`,
        hasCache: false
      });
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded && !debugInfo) {
      loadDebugInfo();
    }
  };

  if (!isSupermax) return null;
  if (!debugInfo && !loading) {
    return null;
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        position: 'fixed', 
        top: 60, 
        right: 10, 
        zIndex: 9999,
        maxWidth: 300,
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd'
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
        onClick={handleToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport color="primary" fontSize="small" />
          <Typography variant="caption" fontWeight="bold">
            Debug Offline
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          {loading ? (
            <Typography variant="caption">Cargando...</Typography>
          ) : debugInfo?.error ? (
            <Box>
              <Typography variant="caption" color="error">
                {debugInfo.error}
              </Typography>
            </Box>
          ) : debugInfo?.hasCache ? (
            <Box>
              <Typography variant="caption" fontWeight="bold" gutterBottom>
                Cache Status: <Chip label="Disponible" size="small" color="success" />
              </Typography>
              
              <Typography variant="caption" display="block" gutterBottom>
                <strong>Cache Age:</strong> {debugInfo.cacheAge} días
              </Typography>
              
              <Typography variant="caption" display="block" gutterBottom>
                <strong>Timestamp:</strong> {debugInfo.cacheTimestamp}
              </Typography>
              
              {debugInfo.userProfile && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" fontWeight="bold" gutterBottom>
                    User Profile:
                  </Typography>
                  
                  <Typography variant="caption" display="block">
                    <strong>UID:</strong> {debugInfo.userProfile.uid}
                  </Typography>
                  
                  <Typography variant="caption" display="block">
                    <strong>Email:</strong> {debugInfo.userProfile.email}
                  </Typography>
                  
                  <Typography variant="caption" display="block">
                    <strong>Display Name:</strong> {debugInfo.userProfile.displayName}
                  </Typography>
                  
                  <Typography variant="caption" display="block">
                    <strong>Role:</strong> {debugInfo.userProfile.role}
                  </Typography>
                  
                  <Typography variant="caption" display="block" color={debugInfo.userProfile.clienteAdminId ? 'success.main' : 'warning.main'}>
                    <strong>ClienteAdminId:</strong> {debugInfo.userProfile.clienteAdminId || 'NULL'}
                  </Typography>
                  
                  <Typography variant="caption" display="block" color={debugInfo.userProfile.clienteAdminId ? 'success.main' : 'warning.main'}>
                    <strong>ClienteAdminId Fallback:</strong> {debugInfo.userProfile.clienteAdminIdFallback}
                  </Typography>
                  
              <Typography variant="caption" display="block" color={debugInfo.userProfile.email ? 'success.main' : 'error.main'}>
                <strong>CreadoPorEmail:</strong> {debugInfo.userProfile.email || 'NULL'}
              </Typography>
              
              <Box sx={{ mt: 1, p: 1, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                  Debug Info:
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Cache Status:</strong> {debugInfo.hasCache ? '✅ Disponible' : '❌ No disponible'}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>UserProfile:</strong> {debugInfo.userProfile ? '✅ Cargado' : '❌ No cargado'}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>ClienteAdminId:</strong> {debugInfo.userProfile?.clienteAdminId ? '✅ Tiene valor' : '❌ NULL'}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Email:</strong> {debugInfo.userProfile?.email ? '✅ Tiene valor' : '❌ NULL'}
                </Typography>
              </Box>
                </Box>
              )}
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" fontWeight="bold" gutterBottom>
                  Cache Stats:
                </Typography>
                
                <Typography variant="caption" display="block">
                  <strong>Empresas:</strong> {debugInfo.cacheStats.empresas}
                </Typography>
                
                <Typography variant="caption" display="block">
                  <strong>Formularios:</strong> {debugInfo.cacheStats.formularios}
                </Typography>
                
                <Typography variant="caption" display="block">
                  <strong>Sucursales:</strong> {debugInfo.cacheStats.sucursales}
                </Typography>
                
                <Typography variant="caption" display="block">
                  <strong>Auditorías:</strong> {debugInfo.cacheStats.auditorias}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="caption" color="warning.main">
              No hay cache disponible
            </Typography>
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
      </Collapse>
    </Paper>
  );
};

export default OfflineDebugInfo;
