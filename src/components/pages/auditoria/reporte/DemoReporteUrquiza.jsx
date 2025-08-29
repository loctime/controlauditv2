import React, { useRef } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid,
  Divider,
  Alert
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ReporteDetallePro from './ReporteDetallePro';

const DemoReporteUrquiza = () => {
  const reporteRef = useRef();

  // Datos de ejemplo que replican el reporte "Urquiza"
  const datosEjemplo = {
    empresa: {
      nombre: "Urquiza",
      logo: "https://via.placeholder.com/150x50/1976d2/ffffff?text=URQUIZA",
      direccion: "Av. Urquiza 1234, Rosario",
      telefono: "0341-1234567"
    },
    sucursal: "Casa Central",
    formulario: {
      nombre: "Personal manipuladores"
    },
    fecha: "04/09/2021",
    fechaInicio: "04/09/2021 - 10:04:56 am",
    fechaFin: "04/09/2021 - 10:25:24 am",
    auditorNombre: "Fernando Vidal",
    auditorTelefono: "5593364524758",
    geolocalizacion: {
      lat: "-33.4936933",
      lng: "-60.0287582"
    },
    secciones: [
      {
        nombre: "manipuladores",
        preguntas: [
          "Libretas Sanitarias vigente",
          "Varones afeitados, o barba candado bien rebajada",
          "Pelo corto o recogido, completamente cubierto",
          "Uñas cortas y limpias sin Esmalte",
          "Sin anillos, relojes, pulseras ni cadenas",
          "Uniforme del personal completo. (Cofia, chaqueta, pantalón, calzado de seguridad)",
          "Uniforme del personal limpio",
          "El personal entrevistado realiza correctamente el procedimiento de lavado de manos",
          "Falta elemento para el lavado de manos",
          "Correcta conducta del personal",
          "Uso correcto del barbijos",
          "Uso de guantes/guantes limpios/recambio correcto",
          "Indició de que se fuma en el sector"
        ]
      },
      {
        nombre: "producción",
        preguntas: [
          "Bachas con jabón sanitizante, toalla de papel, cepillo de uñas, con Instructivo",
          "Falta de elementos de lavado de manos en bachas de lavado de manos",
          "Pisos y Zócalos, detrás de equipamiento, limpios sin restos de grasa o alimentos",
          "Estado de higiene de Paredes, azulejos",
          "Mesadas de trabajo limpias sin restos de alimentos adheridos e incrustados",
          "Higiene de mesadas en lugares Ocultos (zócalos, patas, bordes)",
          "Limpieza adecuada de heladera, puertas, manijas, burletes (Interior y Exterior)",
          "En cada sector Pulverizadores con alcohol al 70% en cantidad suficiente",
          "Disponer pulveriddor en cada sector correctamente identificado",
          "Contenedores de residuos, limpios, con bolsa y tapados en todo momento",
          "Deben estar identificados y con bolsas de residuos de colores"
        ]
      }
    ],
    respuestas: [
      // Sección 1: manipuladores
      [
        "Conforme", "No aplica", "No conforme", "Conforme", "Conforme", 
        "No conforme", "Conforme", "Conforme", "No conforme", "Conforme", 
        "Conforme", "Conforme", "Conforme"
      ],
      // Sección 2: producción
      [
        "Conforme", "No conforme", "Conforme", "Conforme", "Conforme", 
        "No conforme", "Conforme", "Conforme", "Conforme", "Conforme", 
        "Necesita mejora"
      ]
    ],
    comentarios: [
      // Sección 1
      [
        "", "", "falta de entrega de: uniformes - falta de entrega de calzado de seguridad - falta de entrega de cofias",
        "", "", "falta de entrega de: uniformes - falta de entrega de calzado de seguridad - falta de entrega de cofias",
        "", "", "falta de entrega de jabón y cepillos de uñas",
        "", "", "", ""
      ],
      // Sección 2
      [
        "", "falta de entrega de Jabón y cepillos de uñas",
        "", "", "", "falta implemento para limpiar correctamente entre mesadas",
        "", "", "", "", "se recomienda aplicar gestión de residuos"
      ]
    ],
    imagenes: [
      // Sección 1
      Array(13).fill(""),
      // Sección 2
      Array(11).fill("")
    ],
    firmaAuditor: "https://via.placeholder.com/240x90/43a047/ffffff?text=Firma+Auditor",
    firmaResponsable: "https://via.placeholder.com/240x90/1976d2/ffffff?text=Firma+Empresa"
  };

  const handleImprimir = () => {
    if (reporteRef.current) {
      reporteRef.current.printReport();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        🖨️ Demo - Reporte Estilo Urquiza
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Este demo muestra el nuevo formato de reporte que replica el diseño "Urquiza" con cabecera compacta, 
          tabla de resumen con porcentajes, gráfico donut, secciones numeradas y firmas.
        </Typography>
      </Alert>

      {/* Controles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🖨️ Imprimir Reporte
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PrintIcon />}
                onClick={handleImprimir}
                fullWidth
                size="large"
              >
                Imprimir Reporte Demo
              </Button>
            </Grid>
          </Grid>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            💡 Este reporte usa el formato profesional estilo "Urquiza" optimizado para impresión
          </Typography>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Vista previa del reporte */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          📄 Vista Previa del Reporte
        </Typography>
        
        <Card sx={{ border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent sx={{ p: 0 }}>
            <ReporteDetallePro
              ref={reporteRef}
              open={true}
              onClose={() => {}}
              reporte={datosEjemplo}
              modo="page"
            />
          </CardContent>
        </Card>
      </Box>

      {/* Información adicional */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ℹ️ Características del Nuevo Formato
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                ✅ Mejoras Implementadas:
              </Typography>
              <ul>
                <li>Cabecera compacta estilo Urquiza</li>
                <li>Tabla de resumen con badges de colores</li>
                <li>Gráfico donut integrado</li>
                <li>Secciones numeradas (1.1, 1.2, etc.)</li>
                <li>Metadatos por sección</li>
                <li>Firmas mejoradas</li>
                <li>Comentarios generales</li>
                <li>Geolocalización opcional</li>
              </ul>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                🎨 Elementos Visuales:
              </Typography>
              <ul>
                <li>Colores consistentes con el diseño original</li>
                <li>Tipografías optimizadas para impresión</li>
                <li>Márgenes y espaciado profesional</li>
                <li>Badges con porcentajes</li>
                <li>Bordes y separadores claros</li>
                <li>Imágenes de evidencia integradas</li>
              </ul>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DemoReporteUrquiza;
