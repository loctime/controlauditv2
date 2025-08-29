import React from "react";
import { Typography, Box } from "@mui/material";
import EstadisticasChart from "./reporte/EstadisticasChart";

const Informe = ({ empresa, sucursal, respuestas, secciones, nombreFormulario }) => {
  // Calcula los datos para el gráfico de torta
  const totalPreguntas = respuestas.flat().length;
  const conformes = respuestas.flat().filter(r => r === "Conforme").length;
  const noConformes = respuestas.flat().filter(r => r === "No conforme").length;
  const necesitaMejora = respuestas.flat().filter(r => r === "Necesita mejora").length;
  const noAplica = respuestas.flat().filter(r => r === "No aplica").length;

  // Preparar estadísticas en el formato esperado
  const estadisticas = {
    'Conforme': conformes,
    'No conforme': noConformes,
    'Necesita mejora': necesitaMejora,
    'No aplica': noAplica
  };

  return (
    <div className="reporte-container">
      <div className="reporte-content" id="reporte">
        <Typography variant="h5" gutterBottom>
          Informe de Auditoría
        </Typography>
        <Typography variant="body1" gutterBottom>
          Empresa: {empresa}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Sucursal: {sucursal}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Nombre del Formulario: {nombreFormulario || "Nombre no disponible"}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Preguntas respondidas: {totalPreguntas}
        </Typography>
        
        <Box sx={{ mt: 3, mb: 3 }}>
          <EstadisticasChart
            estadisticas={estadisticas}
            title="Distribución de Respuestas de Auditoría"
            height={320}
          />
        </Box>
        
        {/* Aquí puedes incluir el resto de la información del informe */}
      </div>
    </div>
  );
};

export default Informe;
