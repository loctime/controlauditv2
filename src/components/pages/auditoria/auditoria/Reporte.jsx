import React from "react";
import PropTypes from "prop-types"; // Asegúrate de que esta línea esté presente
import ResumenRespuestas from "./ResumenRespuestas";
import EstadisticasChart from "./EstadisticasPreguntas";
import ImagenesTable from "./ImagenesTable";
import { Typography, Grid, Box, Button } from "@mui/material";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db, storage } from "./../../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

const Reporte = ({
  empresa,
  sucursal,
  formulario, // Asegúrate de agregar formulario como prop
  respuestas,
  comentarios = [],
  imagenes = [],
  secciones,
}) => {
  const navigate = useNavigate();

  // NOTA: Este componente es SOLO de visualización.
  // Los datos deben venir filtrados y seguros desde la consulta principal (multi-tenant).

  if (!Array.isArray(respuestas) || respuestas.length === 0) {
    return <div>No hay datos de respuestas disponibles.</div>;
  }

  const seccionesArray = Array.isArray(secciones)
    ? secciones
    : Object.values(secciones);

  if (!seccionesArray || !Array.isArray(seccionesArray)) {
    console.error("Secciones no válidas:", secciones);
    return <div>Secciones no válidas.</div>;
  }

  const estadisticas = {
    Conforme: respuestas.flat().filter((res) => res === "Conforme").length,
    "No conforme": respuestas.flat().filter((res) => res === "No conforme").length,
    "Necesita mejora": respuestas.flat().filter((res) => res === "Necesita mejora").length,
    "No aplica": respuestas.flat().filter((res) => res === "No aplica").length,
  };

  const estadisticasSinNoAplica = {
    Conforme: respuestas.flat().filter((res) => res === "Conforme").length,
    "No conforme": respuestas.flat().filter((res) => res === "No conforme").length,
    "Necesita mejora": respuestas.flat().filter((res) => res === "Necesita mejora").length,
  };

  const totalRespuestas = respuestas.flat().length;

  const todasPreguntasContestadas =
    respuestas.flat().length ===
    seccionesArray.reduce((acc, seccion) => acc + seccion.preguntas.length, 0);

  const handleVolver = () => {
    navigate(-1); // Navega a la página anterior
  };

  return (
    <Box className="reporte-container" p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h2" gutterBottom>
          Reporte de Auditoría de Higiene y Seguridad
        </Typography>
        {empresa.logo && empresa.logo.trim() !== "" ? (
          <img 
            src={empresa.logo} 
            alt="Logo de la empresa" 
            style={{ height: '60px' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <Box
            sx={{
              width: "60px",
              height: "60px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: "#666",
              border: "1px solid #ccc"
            }}
          >
            {empresa.nombre.charAt(0).toUpperCase()}
          </Box>
        )}
      </Box>
      <Typography variant="h4" gutterBottom>
        Datos de la Empresa
      </Typography>
      <Typography variant="h6">Empresa: {empresa.nombre}</Typography>
      <Typography variant="h6">Sucursal: {sucursal}</Typography>
      <Typography variant="h6">Formulario: {formulario.nombre}</Typography>
      <ResumenRespuestas
        totalRespuestas={totalRespuestas}
        estadisticas={estadisticas}
      />
      <Grid container spacing={3} mt={3}>
        {/* Espacio para el primer gráfico: Estadísticas Generales */}
        <Grid size={{ xs: 12, sm: 2, md: 10 }}>
          <Box display="flex" justifyContent="center">
            <EstadisticasChart
              estadisticas={estadisticas}
              title="Estadísticas Generales"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        </Grid>
        {/* Espacio para el segundo gráfico: Estadísticas (Sin "No aplica") */}
        <Grid size={{ xs: 12, sm: 2, md: 10 }}>
          <Box display="flex" justifyContent="center">
            <EstadisticasChart
              estadisticas={estadisticasSinNoAplica}
              title='Estadísticas (Sin "No aplica")'
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        </Grid>
      </Grid>
      <Box mt={3}>
        <ImagenesTable
          secciones={seccionesArray}
          respuestas={respuestas}
          comentarios={comentarios}
          imagenes={imagenes}
        />
      </Box>
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button variant="contained" onClick={handleVolver}>
          Volver
        </Button>
      </Box>
    </Box>
  );
};

Reporte.propTypes = {
  empresa: PropTypes.shape({
    nombre: PropTypes.string.isRequired,
    logo: PropTypes.string.isRequired,
  }).isRequired,
  sucursal: PropTypes.string.isRequired,
  formulario: PropTypes.shape({ // Asegúrate de definir el tipo de formulario
    id: PropTypes.string.isRequired,
    // Otras propiedades que necesite el formulario
  }).isRequired,
  respuestas: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  comentarios: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  imagenes: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.instanceOf(File))),
  secciones: PropTypes.arrayOf(
    PropTypes.shape({
      nombre: PropTypes.string.isRequired,
      preguntas: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
};

export default Reporte;
