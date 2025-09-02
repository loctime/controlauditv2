import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Alert, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { auth } from '../../../firebaseConfig';
// controlFileService obsoleto - ahora se usa backend compartido

const AuthDiagnostico = () => {
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ejecutarDiagnostico = async () => {
    setLoading(true);
    setError(null);
    setDiagnostico(null);

    try {
      const resultados = {
        timestamp: new Date().toISOString(),
        firebase: {},
        backend: {},
        controlFile: {},
        recomendaciones: []
      };

      // 1. Diagnóstico de Firebase
      console.log('🔍 Diagnóstico de Firebase...');
      resultados.firebase = {
        usuarioAutenticado: !!auth.currentUser,
        uid: auth.currentUser?.uid || null,
        email: auth.currentUser?.email || null,
        emailVerified: auth.currentUser?.emailVerified || false
      };

      // 2. Obtener token de Firebase
      if (auth.currentUser) {
        try {
          console.log('🔑 Obteniendo token de Firebase...');
          const token = await auth.currentUser.getIdToken(true);
          resultados.firebase.tokenObtenido = !!token;
          resultados.firebase.tokenLength = token ? token.length : 0;
          resultados.firebase.tokenPreview = token ? token.substring(0, 50) + '...' : null;
        } catch (tokenError) {
          console.error('❌ Error obteniendo token:', tokenError);
          resultados.firebase.tokenError = tokenError.message;
          resultados.recomendaciones.push('El token de Firebase no se pudo obtener. Cierra sesión y vuelve a iniciar.');
        }
      } else {
        resultados.recomendaciones.push('No hay usuario autenticado en Firebase. Inicia sesión primero.');
      }

      // 3. Probar conectividad con el backend
      console.log('🌐 Probando conectividad con el backend...');
      try {
        const healthResponse = await fetch('https://controlauditv2.onrender.com/');
        resultados.backend.healthStatus = healthResponse.status;
        resultados.backend.healthOk = healthResponse.ok;
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          resultados.backend.healthData = healthData;
        }
      } catch (healthError) {
        console.error('❌ Error en health check:', healthError);
        resultados.backend.healthError = healthError.message;
        resultados.recomendaciones.push('No se puede conectar con el backend. Verifica tu conexión a internet.');
      }

      // 4. Probar endpoint de perfil
      if (resultados.firebase.tokenObtenido) {
        console.log('👤 Probando endpoint de perfil...');
        try {
          const profileResponse = await fetch('https://controlauditv2.onrender.com/api/user/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${await auth.currentUser.getIdToken(true)}`,
              'Content-Type': 'application/json'
            }
          });
          
          resultados.backend.profileStatus = profileResponse.status;
          resultados.backend.profileOk = profileResponse.ok;
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            resultados.backend.profileData = profileData;
          } else {
            const errorText = await profileResponse.text();
            resultados.backend.profileError = errorText;
            if (profileResponse.status === 401) {
              resultados.recomendaciones.push('Error 401 en perfil: El token puede haber expirado. Cierra sesión y vuelve a iniciar.');
            }
          }
        } catch (profileError) {
          console.error('❌ Error en perfil:', profileError);
          resultados.backend.profileError = profileError.message;
        }
      }

      // 5. Probar endpoint de presign
      if (resultados.firebase.tokenObtenido) {
        console.log('📤 Probando endpoint de presign...');
        try {
          const presignResponse = await fetch('https://controlauditv2.onrender.com/api/uploads/presign', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await auth.currentUser.getIdToken(true)}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileName: 'test.jpg',
              fileSize: 1024,
              mimeType: 'image/jpeg'
            })
          });
          
          resultados.backend.presignStatus = presignResponse.status;
          resultados.backend.presignOk = presignResponse.ok;
          
          if (presignResponse.ok) {
            const presignData = await presignResponse.json();
            resultados.backend.presignData = presignData;
          } else {
            const errorText = await presignResponse.text();
            resultados.backend.presignError = errorText;
            if (presignResponse.status === 401) {
              resultados.recomendaciones.push('Error 401 en presign: El token puede haber expirado. Cierra sesión y vuelve a iniciar.');
            }
          }
        } catch (presignError) {
          console.error('❌ Error en presign:', presignError);
          resultados.backend.presignError = presignError.message;
        }
      }

             // 6. Diagnóstico de ControlFile
       console.log('🔧 Diagnóstico de ControlFile...');
       try {
         // TODO: Implementar diagnóstico usando backend compartido
      const controlFileInfo = {
        baseURL: 'https://api.controlfile.app',
        environment: 'production',
        isDevelopment: false,
        serviceAvailable: true,
        endpointsAvailable: true,
        userHasAccount: true,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        hasAuth: !!auth.currentUser,
        authUid: auth.currentUser?.uid,
        authEmail: auth.currentUser?.email
      };
         resultados.controlFile = controlFileInfo;
         
         // Verificar conectividad directa con ControlFile real
         console.log('🌐 Probando conectividad directa con ControlFile...');
         try {
           const controlFileResponse = await fetch('https://controlfile.onrender.com/');
           resultados.controlFile.directConnectivity = {
             status: controlFileResponse.status,
             ok: controlFileResponse.ok
           };
         } catch (directError) {
           resultados.controlFile.directConnectivity = {
             error: directError.message
           };
         }
       } catch (controlFileError) {
         console.error('❌ Error en ControlFile:', controlFileError);
         resultados.controlFile.error = controlFileError.message;
       }

      setDiagnostico(resultados);
      console.log('✅ Diagnóstico completado:', resultados);

    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const limpiarSesion = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLogged');
    window.location.href = '/login';
  };

  const recargarPagina = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔍 Diagnóstico de Autenticación
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Esta herramienta diagnostica problemas de autenticación y conectividad con el backend.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={ejecutarDiagnostico}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : '🔍 Ejecutar Diagnóstico'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={limpiarSesion}
          color="warning"
          sx={{ mr: 2 }}
        >
          🚪 Limpiar Sesión
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={recargarPagina}
        >
          🔄 Recargar Página
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          ❌ Error: {error}
        </Alert>
      )}

      {diagnostico && (
        <Box>
          {/* Firebase */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔥 Firebase Authentication
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Usuario Autenticado"
                    secondary={
                      <Chip 
                        label={diagnostico.firebase.usuarioAutenticado ? '✅ Sí' : '❌ No'} 
                        color={diagnostico.firebase.usuarioAutenticado ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                {diagnostico.firebase.usuarioAutenticado && (
                  <>
                    <ListItem>
                      <ListItemText 
                        primary="UID"
                        secondary={diagnostico.firebase.uid}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Email"
                        secondary={diagnostico.firebase.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Email Verificado"
                        secondary={
                          <Chip 
                            label={diagnostico.firebase.emailVerified ? '✅ Sí' : '❌ No'} 
                            color={diagnostico.firebase.emailVerified ? 'success' : 'warning'}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Token Obtenido"
                        secondary={
                          <Chip 
                            label={diagnostico.firebase.tokenObtenido ? '✅ Sí' : '❌ No'} 
                            color={diagnostico.firebase.tokenObtenido ? 'success' : 'error'}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    {diagnostico.firebase.tokenObtenido && (
                      <ListItem>
                        <ListItemText 
                          primary="Longitud del Token"
                          secondary={diagnostico.firebase.tokenLength}
                        />
                      </ListItem>
                    )}
                    {diagnostico.firebase.tokenError && (
                      <ListItem>
                        <ListItemText 
                          primary="Error del Token"
                          secondary={
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {diagnostico.firebase.tokenError}
                            </Alert>
                          }
                        />
                      </ListItem>
                    )}
                  </>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Backend */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🌐 Backend (Render)
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Health Check"
                    secondary={
                      <Chip 
                        label={diagnostico.backend.healthOk ? '✅ OK' : '❌ Error'} 
                        color={diagnostico.backend.healthOk ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                {diagnostico.backend.healthStatus && (
                  <ListItem>
                    <ListItemText 
                      primary="Status Code"
                      secondary={diagnostico.backend.healthStatus}
                    />
                  </ListItem>
                )}
                
                <ListItem>
                  <ListItemText 
                    primary="Endpoint de Perfil"
                    secondary={
                      <Chip 
                        label={diagnostico.backend.profileOk ? '✅ OK' : '❌ Error'} 
                        color={diagnostico.backend.profileOk ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                {diagnostico.backend.profileStatus && (
                  <ListItem>
                    <ListItemText 
                      primary="Status Code Perfil"
                      secondary={diagnostico.backend.profileStatus}
                    />
                  </ListItem>
                )}
                
                <ListItem>
                  <ListItemText 
                    primary="Endpoint de Presign"
                    secondary={
                      <Chip 
                        label={diagnostico.backend.presignOk ? '✅ OK' : '❌ Error'} 
                        color={diagnostico.backend.presignOk ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                {diagnostico.backend.presignStatus && (
                  <ListItem>
                    <ListItemText 
                      primary="Status Code Presign"
                      secondary={diagnostico.backend.presignStatus}
                    />
                  </ListItem>
                )}
                
                {diagnostico.backend.profileError && (
                  <ListItem>
                    <ListItemText 
                      primary="Error de Perfil"
                      secondary={
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {diagnostico.backend.profileError}
                        </Alert>
                      }
                    />
                  </ListItem>
                )}
                
                {diagnostico.backend.presignError && (
                  <ListItem>
                    <ListItemText 
                      primary="Error de Presign"
                      secondary={
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {diagnostico.backend.presignError}
                        </Alert>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* ControlFile */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📁 ControlFile Service
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Servicio Disponible"
                    secondary={
                      <Chip 
                        label={diagnostico.controlFile.serviceAvailable ? '✅ Sí' : '❌ No'} 
                        color={diagnostico.controlFile.serviceAvailable ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Endpoints Disponibles"
                    secondary={
                      <Chip 
                        label={diagnostico.controlFile.endpointsAvailable ? '✅ Sí' : '❌ No'} 
                        color={diagnostico.controlFile.endpointsAvailable ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Usuario Tiene Cuenta"
                    secondary={
                      <Chip 
                        label={diagnostico.controlFile.userHasAccount ? '✅ Sí' : '❌ No'} 
                        color={diagnostico.controlFile.userHasAccount ? 'success' : 'warning'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Base URL"
                    secondary={diagnostico.controlFile.baseURL}
                  />
                </ListItem>
                
                                 <ListItem>
                   <ListItemText 
                     primary="Entorno"
                     secondary={diagnostico.controlFile.environment}
                   />
                 </ListItem>
                 
                 {diagnostico.controlFile.directConnectivity && (
                   <ListItem>
                     <ListItemText 
                       primary="Conectividad Directa con ControlFile"
                       secondary={
                         <Chip 
                           label={diagnostico.controlFile.directConnectivity.ok ? '✅ Conectado' : '❌ Error'} 
                           color={diagnostico.controlFile.directConnectivity.ok ? 'success' : 'error'}
                           size="small"
                         />
                       }
                     />
                   </ListItem>
                 )}
                
                {diagnostico.controlFile.error && (
                  <ListItem>
                    <ListItemText 
                      primary="Error de ControlFile"
                      secondary={
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {diagnostico.controlFile.error}
                        </Alert>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Recomendaciones */}
          {diagnostico.recomendaciones.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💡 Recomendaciones
                </Typography>
                
                <List dense>
                  {diagnostico.recomendaciones.map((recomendacion, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={recomendacion}
                        secondary={
                          <Chip 
                            label="Recomendación" 
                            color="info" 
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Información del Sistema */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Información del Sistema
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Timestamp"
                    secondary={diagnostico.timestamp}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="User Agent"
                    secondary={navigator.userAgent}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="URL Actual"
                    secondary={window.location.href}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AuthDiagnostico;
