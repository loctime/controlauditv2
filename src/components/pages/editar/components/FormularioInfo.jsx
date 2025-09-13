import React, { memo, useMemo } from "react";
import {
  Typography,
  Box,
  Chip
} from "@mui/material";

const FormularioInfo = memo(({ formulario, puedeEditar, puedeEliminar }) => {
  const metadata = useMemo(() => ({
    creador: formulario.creadorNombre || formulario.creadorEmail || 'Desconocido',
    fechaCreacion: formulario.timestamp?.toDate?.()?.toLocaleString?.() || 'No disponible',
    ultimaModificacion: formulario.ultimaModificacion?.toLocaleString?.() || 'No disponible'
  }), [formulario]);

  return (
    <Box mb={2} p={2} bgcolor="grey.100" borderRadius={1}>
      <Typography variant="h6" gutterBottom>
        {formulario.nombre}
      </Typography>
      <Box display="flex" gap={1} flexWrap="wrap">
        <Chip 
          label={puedeEditar ? "Puede editar" : "Solo lectura"} 
          color={puedeEditar ? "success" : "warning"} 
          size="small" 
        />
        <Chip 
          label={puedeEliminar ? "Puede eliminar" : "No puede eliminar"} 
          color={puedeEliminar ? "success" : "warning"} 
          size="small" 
        />
        {formulario.esPublico && (
          <Chip label="Público" color="primary" size="small" />
        )}
      </Box>
      <Box mt={1}>
        <Typography variant="caption" color="text.secondary">
          <strong>Creado por:</strong> {metadata.creador}<br/>
          <strong>Fecha de creación:</strong> {metadata.fechaCreacion}<br/>
          <strong>Última modificación:</strong> {metadata.ultimaModificacion}
        </Typography>
      </Box>
    </Box>
  );
});

FormularioInfo.displayName = 'FormularioInfo';

export default FormularioInfo;
