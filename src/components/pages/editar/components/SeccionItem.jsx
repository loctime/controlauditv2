import React, { memo, useCallback } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import Tooltip from '@mui/material/Tooltip';

const SeccionItem = memo(({ 
  seccion, 
  seccionIndex, 
  onEditarSeccion, 
  onEliminarSeccion, 
  onAgregarPregunta,
  onEditarPregunta,
  onEliminarPregunta,
  puedeEditar,
  puedeEliminar 
}) => {
  const handleEditarSeccion = useCallback(() => {
    onEditarSeccion(seccion);
  }, [seccion, onEditarSeccion]);

  const handleEliminarSeccion = useCallback(() => {
    onEliminarSeccion(seccion.nombre);
  }, [seccion.nombre, onEliminarSeccion]);

  const handleClickAgregarPregunta = useCallback(() => {
    onAgregarPregunta(seccion);
  }, [seccion, onAgregarPregunta]);

  return (
    <Box mb={2} p={2} bgcolor="#fafbfc" borderRadius={2} boxShadow={0}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 0 }}>
          {seccion.nombre}
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
          {puedeEditar && (
            <Tooltip title="Editar sección" arrow>
              <span>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={handleEditarSeccion}
                  sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {puedeEliminar && (
            <Tooltip title="Eliminar sección" arrow>
              <span>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={handleEliminarSeccion}
                  sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                >
                  <DeleteForeverIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {puedeEditar && (
            <Tooltip title="Agregar pregunta" arrow>
              <span>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={handleClickAgregarPregunta}
                  sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>
      <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
        <Table size="small" sx={{ minWidth: 400 }}>
          <TableHead>
            <TableRow>
              <TableCell align="left" sx={{ fontWeight: 500, fontSize: 14, bgcolor: '#f3f4f6' }}>Pregunta</TableCell>
              <TableCell align="right" sx={{ fontWeight: 500, fontSize: 14, bgcolor: '#f3f4f6', width: 120 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seccion.preguntas && seccion.preguntas.map((pregunta, preguntaIndex) => (
              <TableRow
                key={preguntaIndex}
                sx={{
                  transition: 'background 0.2s',
                  '&:hover': { background: '#f5f7fa' }
                }}
              >
                <TableCell align="left" sx={{ fontSize: 14 }}>{pregunta}</TableCell>
                <TableCell align="right" sx={{ p: 0 }}>
                  <Box display="flex" justifyContent="flex-end" gap={0.5}>
                    {puedeEditar && (
                      <Tooltip title="Editar pregunta" arrow>
                        <span>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => {
                              console.log('🔧 [DEBUG] Click en icono editar pregunta:', { pregunta, seccionNombre: seccion.nombre, index: preguntaIndex });
                              onEditarPregunta({ pregunta, seccionNombre: seccion.nombre, index: preguntaIndex });
                            }}
                            sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {puedeEliminar && (
                      <Tooltip title="Eliminar pregunta" arrow>
                        <span>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => onEliminarPregunta(preguntaIndex, seccion.nombre)}
                            sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                          >
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

SeccionItem.displayName = 'SeccionItem';

export default SeccionItem;
