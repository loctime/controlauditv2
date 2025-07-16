import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import Reporte from './reporte';
import { Box, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

// CSS para ocultar el botón en impresión
const style = `
@media print {
  .no-print { display: none !important; }
}
`;

const ReporteConImpresion = (props) => {
  const reporteRef = useRef();

  return (
    <Box position="relative">
      {/* Inyectar CSS para ocultar el botón en impresión */}
      <style>{style}</style>
      <Box display="flex" justifyContent="flex-end" mb={2} className="no-print">
        <ReactToPrint
          trigger={() => (
            <Button variant="contained" color="primary" startIcon={<PrintIcon />}>
              Imprimir Reporte
            </Button>
          )}
          content={() => reporteRef.current}
          onBeforeGetContent={() => {
            console.log('[DEBUG] Preparando impresión del reporte...');
          }}
          onAfterPrint={() => {
            console.log('[DEBUG] Impresión completada.');
          }}
        />
      </Box>
      {/* Área imprimible */}
      <div ref={reporteRef}>
        <Reporte {...props} />
      </div>
    </Box>
  );
};

export default ReporteConImpresion;