// Componente optimizado para generar reportes de auditoría
import React, { useState } from "react";
import { Button, Box, Alert, Snackbar, CircularProgress } from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import AuditoriaService from "../auditoriaService";
import { buildReporteMetadata } from '../../../../services/useMetadataService';

const BotonGenerarReporte = ({ 
  onClick, 
  deshabilitado, 
  empresa, 
  sucursal, 
  formulario, 
  respuestas, 
  comentarios, 
  imagenes, 
  secciones,
  firmaAuditor,
  firmaResponsable,
  onFinalizar
}) => {
  const { user, userProfile } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [mostrarMensaje, setMostrarMensaje] = useState(false);

  const handleGuardar = async () => {
    if (!empresa || !formulario) {
      setMensaje("Error: Faltan datos requeridos para guardar");
      setTipoMensaje("error");
      setMostrarMensaje(true);
      return;
    }

    if (!firmaAuditor || !firmaResponsable) {
      setMensaje("Error: Ambas firmas digitales son requeridas");
      setTipoMensaje("error");
      setMostrarMensaje(true);
      return;
    }

    setGuardando(true);
    try {
      // Construir l metadatos consistentes y multi-tenant
      const datosAuditoria = buildReporteMetadata({
        empresa,
        sucursal,
        formulario,
        respuestas,
        comentarios,
        imagenes,
        secciones,
        firmaAuditor,
        firmaResponsable,
        // Multi-tenant
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid,
        usuarioId: userProfile?.uid,
        usuarioEmail: userProfile?.email,
        fechaGuardado: new Date(),
      });
      console.debug('[BotonGenerarReporte] Guardando auditoría con metadatos:', datosAuditoria);

      // Usar el servicio centralizado para guardar
      const auditoriaId = await AuditoriaService.guardarAuditoria(datosAuditoria, userProfile);
      
      setGuardadoExitoso(true);
      const tipoUbicacion = sucursal && sucursal.trim() !== "" ? "Sucursal" : "Casa Central";
      setMensaje(`✅ Auditoría de ${tipoUbicacion.toLowerCase()} guardada exitosamente con ID: ${auditoriaId}`);
      setTipoMensaje("success");
      setMostrarMensaje(true);
      
      // Llamar callback de finalización
      if (onFinalizar) {
        onFinalizar();
      }
    } catch (error) {
      setGuardadoExitoso(false);
      console.error("❌ Error al guardar auditoría:", error);
      setMensaje(`❌ Error al guardar: ${error.message}`);
      setTipoMensaje("error");
      setMostrarMensaje(true);
    } finally {
      setGuardando(false);
    }
  };

  const handleImprimir = () => {
    // Usar la función de impresión nativa
    abrirImpresionNativa(empresa, sucursal, formulario, respuestas, comentarios, imagenes, secciones, user, firmaAuditor, firmaResponsable);
  };

  const abrirImpresionNativa = (empresa, sucursal, formulario, respuestas, comentarios, imagenes, secciones, user, firmaAuditor, firmaResponsable) => {
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
            .firmas { margin-top: 30px; display: flex; justify-content: space-between; }
            .firma { text-align: center; width: 45%; }
            .firma img { max-width: 200px; max-height: 100px; border: 1px solid #ccc; }
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
          .firmas { margin-top: 30px; display: flex; justify-content: space-between; }
          .firma { text-align: center; width: 45%; }
          .firma img { max-width: 200px; max-height: 100px; border: 1px solid #ccc; }
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

    // Agregar sección de firmas
    contenido += `
        <div class="firmas">
          <div class="firma">
            <h4>Firma del Auditor</h4>
            ${firmaAuditor ? `<img src="${firmaAuditor}" alt="Firma del Auditor" />` : '<p>Sin firma</p>'}
            <p><strong>${user?.displayName || user?.email || 'Usuario'}</strong></p>
          </div>
          <div class="firma">
            <h4>Firma del Responsable</h4>
            ${firmaResponsable ? `<img src="${firmaResponsable}" alt="Firma del Responsable" />` : '<p>Sin firma</p>'}
            <p><strong>Responsable de la Empresa</strong></p>
          </div>
        </div>
    `;

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
        disabled={deshabilitado || guardando || guardadoExitoso}
        size="large"
        startIcon={guardando ? <CircularProgress size={20} color="inherit" /> : null}
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
      
      {/* Botón Finalizar solo visible tras guardado exitoso */}
      {guardadoExitoso && (
        <Button
          variant="contained"
          color="primary"
          onClick={onFinalizar}
          size="large"
        >
          Finalizar
        </Button>
      )}
      
      {/* Mensajes */}
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
