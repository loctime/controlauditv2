import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Paper } from "@mui/material";

const ResumenRespuestas = ({ respuestas, secciones }) => {
  const generarEstadisticas = () => {
    // Generate statistics from responses
    const conforme = respuestas.flat().filter((r) => r === "Conforme").length;
    const noConforme = respuestas.flat().filter((r) => r === "No conforme").length;
    const necesitaMejora = respuestas.flat().filter((r) => r === "Necesita mejora").length;
    const noAplica = respuestas.flat().filter((r) => r === "No aplica").length;
    
    return {
      Conforme: conforme,
      "No Conforme": noConforme,
      "Necesita Mejora": necesitaMejora,
      "No Aplica": noAplica,
    };
  };

  const datosEstadisticos = generarEstadisticas();

  return (
    <Paper style={{ padding: "16px", marginTop: "16px" }}>
      <Typography variant="h4" gutterBottom>
        Estadísticas de Respuestas
      </Typography>
      <Box mt={2}>
        {Object.keys(datosEstadisticos).map((key) => (
          <Typography key={key} variant="h6">
            {key}: {datosEstadisticos[key]}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
};

ResumenRespuestas.propTypes = {
  respuestas: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  secciones: PropTypes.arrayOf(
    PropTypes.shape({
      nombre: PropTypes.string.isRequired,
      preguntas: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
};

export default ResumenRespuestas;
