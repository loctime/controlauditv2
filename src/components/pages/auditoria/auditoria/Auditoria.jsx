import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import SeleccionEmpresa from "./SeleccionEmpresa";
import SeleccionSucursal from "./SeleccionSucursal";
import SeleccionFormulario from "./SeleccionFormulario";
import PreguntasYSeccion from "./PreguntasYSeccion";
import Reporte from "./Reporte";
import BotonGenerarReporte from "./BotonGenerarReporte";
import { Typography, Grid, Alert, Box, Button, Paper, Container, IconButton, Divider } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const Auditoria = () => {
  const { userProfile, userEmpresas, canViewEmpresa } = useAuth();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [formularioSeleccionadoId, setFormularioSeleccionadoId] = useState("");
  const [secciones, setSecciones] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [errores, setErrores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [auditoriaGenerada, setAuditoriaGenerada] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerEmpresas = async () => {
      try {
        if (!userProfile) return;
        
        // Obtener todas las empresas y filtrar por permisos
        const empresasCollection = collection(db, "empresas");
        const snapshot = await getDocs(empresasCollection);
        const todasLasEmpresas = snapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.data().nombre,
          logo: doc.data().logo,
          propietarioId: doc.data().propietarioId,
        }));
        
        // Filtrar empresas que el usuario puede ver
        const empresasPermitidas = todasLasEmpresas.filter(empresa => 
          canViewEmpresa(empresa.id)
        );
        
        setEmpresas(empresasPermitidas);
      } catch (error) {
        console.error("Error al obtener empresas:", error);
      }
    };

    obtenerEmpresas();
  }, [userProfile, canViewEmpresa]);

  useEffect(() => {
    const obtenerSucursales = async () => {
      if (empresaSeleccionada) {
        try {
          const sucursalesCollection = collection(db, "sucursales");
          const q = query(sucursalesCollection, where("empresa", "==", empresaSeleccionada.nombre));
          const snapshot = await getDocs(q);
          const sucursalesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            nombre: doc.data().nombre,
          }));
          setSucursales(sucursalesData);
        } catch (error) {
          console.error("Error al obtener sucursales:", error);
        }
      } else {
        setSucursales([]);
      }
    };

    obtenerSucursales();
  }, [empresaSeleccionada]);

  useEffect(() => {
    const obtenerFormularios = async () => {
      try {
        if (!userProfile) return;
        
        const formulariosCollection = collection(db, "formularios");
        const snapshot = await getDocs(formulariosCollection);
        const todosLosFormularios = snapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.data().nombre,
          secciones: doc.data().secciones,
          creadorId: doc.data().creadorId,
          creadorEmail: doc.data().creadorEmail,
          esPublico: doc.data().esPublico,
          permisos: doc.data().permisos
        }));

        // ✅ Filtrar formularios por permisos
        const formulariosPermitidos = todosLosFormularios.filter(formulario => {
          // Administradores ven todos los formularios
          if (userProfile.role === 'max') {
            return true;
          }

          // Usuarios ven sus propios formularios
          if (formulario.creadorId === userProfile.uid) {
            return true;
          }

          // Formularios públicos
          if (formulario.esPublico) {
            return true;
          }

          // Formularios donde el usuario tiene permisos explícitos
          if (formulario.permisos?.puedeVer?.includes(userProfile.uid)) {
            return true;
          }

          return false;
        });

        setFormularios(formulariosPermitidos);
        console.log(`✅ Formularios disponibles para auditoría: ${formulariosPermitidos.length} de ${todosLosFormularios.length} totales`);
      } catch (error) {
        console.error("Error al obtener formularios:", error);
      }
    };

    obtenerFormularios();
  }, [userProfile]);

  useEffect(() => {
    if (formularioSeleccionadoId) {
      const formularioSeleccionado = formularios.find((formulario) => formulario.id === formularioSeleccionadoId);
      
      if (!formularioSeleccionado || !formularioSeleccionado.secciones) {
        setSecciones([]);
        setRespuestas([]);
        setComentarios([]);
        setImagenes([]);
        return;
      }

      const seccionesArray = Array.isArray(formularioSeleccionado.secciones)
        ? formularioSeleccionado.secciones
        : Object.values(formularioSeleccionado.secciones);

      setSecciones(seccionesArray);
      setRespuestas(seccionesArray.map(seccion => Array(seccion.preguntas.length).fill('')));
      setComentarios(seccionesArray.map(seccion => Array(seccion.preguntas.length).fill('')));
      setImagenes(seccionesArray.map(seccion => Array(seccion.preguntas.length).fill(null)));
    }
  }, [formularioSeleccionadoId, formularios]);

  useEffect(() => {
    if (empresaSeleccionada) {
      setSucursalSeleccionada("");
    }
  }, [empresaSeleccionada]);

  // Efecto para manejar automáticamente la sucursal cuando no hay sucursales
  useEffect(() => {
    if (empresaSeleccionada && sucursales.length === 0) {
      // Si no hay sucursales, establecer un valor por defecto
      setSucursalSeleccionada("Sin sucursal específica");
    } else if (empresaSeleccionada && sucursales.length > 0 && sucursalSeleccionada === "Sin sucursal específica") {
      // Si ahora hay sucursales pero estaba el valor por defecto, resetear
      setSucursalSeleccionada("");
    }
  }, [empresaSeleccionada, sucursales.length, sucursalSeleccionada]);

  const handleEmpresaChange = (selectedEmpresa) => {
    setEmpresaSeleccionada(selectedEmpresa);
    setSucursalSeleccionada(""); // Reset sucursal when empresa changes
    setFormularioSeleccionadoId(""); // Reset formulario when empresa changes
  };

  const handleSucursalChange = (e) => {
    setSucursalSeleccionada(e.target.value);
  };

  const handleSeleccionarFormulario = (e) => {
    setFormularioSeleccionadoId(e.target.value);
  };

  // Función para verificar si se puede continuar con la auditoría
  const puedeContinuarConAuditoria = () => {
    // Siempre se puede continuar si hay una empresa seleccionada
    // La sucursal es opcional - puede ser casa central o una sucursal específica
    return empresaSeleccionada !== null;
  };

  // Función para obtener el tipo de ubicación
  const obtenerTipoUbicacion = () => {
    if (!empresaSeleccionada) return "";
    
    if (sucursales.length === 0) {
      return "Casa Central";
    }
    
    if (sucursalSeleccionada && sucursalSeleccionada !== "Sin sucursal específica") {
      return `Sucursal: ${sucursalSeleccionada}`;
    }
    
    return "Casa Central";
  };

  const handleGuardarRespuestas = (nuevasRespuestas) => {
    setRespuestas(nuevasRespuestas);
  };

  const handleGuardarComentario = (nuevosComentarios) => {
    setComentarios(nuevosComentarios);
  };

  const handleGuardarImagenes = (nuevasImagenes) => {
    setImagenes(nuevasImagenes);
  };

  const todasLasPreguntasContestadas = () => {
    return respuestas.every(seccionRespuestas => 
      seccionRespuestas.every(respuesta => respuesta !== '')
    );
  };

  const generarReporte = () => {
    if (todasLasPreguntasContestadas()) {
      setMostrarReporte(true);
      setErrores([]); // Clear errors if generating report
      setAuditoriaGenerada(true); // Mark as auditoria generada
    } else {
      setErrores(["Por favor, responda todas las preguntas antes de generar el reporte."]);
    }
  };

  const generarNuevaAuditoria = () => {
    setEmpresaSeleccionada(null);
    setSucursalSeleccionada("");
    setFormularioSeleccionadoId("");
    setSecciones([]);
    setRespuestas([]);
    setComentarios([]);
    setImagenes([]);
    setMostrarReporte(false);
    setAuditoriaGenerada(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Botón Atrás SIEMPRE visible */}
      <Box display="flex" alignItems="center" mb={2}>
        <Button
          onClick={() => navigate('/establecimiento')}
          color="primary"
          sx={{ fontWeight: 'bold', textTransform: 'none' }}
          startIcon={<ArrowBackIcon />}
          size="large"
        >
          Atrás
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold', ml: 2 }}>
          Auditoría
        </Typography>
      </Box>
      {/* Cabecera empresa seleccionada */}
      {empresaSeleccionada && (
        <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: 'fit-content' }}>
            Empresa:
          </Typography>
          <Typography variant="h6" color="primary" sx={{ flex: 1 }}>
            {empresaSeleccionada.nombre}
          </Typography>
          {empresaSeleccionada.logo && empresaSeleccionada.logo.trim() !== "" ? (
            <img
              src={empresaSeleccionada.logo}
              alt={`Logo de ${empresaSeleccionada.nombre}`}
              style={{ width: "60px", height: "60px", objectFit: 'contain', borderRadius: '8px' }}
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
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                color: "#666",
                border: "2px dashed #ccc"
              }}
            >
              {empresaSeleccionada.nombre.charAt(0).toUpperCase()}
            </Box>
          )}
        </Paper>
      )}
      <Divider sx={{ mb: 4 }} />
      {!auditoriaGenerada ? (
        <>
          <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
            Nueva Auditoría
          </Typography>
          
          {/* Sección de Selección de Empresa y Sucursal */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
              Paso 1: Seleccionar Empresa y Ubicación
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SeleccionEmpresa
                  empresas={empresas}
                  empresaSeleccionada={empresaSeleccionada}
                  onChange={handleEmpresaChange}
                />
              </Grid>
              
              {empresaSeleccionada && (
                <Grid item xs={12} md={6}>
                  {sucursales.length > 0 ? (
                    <SeleccionSucursal
                      sucursales={sucursales}
                      sucursalSeleccionada={sucursalSeleccionada}
                      onChange={handleSucursalChange}
                    />
                  ) : (
                    <Box
                      sx={{
                        p: 3,
                        border: '2px solid #e0e0e0',
                        borderRadius: 2,
                        backgroundColor: '#f8f9fa',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6" color="primary" gutterBottom>
                        Casa Central
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Esta empresa no tiene sucursales registradas. 
                        La auditoría se realizará en casa central.
                      </Typography>
                    </Box>
                  )}
                </Grid>
              )}
            </Grid>

            {/* Logo de la empresa */}
            {empresaSeleccionada && (
              <Box 
                mt={3} 
                p={2} 
                sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2, 
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: 'fit-content' }}>
                  Empresa seleccionada:
                </Typography>
                <Typography variant="h6" color="primary" sx={{ flex: 1 }}>
                  {empresaSeleccionada.nombre}
                </Typography>
                {empresaSeleccionada.logo && empresaSeleccionada.logo.trim() !== "" ? (
                  <img
                    src={empresaSeleccionada.logo}
                    alt={`Logo de ${empresaSeleccionada.nombre}`}
                    style={{ 
                      width: "60px", 
                      height: "60px", 
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
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
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      color: "#666",
                      border: "2px dashed #ccc"
                    }}
                  >
                    {empresaSeleccionada.nombre.charAt(0).toUpperCase()}
                  </Box>
                )}
              </Box>
            )}

            {/* Información de ubicación */}
            {empresaSeleccionada && (
              <Box mt={2}>
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <Typography variant="body1">
                    <strong>Ubicación seleccionada:</strong> {obtenerTipoUbicacion()}
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Instrucciones para sucursales */}
            {empresaSeleccionada && sucursales.length > 0 && (
              <Box mt={2}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Opciones disponibles:
                  </Typography>
                  <Typography variant="body2">
                    • Seleccione una sucursal específica para auditar esa ubicación
                  </Typography>
                  <Typography variant="body2">
                    • Deje vacío para auditar casa central
                  </Typography>
                </Alert>
              </Box>
            )}
          </Paper>

          {/* Sección de Selección de Formulario */}
          {empresaSeleccionada && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                Paso 2: Seleccionar Formulario de Auditoría
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SeleccionFormulario
                    formularios={formularios}
                    formularioSeleccionadoId={formularioSeleccionadoId}
                    onChange={handleSeleccionarFormulario}
                    disabled={!empresaSeleccionada}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Mensaje cuando no hay empresa seleccionada */}
          {!empresaSeleccionada && (
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body1">
                  Por favor, seleccione una empresa para continuar con la auditoría.
                </Typography>
              </Alert>
            </Paper>
          )}

          {/* Sección de Preguntas */}
          {formularioSeleccionadoId && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                Paso 3: Responder Preguntas de Auditoría
              </Typography>
              
              <PreguntasYSeccion
                secciones={secciones}
                guardarRespuestas={handleGuardarRespuestas}
                guardarComentario={handleGuardarComentario}
                guardarImagenes={handleGuardarImagenes}
              />
            </Paper>
          )}

          {/* Botón Generar Reporte */}
          {formularioSeleccionadoId && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                Paso 4: Generar Reporte
              </Typography>
              
              <BotonGenerarReporte
                onClick={generarReporte}
                deshabilitado={!todasLasPreguntasContestadas()}
                empresa={empresaSeleccionada}
                sucursal={sucursalSeleccionada}
                formulario={formularios.find(formulario => formulario.id === formularioSeleccionadoId)}
                respuestas={respuestas}
                comentarios={comentarios}
                imagenes={imagenes}
                secciones={secciones}
              />
            </Paper>
          )}

          {/* Errores */}
          {errores.length > 0 && (
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {errores.map((error, index) => (
                  <Typography key={index} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Alert>
            </Paper>
          )}
        </>
      ) : (
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'success.main' }}>
            ✅ Auditoría Generada Exitosamente
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            La auditoría ha sido completada y guardada. Puede generar una nueva auditoría o revisar el reporte generado.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={generarNuevaAuditoria}
            sx={{ px: 4, py: 1.5 }}
          >
            Generar Nueva Auditoría
          </Button>
        </Paper>
      )}

      {/* Reporte */}
      {mostrarReporte && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Reporte 
            empresa={empresaSeleccionada} 
            sucursal={sucursalSeleccionada} 
            formulario={formularios.find(formulario => formulario.id === formularioSeleccionadoId)}
            respuestas={respuestas} 
            comentarios={comentarios}
            imagenes={imagenes}
            secciones={secciones} 
          />
        </Paper>
      )}
    </Container>
  );
};

export default Auditoria;
