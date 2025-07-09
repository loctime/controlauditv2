import React, { useState } from "react";
import Firma from "./Firma";
import { Grid, Box } from "@mui/material";
import './ReportesPage.css'; // Asegúrate de que la clase CSS esté disponible

const FirmaSection = ({ isPdf = false, onSaveSignature }) => {
  const [firmaURL, setFirmaURL] = useState(null);

  const handleSaveSignature = (url) => {
    setFirmaURL(url);
    if (onSaveSignature) {
      onSaveSignature(url);
    }
  };

  // Estilos específicos para el PDF
  const pdfStyle = isPdf ? {
    width: '50%', // Ajusta el ancho para el PDF
    margin: '0 auto', // Centra horizontalmente
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row', // Mantén las firmas en fila
    alignItems: 'flex-start', // Alinea las firmas al inicio
    padding: '10px 0', // Ajusta el padding
  } : {};

  return (
    <Grid 
      container 
      spacing={2} 
      style={pdfStyle}
    >
      <Grid size={{ xs: 12, md: 12 }}>
        <Box className="signature-container" mt={3}>
          <Firma title="Firma del Auditor" setFirmaURL={handleSaveSignature} />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 12 }}>
        <Box className="signature-container" mt={3}>
          <Firma title="Firma del Responsable de la Empresa" setFirmaURL={handleSaveSignature} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default FirmaSection;
