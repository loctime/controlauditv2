import React, { useState, useCallback } from "react";
import { useTheme, useMediaQuery, alpha, Box, Button, Card, CardContent, Typography, CircularProgress } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditarSeccionYPreguntas from "./EditarSeccionYPreguntas";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import { useNavigate, useSearchParams } from "react-router-dom";
import FormulariosAccordionList from "./FormulariosAccordionList";

// Hooks personalizados
import { useFormulariosData } from './hooks/useFormulariosData';
import { useFormularioPermisos } from './hooks/useFormularioPermisos';
import { useFormularioSeleccionado } from './hooks/useFormularioSeleccionado';

// Componentes reutilizables
import FormulariosHeader from './components/FormulariosHeader';
import FormularioDetalleCard from './components/FormularioDetalleCard';

const EditarFormulario = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { user, userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recargando, setRecargando] = useState(false);
  const navigate = useNavigate();

  // Hook de datos de formularios
  const { formularios, formulariosCompletos, loading, recargar } = useFormulariosData(user, userProfile);

  // Hook de permisos
  const { puedeEditar, puedeEliminar } = useFormularioPermisos(user, userProfile);

  // Hook de selección
  const { formularioSeleccionado, setFormularioSeleccionado, cargandoFormulario, handleChangeFormulario } = 
    useFormularioSeleccionado(formularios, formulariosCompletos, searchParams, setSearchParams);

  // Ref para scroll
  const edicionRef = React.useRef(null);

  const scrollToEdicion = useCallback(() => {
    if (edicionRef.current) {
      edicionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleEditarDesdeAccordion = useCallback(async (formularioId) => {
    await handleChangeFormulario({ target: { value: formularioId } });
    setTimeout(scrollToEdicion, 300);
  }, [handleChangeFormulario, scrollToEdicion]);

  const handleReload = useCallback(async () => {
    setRecargando(true);
    recargar();
    
    setTimeout(() => {
      setRecargando(false);
      Swal.fire({
        icon: 'success',
        title: 'Lista Actualizada',
        text: 'La lista de formularios se ha recargado exitosamente.',
        timer: 1500,
        showConfirmButton: false
      });
    }, 1000);
  }, [recargar]);

  const handleNavegarGalería = useCallback(() => {
    navigate('/formularios-publicos');
  }, [navigate]);

  const handleCrearFormulario = useCallback(() => {
    navigate("/formulario");
  }, [navigate]);

  const handleVolver = useCallback(() => {
    navigate('/perfil?tab=formularios');
  }, [navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando formularios...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esto puede tomar unos segundos
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: isSmallMobile ? 1 : 3,
      bgcolor: 'background.paper',
      borderRadius: 3,
      border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleVolver}
        aria-label="Volver a perfil, pestaña formularios"
        sx={{ 
          mb: isSmallMobile ? 2 : 3,
          fontSize: isSmallMobile ? '0.875rem' : '1rem'
        }}
      >
        Volver
      </Button>
      
      <FormulariosHeader
        isMobile={isMobile}
        isSmallMobile={isSmallMobile}
        formularios={formularios}
        formularioSeleccionado={formularioSeleccionado}
        onFormularioChange={handleChangeFormulario}
        onCrear={handleCrearFormulario}
        onGaleríaPublica={handleNavegarGalería}
        onReload={handleReload}
        recargando={recargando}
      />
      
      {formularioSeleccionado && formularioSeleccionado.id && (
        <Box 
          sx={{ 
            display: { xs: 'block', md: 'flex' }, 
            gap: isSmallMobile ? 2 : 3, 
            alignItems: 'flex-start',
            mt: isSmallMobile ? 3 : 4
          }} 
          ref={edicionRef}
        >
          <FormularioDetalleCard 
            formulario={formularioSeleccionado} 
            isSmallMobile={isSmallMobile}
          />
          
          <Card 
            sx={{ 
              flex: 2, 
              minWidth: 320,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: isSmallMobile ? 2 : 3 }}>
              <Typography 
                variant={isSmallMobile ? "h6" : "h5"} 
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                  mb: isSmallMobile ? 2 : 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                ✏️ Editar Formulario
              </Typography>
              
              {cargandoFormulario ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: 200,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                  }}
                >
                  <Typography color="info.main" sx={{ fontWeight: 600 }}>
                    Cargando formulario...
                  </Typography>
                </Box>
              ) : (
                <EditarSeccionYPreguntas
                  formularioSeleccionado={formularioSeleccionado}
                  setFormularioSeleccionado={setFormularioSeleccionado}
                  puedeEditar={formularioSeleccionado ? puedeEditar(formularioSeleccionado) : false}
                  puedeEliminar={formularioSeleccionado ? puedeEliminar(formularioSeleccionado) : false}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      )}
      
      {(!formularioSeleccionado || !formularioSeleccionado.id) && (
        <Card 
          sx={{ 
            mt: isSmallMobile ? 3 : 4,
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: isSmallMobile ? 2 : 3 }}>
            <Typography 
              variant={isSmallMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                mb: isSmallMobile ? 2 : 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              📋 Lista de Formularios
            </Typography>
            
            <FormulariosAccordionList
              formularios={formulariosCompletos}
              onEditar={handleEditarDesdeAccordion}
              formularioSeleccionadoId={formularioSeleccionado?.id || null}
              scrollToEdicion={scrollToEdicion}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EditarFormulario;
