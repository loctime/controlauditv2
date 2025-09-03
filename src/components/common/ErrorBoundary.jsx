import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error capturado por ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            textAlign: 'center',
            backgroundColor: '#f5f5f5'
          }}
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              🚨 Error en la aplicación
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Ha ocurrido un error inesperado. Esto puede ser causado por:
            </Typography>
            <Typography variant="body2" component="div" sx={{ textAlign: 'left', mb: 2 }}>
              • Problemas de conexión a internet<br/>
              • Errores en la configuración<br/>
              • Problemas de compatibilidad del dispositivo
            </Typography>
          </Alert>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleRefresh}
            sx={{ mb: 2 }}
          >
            Recargar aplicación
          </Button>

          {this.state.error && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff', borderRadius: 1, maxWidth: 500, textAlign: 'left' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <strong>Error:</strong> {this.state.error.toString()}
              </Typography>
              {this.state.errorInfo && (
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mt: 1 }}>
                  <strong>Stack:</strong> {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
