// components/BotonGenerarReporte.js
import React, { useState } from "react";
import { Button, Box, Alert, Snackbar } from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { prepararDatosParaFirestore } from "../../../../utils/firestoreUtils";

const BotonGenerarReporte = ({ 
  onClick, 
  deshabilitado, 
  empresa, 
  sucursal, 
  formulario, 
  respuestas, 
  comentarios, 
  imagenes, 
  secciones 
}) => {
  const { user } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [mostrarMensaje, setMostrarMensaje] = useState(false);

  const generarNombreArchivo = () => {
    const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const nombreEmpresa = empresa?.nombre || "Empresa";
    const ubicacion = sucursal && sucursal.trim() !== "" ? `_${sucursal}` : "_CasaCentral";
    const nombreUsuario = user?.displayName || user?.email || "Usuario";
    
    return `${nombreEmpresa}${ubicacion}_${nombreUsuario}_${fecha}`;
  };

  // Función para convertir imagen a base64
  const convertirImagenABase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Función para procesar todas las imágenes
  const procesarImagenes = async (imagenesArray) => {
    const imagenesProcesadas = [];
    
    for (let seccionIndex = 0; seccionIndex < imagenesArray.length; seccionIndex++) {
      const seccionImagenes = [];
      for (let preguntaIndex = 0; preguntaIndex < imagenesArray[seccionIndex].length; preguntaIndex++) {
        const imagen = imagenesArray[seccionIndex][preguntaIndex];
        if (imagen instanceof File) {
          try {
            const base64 = await convertirImagenABase64(imagen);
            seccionImagenes.push({
              nombre: imagen.name,
              tipo: imagen.type,
              tamaño: imagen.size,
              datos: base64
            });
          } catch (error) {
            console.error("Error al procesar imagen:", error);
            seccionImagenes.push(null);
          }
        } else {
          seccionImagenes.push(imagen);
        }
      }
      imagenesProcesadas.push(seccionImagenes);
    }
    
    return imagenesProcesadas;
  };

  // Función para generar estadísticas como en las auditorías antiguas
  const generarEstadisticas = () => {
    const respuestasPlanas = respuestas.flat();
    const conforme = respuestasPlanas.filter((r) => r === "Conforme").length;
    const noConforme = respuestasPlanas.filter((r) => r === "No conforme").length;
    const necesitaMejora = respuestasPlanas.filter((r) => r === "Necesita mejora").length;
    const noAplica = respuestasPlanas.filter((r) => r === "No aplica").length;

    return {
      labels: ["Conforme", "No Conforme", "Necesita Mejora", "No Aplica"],
      datasets: [
        {
          label: "Respuestas",
          data: [conforme, noConforme, necesitaMejora, noAplica],
          backgroundColor: ["#4caf50", "#f44336", "#ff9800", "#9e9e9e"],
        },
      ],
    };
  };

  const handleGuardar = async () => {
    if (!empresa || !formulario) {
      setMensaje("Error: Faltan datos requeridos para guardar");
      setTipoMensaje("error");
      setMostrarMensaje(true);
      return;
    }

    setGuardando(true);
    try {
      // Procesar imágenes antes de guardar
      const imagenesProcesadas = await procesarImagenes(imagenes);

      // Determinar el tipo de ubicación
      const tipoUbicacion = sucursal && sucursal.trim() !== "" ? "Sucursal" : "Casa Central";
      const nombreUbicacion = sucursal && sucursal.trim() !== "" ? sucursal : "Casa Central";

      // Preparar datos para Firestore
      const datosAuditoria = {
        empresa: empresa,
        sucursal: nombreUbicacion,
        respuestas: respuestas.flat(),
        comentarios: comentarios.flat(),
        imagenes: imagenesProcesadas.flat(),
        secciones: secciones,
        estadisticas: generarEstadisticas(),
        fechaGuardado: new Date(),
        formularios: [formulario],
        nombreForm: formulario.nombre,
        usuario: user?.displayName || user?.email || "Usuario desconocido",
        usuarioId: user?.uid,
        estado: "completada",
        nombreArchivo: generarNombreArchivo()
      };

      const docRef = await addDoc(collection(db, "reportes"), datosAuditoria);
      
      setMensaje(`Auditoría de ${tipoUbicacion.toLowerCase()} guardada exitosamente en reportes con ID: ${docRef.id}`);
      setTipoMensaje("success");
      setMostrarMensaje(true);
    } catch (error) {
      console.error("Error al guardar auditoría:", error);
      setMensaje(`Error al guardar: ${error.message}`);
      setTipoMensaje("error");
      setMostrarMensaje(true);
    } finally {
      setGuardando(false);
    }
  };

  const handleImprimir = () => {
    // Usar la función de impresión nativa
    abrirImpresionNativa(empresa, sucursal, formulario, respuestas, comentarios, imagenes, secciones, user);
  };

  const abrirImpresionNativa = (empresa, sucursal, formulario, respuestas, comentarios, imagenes, secciones, user) => {
    const contenido = generarContenidoImpresion();
    const nuevaVentana = window.open('', '_blank', 'width=800,height=600');
    
    nuevaVentana.document.write(contenido);
    nuevaVentana.document.close();
    
    // Esperar a que se cargue el contenido y luego imprimir
    nuevaVentana.onload = () => {
      setTimeout(() => {
        nuevaVentana.print();
      }, 500);
    };
  };

  const generarContenidoImpresion = () => {
    const fecha = new Date().toLocaleDateString('es-ES');
    const hora = new Date().toLocaleTimeString('es-ES');
    
    // Generar contenido HTML para impresión
    let contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Auditoría - ${empresa?.nombre || 'Empresa'}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .empresa-info { margin-bottom: 20px; }
            .seccion { margin-bottom: 30px; page-break-inside: avoid; }
            .seccion h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .pregunta { margin-bottom: 15px; page-break-inside: avoid; }
            .pregunta-texto { font-weight: bold; margin-bottom: 5px; }
            .respuesta { margin-left: 20px; margin-bottom: 5px; }
            .comentario { margin-left: 20px; font-style: italic; color: #666; }
            .imagen { max-width: 200px; max-height: 150px; margin: 10px 0; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @page { margin: 1cm; }
            /* Ocultar elementos en impresión */
            .no-print, button, .MuiButton-root { display: none !important; }
          }
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .empresa-info { margin-bottom: 20px; }
          .seccion { margin-bottom: 30px; }
          .seccion h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .pregunta { margin-bottom: 15px; }
          .pregunta-texto { font-weight: bold; margin-bottom: 5px; }
          .respuesta { margin-left: 20px; margin-bottom: 5px; }
          .comentario { margin-left: 20px; font-style: italic; color: #666; }
          .imagen { max-width: 200px; max-height: 150px; margin: 10px 0; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REPORTE DE AUDITORÍA</h1>
          <p><strong>Fecha:</strong> ${fecha} | <strong>Hora:</strong> ${hora}</p>
        </div>
        
        <div class="empresa-info">
          <h2>Información de la Auditoría</h2>
          <p><strong>Empresa:</strong> ${empresa?.nombre || 'No especificada'}</p>
          <p><strong>Ubicación:</strong> ${sucursal && sucursal.trim() !== "" ? sucursal : 'Casa Central'}</p>
          <p><strong>Formulario:</strong> ${formulario?.nombre || 'No especificado'}</p>
          <p><strong>Auditor:</strong> ${user?.displayName || user?.email || 'Usuario'}</p>
        </div>
    `;

    // Agregar secciones y preguntas
    if (secciones && secciones.length > 0) {
      secciones.forEach((seccion, seccionIndex) => {
        contenido += `
          <div class="seccion">
            <h3>${seccion.nombre}</h3>
        `;

        if (seccion.preguntas && seccion.preguntas.length > 0) {
          seccion.preguntas.forEach((pregunta, preguntaIndex) => {
            const respuesta = respuestas[seccionIndex]?.[preguntaIndex] || 'No respondida';
            const comentario = comentarios[seccionIndex]?.[preguntaIndex] || '';
            const imagen = imagenes[seccionIndex]?.[preguntaIndex];

            contenido += `
              <div class="pregunta">
                <div class="pregunta-texto">${preguntaIndex + 1}. ${pregunta}</div>
                <div class="respuesta"><strong>Respuesta:</strong> ${respuesta}</div>
                ${comentario && comentario.trim() !== '' ? `<div class="comentario"><strong>Comentario:</strong> ${comentario}</div>` : ''}
                ${imagen && imagen instanceof File ? `<div class="imagen"><img src="${URL.createObjectURL(imagen)}" alt="Imagen de la pregunta" style="max-width: 200px; max-height: 150px;" /></div>` : ''}
              </div>
            `;
          });
        }

        contenido += `</div>`;
      });
    }

    contenido += `
        <div class="footer">
          <p>Reporte generado el ${fecha} a las ${hora}</p>
          <p>Auditoría realizada por: ${user?.displayName || user?.email || 'Usuario'}</p>
        </div>
      </body>
      </html>
    `;

    return contenido;
  };

  const handleCerrarMensaje = () => {
    setMostrarMensaje(false);
  };

  return (
    <Box mt={3} display="flex" gap={2} justifyContent="center">
      <Button
        variant="contained"
        color="success"
        onClick={handleGuardar}
        disabled={deshabilitado || guardando}
        size="large"
      >
        {guardando ? "Guardando..." : "Guardar en Reportes"}
      </Button>
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleImprimir}
        disabled={deshabilitado}
        size="large"
      >
        Imprimir PDF
      </Button>

      <Snackbar
        open={mostrarMensaje}
        autoHideDuration={6000}
        onClose={handleCerrarMensaje}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCerrarMensaje} 
          severity={tipoMensaje} 
          sx={{ width: '100%' }}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BotonGenerarReporte;
