import React from "react";
import {
  Typography,
  Box,
  Button,
} from "@mui/material";
import ResumenRespuestas from "./ResumenRespuestas";
import FirmaSection from "./FirmaSection";
import EstadisticasChart from "./EstadisticasChart";
import { reconstruirDatosDesdeFirestore } from "../../../../utils/firestoreUtils";

const DetallesAuditoria = ({ reporte, onClose }) => {
  if (!reporte) return null;

  // Extraer datos de manera compatible con ambas estructuras
  const nombreEmpresa = typeof reporte.empresa === 'object' 
    ? reporte.empresa.nombre 
    : reporte.empresa;
  
  const nombreFormulario = reporte.nombreForm || 
    (typeof reporte.formulario === 'object' 
      ? reporte.formulario.nombre 
      : reporte.formulario);
  
  const fecha = reporte.fecha
    ? new Date(reporte.fecha.seconds * 1000).toLocaleString()
    : reporte.fechaGuardado
    ? new Date(reporte.fechaGuardado).toLocaleString()
    : "Fecha no disponible";

  // Para las respuestas, manejar tanto arrays anidados como planos
  const respuestasFinales = reporte.metadata 
    ? reconstruirDatosDesdeFirestore(reporte).respuestas
    : reporte.respuestas;

  const comentariosFinales = reporte.metadata 
    ? reconstruirDatosDesdeFirestore(reporte).comentarios
    : reporte.comentarios;

  return (
    <Box className="pdf-content">
      <Typography variant="h2" gutterBottom>
        Detalles del Reporte de Auditoría
      </Typography>
      <Typography variant="h4" gutterBottom>
        Empresa: {nombreEmpresa || "Empresa no disponible"}
      </Typography>
      <Typography variant="h6">
        Sucursal: {reporte.sucursal || "Sucursal no disponible"}
      </Typography>
      <Typography variant="h6">
        Formulario: {nombreFormulario || "Formulario no disponible"}
      </Typography>
      <Typography variant="h6">
        Fecha y Hora de Guardado: {fecha}
      </Typography>

      <ResumenRespuestas
        respuestas={respuestasFinales || []}
        comentarios={comentariosFinales || []}
        secciones={reporte.secciones || []}
      />

      <Box className="signature-container" mt={3}>
        <Box flex={1} minWidth="300px" maxWidth="45%">
          <Typography variant="subtitle1" gutterBottom>
            Firma del Auditor
          </Typography>
          <FirmaSection />
        </Box>
      </Box>

      <Box display="flex" flexWrap="wrap" justifyContent="space-between" mt={3}>
        <Box flex={1} minWidth="300px" maxWidth="45%" mb={3}>
          <EstadisticasChart
            estadisticas={reporte.estadisticas || {}}
            title="Estadísticas Generales"
          />
        </Box>
        <Box flex={1} minWidth="300px" maxWidth="45%" mb={3}>
          <EstadisticasChart
            estadisticas={reporte.estadisticasSinNoAplica || {}}
            title='Estadísticas (Sin "No aplica")'
          />
        </Box>
      </Box>

      <Box display="flex" justifyContent="flex-end" className="no-print">
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Volver
        </Button>
      </Box>
    </Box>
  );
};

export default DetallesAuditoria;
