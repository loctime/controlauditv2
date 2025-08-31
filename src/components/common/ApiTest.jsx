import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { 
  CloudUpload, 
  CheckCircle, 
  Error, 
  Info,
  Refresh
} from '@mui/icons-material';
import { apiService } from '../../services/apiService.js';

const ApiTest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    try {
      console.log(`🧪 Ejecutando prueba: ${testName}`);
      const result = await testFunction();
      setResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
      console.log(`✅ Prueba ${testName} exitosa:`, result);
    } catch (error) {
      console.error(`❌ Prueba ${testName} falló:`, error);
      setResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testConnectivity = () => apiService.checkConnectivity();
  const testHealth = () => apiService.healthCheck();
  const testProfile = () => apiService.getUserProfile();
  const testDiagnostic = () => apiService.getDiagnosticInfo();

  const testUpload = async () => {
    if (!selectedFile) {
      throw new Error('No se ha seleccionado ningún archivo');
    }
    
    return apiService.uploadFile(selectedFile, {
      tipo: 'test',
      app: 'controlaudit',
      test: true
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log('📁 Archivo seleccionado:', file.name, `(${(file.size/1024/1024).toFixed(2)}MB)`);
    }
  };

  const runAllTests = async () => {
    setResults({});
    await runTest('Conectividad', testConnectivity);
    await runTest('Health Check', testHealth);
    await runTest('Diagnóstico', testDiagnostic);
    await runTest('Perfil de Usuario', testProfile);
    
    if (selectedFile) {
      await runTest('Subida de Archivo', testUpload);
    }
  };

  const getTestStatus = (testName) => {
    const result = results[testName];
    if (!result) return 'pending';
    return result.success ? 'success' : 'error';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      default: return <Info color="info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success.main';
      case 'error': return 'error.main';
      default: return 'info.main';
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        🧪 Pruebas de API Simplificada
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Pruebas para verificar la comunicación directa con ControlFile
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📁 Archivo de Prueba
        </Typography>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileSelect}
        />
        <label htmlFor="file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            sx={{ mr: 2 }}
          >
            Seleccionar Archivo
          </Button>
        </label>
        {selectedFile && (
          <Typography variant="body2" color="success.main">
            ✅ {selectedFile.name} ({(selectedFile.size/1024/1024).toFixed(2)}MB)
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={runAllTests}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          sx={{ mr: 2 }}
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Todas las Pruebas'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => setResults({})}
          disabled={loading}
        >
          Limpiar Resultados
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        📊 Resultados de las Pruebas
      </Typography>

      <List>
        {[
          { name: 'Conectividad', test: testConnectivity },
          { name: 'Health Check', test: testHealth },
          { name: 'Diagnóstico', test: testDiagnostic },
          { name: 'Perfil de Usuario', test: testProfile },
          { name: 'Subida de Archivo', test: testUpload, requiresFile: true }
        ].map(({ name, test, requiresFile }) => {
          const status = getTestStatus(name);
          const result = results[name];
          
          return (
            <ListItem key={name} sx={{ 
              border: 1, 
              borderColor: getStatusColor(status),
              borderRadius: 1,
              mb: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {getStatusIcon(status)}
                <ListItemText
                  primary={name}
                  secondary={
                    requiresFile && !selectedFile 
                      ? 'Requiere archivo seleccionado'
                      : result?.success 
                        ? 'Prueba exitosa'
                        : result?.error 
                          ? `Error: ${result.error}`
                          : 'Pendiente'
                  }
                  sx={{ ml: 2 }}
                />
                <Button
                  size="small"
                  onClick={() => runTest(name, test)}
                  disabled={loading || (requiresFile && !selectedFile)}
                >
                  Probar
                </Button>
              </Box>
            </ListItem>
          );
        })}
      </List>

      {Object.keys(results).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📋 Detalles de Resultados
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
            <pre style={{ margin: 0, fontSize: '12px' }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default ApiTest;
