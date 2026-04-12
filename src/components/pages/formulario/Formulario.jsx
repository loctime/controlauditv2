import logger from '@/utils/logger';
import React, { useState } from "react";
import { Button, TextField, Typography, Box, Paper, Chip, IconButton } from "@mui/material";
import { ArrowBack, Add, Delete, Cancel, Save } from "@mui/icons-material";
import { Timestamp } from "firebase/firestore";
import { useAuth } from '@/components/context/AuthContext';
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import PublicIcon from '@mui/icons-material/Public';
import { formularioService } from '../../../services/formularioService';
const Formulario = () => {
  const { user, userProfile, getUserFormularios } = useAuth();
  const navigate = useNavigate();
  const [nombreFormulario, setNombreFormulario] = useState("");
  const [secciones, setSecciones] = useState([{ nombre: "", preguntas: "" }]);

  const handleChangeNombre = (event) => {
    setNombreFormulario(event.target.value);
  };

  const handleChangeSeccionNombre = (index, event) => {
    const nuevasSecciones = [...secciones];
    nuevasSecciones[index].nombre = event.target.value;
    setSecciones(nuevasSecciones);
  };

  const handleChangePreguntas = (index, event) => {
    const nuevasSecciones = [...secciones];
    nuevasSecciones[index].preguntas = event.target.value;
    setSecciones(nuevasSecciones);
  };

  const handleAgregarSeccion = () => {
    setSecciones([...secciones, { nombre: "", preguntas: "" }]);
  };

  const handleEliminarSeccion = (index) => {
    const nuevasSecciones = [...secciones];
    nuevasSecciones.splice(index, 1);
    setSecciones(nuevasSecciones);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!user) {
      Swal.fire("Error", "Debe iniciar sesión para crear formularios.", "error");
      return;
    }

    try {
      const formularioData = {
        nombre: nombreFormulario,
        secciones: secciones.map((seccion) => ({
          nombre: seccion.nombre,
          preguntas: seccion.preguntas.split("\n").map((pregunta) => pregunta.trim()).filter(Boolean),
        }))
      };
      
      const formularioId = await formularioService.crearFormulario(formularioData, user, userProfile);
      logger.debug("Formulario creado con ID: ", formularioId);
      
      // Invalidar cache offline para forzar recarga de formularios
      try {
        if (window.indexedDB) {
          const request = indexedDB.open('controlaudit_offline_v1', 2);
          await new Promise((resolve, reject) => {
            request.onsuccess = function(event) {
              const db = event.target.result;
              if (!db.objectStoreNames.contains('settings')) {
                resolve();
                return;
              }
              
              const transaction = db.transaction(['settings'], 'readwrite');
              const store = transaction.objectStore('settings');
              
              store.get('complete_user_cache').onsuccess = function(e) {
                const cached = e.target.result;
                if (cached && cached.value) {
                  cached.value.formulariosTimestamp = 0;
                  cached.value.timestamp = Date.now();
                  store.put(cached).onsuccess = () => resolve();
                } else {
                  resolve();
                }
              };
            };
            request.onerror = function(event) {
              reject(event.target.error);
            };
          });
          logger.debug('✅ Cache de formularios invalidado después de crear formulario');
        }
      } catch (cacheError) {
        logger.warn('⚠️ Error invalidando cache de formularios:', cacheError);
      }
      
      // Recargar formularios del contexto después de un pequeño delay
      setTimeout(async () => {
        try {
          await getUserFormularios();
        } catch (error) {
          logger.warn('⚠️ Error recargando formularios del contexto:', error);
        }
      }, 1000);
      
      Swal.fire("Éxito", "Formulario creado exitosamente.", "success");
      
      // Limpiar formulario
      setNombreFormulario("");
      setSecciones([{ nombre: "", preguntas: "" }]);
    } catch (error) {
      logger.error("Error al crear el formulario: ", error);
      Swal.fire("Error", "Error al crear el formulario.", "error");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Botón Volver */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/editar')}
          sx={{ 
            borderRadius: '20px',
            px: 3,
            py: 1
          }}
        >
          Volver a Formularios
        </Button>
        <Typography variant="h5" component="h1" sx={{ flex: 1 }}>
          Crear Nuevo Formulario
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Las preguntas se deben ingresar una debajo de otra por cada sección
      </Typography>

      {/* Contadores informativos */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Chip 
          label={`${secciones.length} secciones`} 
          color="primary" 
          variant="outlined" 
          size="small" 
        />
        <Chip 
          label={`${secciones.reduce((total, seccion) => total + seccion.preguntas.split('\n').filter(p => p.trim()).length, 0)} preguntas totales`} 
          color="secondary" 
          variant="outlined" 
          size="small" 
        />
      </Box>
      

      
      <form onSubmit={handleSubmit}>
        <TextField
          required
          id="nombreFormulario"
          name="nombreFormulario"
          label="Nombre del Formulario"
          fullWidth
          value={nombreFormulario}
          onChange={handleChangeNombre}
          sx={{ mb: 3 }}
        />
        
        {/* Header de secciones */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Secciones</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAgregarSeccion}
            sx={{ borderRadius: '20px' }}
          >
            Agregar sección
          </Button>
        </Box>

        {secciones.map((seccion, index) => {
          const preguntasArray = seccion.preguntas.split('\n').map(p => p.trim()).filter(Boolean);
          return (
            <Paper 
              key={index} 
              sx={{ 
                mb: 3, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              {/* Header de la sección */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'grey.50'
              }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Sección {index + 1}
                </Typography>
                <IconButton
                  color="error"
                  onClick={() => handleEliminarSeccion(index)}
                  aria-label={`Eliminar sección ${index + 1}: ${seccion.nombre || 'sin nombre'}`}
                >
                  <Delete />
                </IconButton>
              </Box>
              
              {/* Contenido de la sección */}
              <Box sx={{ p: 2 }}>
                <TextField
                  required
                  id={`nombreSeccion${index}`}
                  name={`nombreSeccion${index}`}
                  label="Nombre de la Sección"
                  fullWidth
                  value={seccion.nombre}
                  onChange={(event) => handleChangeSeccionNombre(index, event)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  required
                  id={`preguntas${index}`}
                  name={`preguntas${index}`}
                  label="Preguntas (Ingrese una por línea)"
                  multiline
                  fullWidth
                  rows={5}
                  value={seccion.preguntas}
                  onChange={(event) => handleChangePreguntas(index, event)}
                  sx={{ mb: 2 }}
                />
                
                {/* Preview de preguntas como Chips */}
                {preguntasArray.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Vista previa de preguntas:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {preguntasArray.map((pregunta, pregIndex) => (
                        <Chip
                          key={pregIndex}
                          label={`${pregIndex + 1}. ${pregunta}`}
                          variant="outlined"
                          size="small"
                          sx={{ maxWidth: '100%' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </form>
      
      {/* Footer sticky con botones */}
      <Box sx={{ 
        position: 'sticky', 
        bottom: 0, 
        bgcolor: 'background.paper',
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 4
      }}>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/editar')}
          sx={{ borderRadius: '20px' }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit}
          sx={{ borderRadius: '20px' }}
        >
          Guardar formulario
        </Button>
      </Box>
    </Box>
  );
};

export default Formulario;
