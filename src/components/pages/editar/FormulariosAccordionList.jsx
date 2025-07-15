import React, { useRef, useState, useMemo } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Tooltip,
  TextField,
  InputAdornment
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';

/**
 * Lista de formularios en modo acordeón expandible.
 * @param {Object[]} formularios - Array de formularios (con metadatos y preguntas)
 * @param {Function} onEditar - Callback al hacer click en Editar (recibe el id)
 * @param {string} formularioSeleccionadoId - Id del formulario actualmente seleccionado
 * @param {Function} scrollToEdicion - Función para hacer scroll a la sección de edición
 */
const FormulariosAccordionList = ({ formularios, onEditar, formularioSeleccionadoId, scrollToEdicion }) => {
  const lastClickedRef = useRef(null);
  const [busqueda, setBusqueda] = useState("");

  const handleEditar = (id) => {
    console.debug(`[FormulariosAccordionList] Editar formulario: ${id}`);
    onEditar(id);
    setTimeout(() => {
      if (scrollToEdicion) scrollToEdicion();
    }, 300); // Espera para asegurar el render
  };

  // Filtro de formularios por nombre, propietario o preguntas
  const formulariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return formularios;
    const q = busqueda.trim().toLowerCase();
    return formularios.filter(f => {
      // Nombre
      if (f.nombre?.toLowerCase().includes(q)) return true;
      // Propietario
      if ((f.creadorNombre || f.creadorEmail || "").toLowerCase().includes(q)) return true;
      // Preguntas
      const secciones = Array.isArray(f.secciones)
        ? f.secciones
        : (typeof f.secciones === 'object' ? Object.values(f.secciones) : []);
      for (const seccion of secciones) {
        for (const pregunta of (seccion.preguntas || [])) {
          if (typeof pregunta === "string" && pregunta.toLowerCase().includes(q)) return true;
          if (typeof pregunta === "object") {
            if ((pregunta.titulo && pregunta.titulo.toLowerCase().includes(q)) ||
                (pregunta.texto && pregunta.texto.toLowerCase().includes(q)) ||
                (pregunta.pregunta && pregunta.pregunta.toLowerCase().includes(q))) return true;
          }
        }
      }
      return false;
    });
  }, [busqueda, formularios]);

  // Función para contar preguntas en todas las secciones
  const contarPreguntas = (formulario) => {
    if (!formulario.secciones) return 0;
    let secciones = Array.isArray(formulario.secciones)
      ? formulario.secciones
      : (typeof formulario.secciones === 'object' ? Object.values(formulario.secciones) : []);
    return secciones.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0);
  };

  if (!formularios || formularios.length === 0) {
    return <Typography color="text.secondary">No hay formularios disponibles.</Typography>;
  }

  return (
    <Box mt={2}>
      <TextField
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, propietario o pregunta..."
        size="small"
        fullWidth
        sx={{ mb: 2, maxWidth: 500 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          'aria-label': 'Buscar formularios'
        }}
      />
      {formulariosFiltrados.map((formulario) => (
        <Accordion key={formulario.id} defaultExpanded={false} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`panel-${formulario.id}-content`} id={`panel-${formulario.id}-header`}>
            <Stack direction="row" spacing={2} alignItems="center" width="100%">
              <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
                {formulario.nombre}
              </Typography>
              <Tooltip title="Número de preguntas">
                <Chip label={`Preguntas: ${contarPreguntas(formulario)}`} size="small" color="primary" />
              </Tooltip>
              <Tooltip title="Última edición">
                <Chip label={formulario.ultimaModificacion ? new Date(formulario.ultimaModificacion.seconds * 1000).toLocaleString('es-ES') : 'Sin fecha'} size="small" />
              </Tooltip>
              <Tooltip title={formulario.esPublico ? 'Público' : 'Privado'}>
                <Chip icon={formulario.esPublico ? <PublicIcon /> : null} label={formulario.esPublico ? 'Público' : 'Privado'} size="small" color={formulario.esPublico ? 'success' : 'default'} />
              </Tooltip>
              <Button
                variant={formularioSeleccionadoId === formulario.id ? "contained" : "outlined"}
                color="secondary"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEditar(formulario.id)}
                sx={{ minWidth: 100 }}
              >
                Editar
              </Button>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <b>Propietario:</b> {formulario.creadorNombre || formulario.creadorEmail || 'Desconocido'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <b>Estado:</b> {formulario.estado || 'Sin estado'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <b>Versión:</b> {formulario.version || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <b>Preguntas:</b>
            </Typography>
            {contarPreguntas(formulario) > 0 ? (
              <Box>
                {(Array.isArray(formulario.secciones)
                  ? formulario.secciones
                  : (typeof formulario.secciones === 'object' ? Object.values(formulario.secciones) : [])
                ).map((seccion, sidx) => (
                  <Box key={sidx} mb={1}>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {seccion.nombre || `Sección ${sidx + 1}`}
                    </Typography>
                    <ul style={{ marginTop: 0, marginBottom: 0 }}>
                      {(seccion.preguntas || []).map((pregunta, pidx) => (
                        <li key={sidx + '-' + pidx}>
                          <Typography variant="body2">
                            {typeof pregunta === "string"
                              ? pregunta
                              : (pregunta.titulo || pregunta.texto || pregunta.pregunta || '(Sin texto)')}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled">Sin preguntas</Typography>
            )}
            {/* Aquí puedes agregar más metadatos o secciones si lo necesitas */}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default FormulariosAccordionList; 