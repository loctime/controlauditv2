import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  BugReport
} from '@mui/icons-material';

const GoogleAuthDiagnosticModal = ({ open, onClose }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Importar dinámicamente para evitar errores
      const { runGoogleAuthDiagnostics } = await import('../../utils/googleAuthDiagnostics');
      const result = await runGoogleAuthDiagnostics();
      setDiagnostics(result);
    } catch (err) {
      console.error('Error ejecutando diagnóstico:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      runDiagnostics();
    }
  }, [open]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <Info color="info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderDiagnosticSection = (title, items) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReport color="primary" />
        {title}
      </Typography>
      <List dense>
        {items.map((item, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {getStatusIcon(item.status)}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              secondary={item.value}
            />
            {item.chip && (
              <Chip
                label={item.chip}
                color={getStatusColor(item.status)}
                size="small"
                variant="outlined"
              />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderConfigurationSection = () => {
    if (!diagnostics?.configuration) return null;

    const config = diagnostics.configuration;
    const items = [
      {
        label: 'Web Client ID',
        value: config.clientId || 'No configurado',
        status: config.clientId ? 'success' : 'error',
        chip: config.clientId ? 'Configurado' : 'Faltante'
      },
      {
        label: 'App ID',
        value: config.appId || 'No configurado',
        status: config.appId ? 'success' : 'error',
        chip: config.appId ? 'Configurado' : 'Faltante'
      },
      {
        label: 'Scheme OAuth',
        value: config.scheme || 'No configurado',
        status: config.scheme ? 'success' : 'error',
        chip: config.scheme ? 'Configurado' : 'Faltante'
      }
    ];

    return renderDiagnosticSection('Configuración OAuth', items);
  };

  const renderStatusSection = () => {
    if (!diagnostics) return null;

    const items = [
      {
        label: 'Plataforma',
        value: diagnostics.platform === 'APK' ? 'Android APK' : 'Web',
        status: 'success',
        chip: diagnostics.platform
      },
      {
        label: 'Capacitor',
        value: diagnostics.capacitorAvailable ? 'Disponible' : 'No disponible',
        status: diagnostics.capacitorAvailable ? 'success' : 'error',
        chip: diagnostics.capacitorAvailable ? 'OK' : 'Error'
      },
      {
        label: 'Google Auth Nativo',
        value: diagnostics.googleAuthAvailable ? 'Disponible' : 'No disponible',
        status: diagnostics.googleAuthAvailable ? 'success' : 'error',
        chip: diagnostics.googleAuthAvailable ? 'OK' : 'Error'
      },
      {
        label: 'Firebase Auth',
        value: diagnostics.firebaseAvailable ? 'Disponible' : 'No disponible',
        status: diagnostics.firebaseAvailable ? 'success' : 'error',
        chip: diagnostics.firebaseAvailable ? 'OK' : 'Error'
      }
    ];

    return renderDiagnosticSection('Estado del Sistema', items);
  };

  const renderErrorsSection = () => {
    if (!diagnostics?.errors || diagnostics.errors.length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Error color="error" />
          Errores Encontrados
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          Se encontraron {diagnostics.errors.length} error(es) en la configuración
        </Alert>
        <List dense>
          {diagnostics.errors.map((error, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Error color="error" />
              </ListItemIcon>
              <ListItemText primary={error} />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderRecommendations = () => {
    if (!diagnostics) return null;

    const recommendations = [];

    if (!diagnostics.capacitorAvailable) {
      recommendations.push('Verificar que Capacitor esté correctamente instalado');
    }

    if (!diagnostics.googleAuthAvailable) {
      recommendations.push('Verificar configuración del plugin de Google Auth');
      recommendations.push('Verificar SHA-1 en Firebase Console');
    }

    if (!diagnostics.firebaseAvailable) {
      recommendations.push('Verificar configuración de Firebase');
    }

    if (diagnostics.errors?.length > 0) {
      recommendations.push('Revisar y corregir los errores mostrados arriba');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Configuración correcta - Google Auth debería funcionar');
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info color="info" />
          Recomendaciones
        </Typography>
        <List dense>
          {recommendations.map((rec, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Info color="info" />
              </ListItemIcon>
              <ListItemText primary={rec} />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReport color="primary" />
        🔐 Diagnóstico de Google Auth
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error ejecutando diagnóstico: {error}
          </Alert>
        )}

        {!loading && !error && diagnostics && (
          <>
            {renderStatusSection()}
            <Divider sx={{ my: 2 }} />
            {renderConfigurationSection()}
            {renderErrorsSection()}
            <Divider sx={{ my: 2 }} />
            {renderRecommendations()}
          </>
        )}

        {!loading && !error && !diagnostics && (
          <Typography color="text.secondary">
            No se pudo obtener información de diagnóstico
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={runDiagnostics}
          disabled={loading}
          startIcon={<Refresh />}
        >
          {loading ? 'Ejecutando...' : 'Reejecutar Diagnóstico'}
        </Button>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleAuthDiagnosticModal;
