import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Switch, 
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider
} from '@mui/material';
import AuditoriaPieChart from './AuditoriaPieChart';

const DemoAuditoriaPieChart = () => {
  // Datos de ejemplo
  const [estadisticas, setEstadisticas] = useState({
    'Conforme': 15,
    'No conforme': 3,
    'Necesita mejora': 2,
    'No aplica': 5
  });

  // Configuración del gráfico
  const [config, setConfig] = useState({
    showLegend: true,
    showTooltips: true,
    variant: 'pie',
    height: 400
  });

  // Datos de ejemplo adicionales
  const ejemplosDatos = [
    {
      nombre: "Auditoría Excelente",
      datos: { 'Conforme': 20, 'No conforme': 1, 'Necesita mejora': 0, 'No aplica': 2 }
    },
    {
      nombre: "Auditoría Regular",
      datos: { 'Conforme': 10, 'No conforme': 5, 'Necesita mejora': 3, 'No aplica': 4 }
    },
    {
      nombre: "Auditoría Crítica",
      datos: { 'Conforme': 5, 'No conforme': 12, 'Necesita mejora': 8, 'No aplica': 1 }
    },
    {
      nombre: "Sin Datos",
      datos: {}
    }
  ];

  const handleCambiarEjemplo = (ejemplo) => {
    setEstadisticas(ejemplo.datos);
  };

  const handleConfigChange = (propiedad, valor) => {
    setConfig(prev => ({ ...prev, [propiedad]: valor }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        🍰 Demo - Gráfico de Torta para Auditorías
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Este es un gráfico de torta moderno y responsivo para mostrar las estadísticas de auditorías 
        con las 4 categorías principales: Conforme, No conforme, Necesita mejora y No aplica.
      </Typography>

      {/* Controles de configuración */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚙️ Configuración del Gráfico
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showLegend}
                    onChange={(e) => handleConfigChange('showLegend', e.target.checked)}
                  />
                }
                label="Mostrar Leyenda"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showTooltips}
                    onChange={(e) => handleConfigChange('showTooltips', e.target.checked)}
                  />
                }
                label="Mostrar Tooltips"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Gráfico</InputLabel>
                <Select
                  value={config.variant}
                  label="Tipo de Gráfico"
                  onChange={(e) => handleConfigChange('variant', e.target.value)}
                >
                  <MenuItem value="pie">Torta (Pie)</MenuItem>
                  <MenuItem value="doughnut">Donut (Doughnut)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Altura</InputLabel>
                <Select
                  value={config.height}
                  label="Altura"
                  onChange={(e) => handleConfigChange('height', e.target.value)}
                >
                  <MenuItem value={300}>300px</MenuItem>
                  <MenuItem value={400}>400px</MenuItem>
                  <MenuItem value={500}>500px</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Ejemplos de datos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Ejemplos de Datos
          </Typography>
          
          <Grid container spacing={2}>
            {ejemplosDatos.map((ejemplo, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleCambiarEjemplo(ejemplo)}
                  sx={{ 
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    textAlign: 'left'
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {ejemplo.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Object.keys(ejemplo.datos).length > 0 
                        ? `${Object.values(ejemplo.datos).reduce((a, b) => a + b, 0)} respuestas`
                        : 'Sin datos'
                      }
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Gráfico principal */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          📈 Gráfico de Torta - Resultados
        </Typography>
        
        <AuditoriaPieChart
          estadisticas={estadisticas}
          title="Distribución de Respuestas de Auditoría"
          height={config.height}
          showLegend={config.showLegend}
          showTooltips={config.showTooltips}
          variant={config.variant}
        />
      </Box>

      {/* Información adicional */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ℹ️ Características del Gráfico
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                ✅ Funcionalidades:
              </Typography>
              <ul>
                <li>Colores específicos para cada categoría</li>
                <li>Iconos visuales en las leyendas</li>
                <li>Tooltips informativos con porcentajes</li>
                <li>Animaciones suaves</li>
                <li>Responsive design</li>
                <li>Manejo de datos vacíos</li>
              </ul>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                🎨 Categorías y Colores:
              </Typography>
              <ul>
                <li><span style={{ color: '#43a047' }}>✅ Conforme</span> - Verde (#43a047)</li>
                <li><span style={{ color: '#e53935' }}>❌ No conforme</span> - Rojo (#e53935)</li>
                <li><span style={{ color: '#fbc02d' }}>⚠️ Necesita mejora</span> - Amarillo (#fbc02d)</li>
                <li><span style={{ color: '#1976d2' }}>ℹ️ No aplica</span> - Azul (#1976d2)</li>
              </ul>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DemoAuditoriaPieChart;
