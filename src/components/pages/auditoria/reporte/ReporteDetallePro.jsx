import React, { useRef, useState } from "react";
import ResumenRespuestas from "../auditoria/ResumenRespuestas";
import ImagenesTable from "./ImagenesTable";
import PreguntasRespuestasList from "../../../common/PreguntasRespuestasList";
import { Typography, Grid, Box, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Alert, Snackbar, Switch, FormControlLabel } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import EstadisticasChart from './EstadisticasChart';
import { useAuth } from '../../../context/AuthContext';

// Normaliza respuestas a array de arrays de strings
const normalizarRespuestas = (res) => {
  if (!Array.isArray(res)) {
    // Si es objeto (caso Firestore), convertir a array
    if (res && typeof res === 'object') {
      res = Object.values(res);
    } else {
      return [];
    }
  }
  // Si es array de objetos {seccion, valores}
  if (res.length > 0 && res[0] && typeof res[0] === 'object' && Array.isArray(res[0].valores)) {
    return res.map(obj => Array.isArray(obj.valores) ? obj.valores : []);
  }
  // Si es array anidado clásico
  return res.map(arr => {
    if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
      arr = Object.values(arr);
    }
    return Array.isArray(arr)
      ? arr.map(val =>
          typeof val === "string"
            ? val
            : (val && typeof val === "object" && val.valor)
              ? val.valor
              : ""
        )
      : [];
  });
};

// Normaliza empresa
const normalizarEmpresa = (empresa) => {
  if (empresa && typeof empresa === "object") return empresa;
  return { nombre: empresa || "" };
};

// Normaliza formulario
const normalizarFormulario = (formulario, nombreForm) => {
  if (formulario && typeof formulario === "object") return formulario;
  return { nombre: nombreForm || "" };
};

// Normaliza imagenes: array de objetos {seccion, valores: [ ... ]} a array de arrays de urls
const normalizarImagenes = (imagenesFirestore, secciones) => {
  if (!Array.isArray(imagenesFirestore)) return [];
  // Si es array de objetos {seccion, valores}
  if (imagenesFirestore.length > 0 && imagenesFirestore[0] && typeof imagenesFirestore[0] === 'object' && Array.isArray(imagenesFirestore[0].valores)) {
    return secciones.map((_, idx) => {
      const imgSec = imagenesFirestore.find(img => img.seccion === idx);
      if (!imgSec || !Array.isArray(imgSec.valores)) return [];
      return imgSec.valores.map(val => (val && typeof val === "object" && val.url) ? val.url : (typeof val === "string" ? val : ""));
    });
  }
  // Fallback clásico
  return secciones.map((_, idx) => []);
};

// Normaliza comentarios: array de objetos {seccion, valores: [ ... ]} a array de arrays de strings
const normalizarComentarios = (comentariosFirestore, secciones) => {
  if (!Array.isArray(comentariosFirestore)) return [];
  // Si es array de objetos {seccion, valores}
  if (comentariosFirestore.length > 0 && comentariosFirestore[0] && typeof comentariosFirestore[0] === 'object' && Array.isArray(comentariosFirestore[0].valores)) {
    return secciones.map((_, idx) => {
      const comSec = comentariosFirestore.find(com => com.seccion === idx);
      if (!comSec || !Array.isArray(comSec.valores)) return [];
      return comSec.valores.map(val => typeof val === "string" ? val : "");
    });
  }
  // Fallback clásico
  return secciones.map((_, idx) => []);
};

function generarContenidoImpresion({empresa, sucursal, formulario, fecha, respuestas, secciones, comentarios, imagenes, firmaAuditor, chartImgDataUrl, sectionChartsImgDataUrl, nombreAuditor, firmaResponsable}) {
  // Resumen de respuestas
  const totalPreguntas = respuestas.flat().length;
  const conforme = respuestas.flat().filter(r => r === 'Conforme').length;
  const noConforme = respuestas.flat().filter(r => r === 'No conforme').length;
  const necesitaMejora = respuestas.flat().filter(r => r === 'Necesita mejora').length;
  const noAplica = respuestas.flat().filter(r => r === 'No aplica').length;

  let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Auditoría</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 24px; }
        h1, h2, h3 { color: #1976d2; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1976d2; padding-bottom: 12px; margin-bottom: 24px; }
        .logo { height: 60px; }
        .section { margin-bottom: 24px; }
        .firma-img { max-width: 300px; max-height: 100px; border: 2px solid #43a047; border-radius: 8px; margin-top: 8px; }
        .imagenes-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .imagenes-table th, .imagenes-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        .imagenes-table th { background: #f5f5f5; }
        .img-preview { max-width: 100px; max-height: 80px; }
        .firma-label { color: #1976d2; font-weight: bold; margin-bottom: 4px; }
        .firma-aclaracion { color: #333; font-size: 15px; margin-top: 4px; }
        .footer { margin-top: 32px; text-align: center; color: #888; font-size: 13px; }
        @media print { .no-print { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reporte de Auditoría</h1>
        ${empresa.logo ? `<img src="${empresa.logo}" alt="Logo" class="logo" />` : ''}
      </div>
      <div class="section">
        <h2>Datos de la Empresa</h2>
        <p><strong>Empresa:</strong> ${empresa.nombre || ''}</p>
        <p><strong>Sucursal:</strong> ${sucursal || ''}</p>
        <p><strong>Formulario:</strong> ${formulario.nombre || ''}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
      </div>
      <div class="section">
        <h2>Resumen de Respuestas</h2>
        <ul>
          <li><strong>Total de preguntas:</strong> ${totalPreguntas}</li>
          <li><strong>Conforme:</strong> ${conforme}</li>
          <li><strong>No conforme:</strong> ${noConforme}</li>
          <li><strong>Necesita mejora:</strong> ${necesitaMejora}</li>
          <li><strong>No aplica:</strong> ${noAplica}</li>
        </ul>
      </div>
      <div class="section">
        <h2>Gráfico de Respuestas</h2>
        ${chartImgDataUrl ? `<img src="${chartImgDataUrl}" style="max-width:400px;" />` : ''}
      </div>
      ${sectionChartsImgDataUrl && sectionChartsImgDataUrl.length > 0 ? `
        <div class="section">
          <h2>Distribución por sección</h2>
          ${sectionChartsImgDataUrl.map((img, idx) => img ? `<div style='margin-bottom:16px;'><b>${secciones[idx]?.nombre || `Sección ${idx+1}`}</b><br/><img src='${img}' style='max-width:350px;max-height:220px;'/></div>` : '').join('')}
        </div>
      ` : ''}
      <div class="section">
        <h2>Preguntas y Respuestas</h2>
        ${secciones.map((seccion, sIdx) => `
          <div style="margin-bottom: 12px;">
            <h3>${seccion.nombre}</h3>
            <ul>
              ${seccion.preguntas.map((pregunta, pIdx) => `
                <li>
                  <strong>${pregunta}</strong><br/>
                  Respuesta: ${respuestas[sIdx]?.[pIdx] || 'Sin responder'}<br/>
                  ${comentarios[sIdx]?.[pIdx] ? `Comentario: ${comentarios[sIdx][pIdx]}` : ''}
                  ${imagenes[sIdx]?.[pIdx] ? `<br/><img src="${imagenes[sIdx][pIdx]}" class="img-preview" alt="Imagen" />` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      <div class="section">
        <h2>Firma del Auditor</h2>
        ${firmaAuditor ? `<img src="${firmaAuditor}" class="firma-img" alt="Firma del auditor" />` : '<p>No hay firma registrada.</p>'}
        <div class="firma-aclaracion">${nombreAuditor}</div>
      </div>
      <div class="section">
        <h2>Firma de la Empresa</h2>
        ${firmaResponsable ? `<img src="${firmaResponsable}" class="firma-img" alt="Firma de la empresa" />` : '<p>No hay firma registrada.</p>'}
      </div>
      <div class="footer">
        Reporte generado el ${new Date().toLocaleString('es-ES')}
      </div>
    </body>
    </html>
  `;
  return html;
}

const ReporteDetallePro = ({ open = false, onClose = () => {}, reporte = null, modo = 'modal', firmaResponsable }) => {
  const { userProfile } = useAuth();
  if (!reporte) {
    return modo === 'modal' ? (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalle de Auditoría
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box p={3} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              Selecciona un reporte para ver el detalle.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    ) : null;
  }

  // Normalizar datos
  const secciones = Array.isArray(reporte.secciones) ? reporte.secciones : Object.values(reporte.secciones || {});
  const empresa = normalizarEmpresa(reporte.empresa);
  const formulario = normalizarFormulario(reporte.formulario, reporte.formularioNombre);
  const sucursal = reporte.sucursal || '';
  const respuestasNormalizadas = normalizarRespuestas(reporte.respuestas || []);
  const imagenesNormalizadas = normalizarImagenes(reporte.imagenes, secciones);
  const comentariosNormalizados = normalizarComentarios(reporte.comentarios, secciones);
  const fecha = reporte.fecha
    ? new Date(reporte.fecha.seconds * 1000).toLocaleDateString('es-ES')
    : reporte.fechaGuardado
    ? new Date(reporte.fechaGuardado).toLocaleDateString('es-ES')
    : 'Fecha no disponible';

  // Usar la firma pasada por prop o la del reporte
  const firmaResponsableFinal = firmaResponsable || reporte.firmaResponsable;
  console.debug('[ReporteDetallePro] firmaAuditor:', reporte.firmaAuditor);
  console.debug('[ReporteDetallePro] firmaResponsableFinal:', firmaResponsableFinal);

  // Debug logs
  console.debug('[ReporteDetallePro] respuestasNormalizadas:', respuestasNormalizadas);
  console.debug('[ReporteDetallePro] comentariosNormalizados:', comentariosNormalizados);
  console.debug('[ReporteDetallePro] imagenesNormalizadas:', imagenesNormalizadas);

  // Ref para el gráfico principal
  const chartRef = useRef();
  // Refs para los gráficos por sección
  const sectionChartRefs = useRef([]);

  // Obtener nombre del auditor para aclaración
  const nombreAuditor = reporte?.auditorNombre || userProfile?.nombre || userProfile?.displayName || userProfile?.email || 'Nombre no disponible';

  const handleImprimir = async () => {
    // Obtener imagen del gráfico principal
    let chartImgDataUrl = '';
    if (chartRef.current && chartRef.current.getImage) {
      chartImgDataUrl = chartRef.current.getImage();
    }
    // Obtener imágenes de los gráficos por sección
    let sectionChartsImgDataUrl = [];
    if (sectionChartRefs.current && sectionChartRefs.current.length > 0) {
      sectionChartsImgDataUrl = sectionChartRefs.current.map(ref =>
        ref && ref.getImage ? ref.getImage() : ''
      );
    }
    // Generar el HTML de impresión, incluyendo firmas y gráficos
    const html = generarContenidoImpresion({
      empresa,
      sucursal,
      formulario,
      fecha,
      respuestas: respuestasNormalizadas,
      secciones,
      comentarios: comentariosNormalizados,
      imagenes: imagenesNormalizadas,
      firmaAuditor: reporte.firmaAuditor,
      chartImgDataUrl, // Gráfico principal
      sectionChartsImgDataUrl, // Array de gráficos por sección
      nombreAuditor, // Añadir nombreAuditor a la función de impresión
      firmaResponsable: firmaResponsableFinal // Añadir firmaResponsable a la función de impresión
    });
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      const imgs = printWindow.document.images;
      let loaded = 0;
      if (imgs.length === 0) {
        printWindow.print();
        return;
      }
      for (let img of imgs) {
        img.onload = img.onerror = () => {
          loaded++;
          if (loaded === imgs.length) {
            setTimeout(() => printWindow.print(), 300);
          }
        };
      }
    };
  };

  // En el modal, eliminar la firma del responsable y mostrar aclaración solo en la firma del auditor
  if (modo === 'modal') {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalle de Auditoría
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Layout superior: Detalle a la izquierda, Resumen+Gráfico a la derecha */}
          <Grid container spacing={3} alignItems="flex-start">
            {/* Izquierda: Detalle de auditoría + gráfico */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Datos de la Empresa</Typography>
                <Typography variant="body1"><b>Empresa:</b> {empresa.nombre}</Typography>
                <Typography variant="body1"><b>Sucursal:</b> {sucursal || 'Casa Central'}</Typography>
                <Typography variant="body1"><b>Formulario:</b> {formulario.nombre}</Typography>
                <Typography variant="body1"><b>Fecha:</b> {fecha}</Typography>
                {/* Gráfico general debajo del detalle */}
                {reporte.estadisticas && reporte.estadisticas.conteo && (
                  <Box mt={3}>
                    <EstadisticasChart
                      ref={chartRef}
                      estadisticas={reporte.estadisticas.conteo}
                      title="Distribución general de respuestas"
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
            {/* Derecha: Resumen de respuestas */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Resumen de Respuestas</Typography>
                <ResumenRespuestas respuestas={respuestasNormalizadas} secciones={secciones} />
              </Paper>
            </Grid>
          </Grid>

          {/* Preguntas y respuestas */}
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>Preguntas y Respuestas</Typography>
            <PreguntasRespuestasList
              secciones={secciones}
              respuestas={respuestasNormalizadas}
              comentarios={comentariosNormalizados}
              imagenes={imagenesNormalizadas}
            />
          </Box>

          {/* Firma del Auditor con aclaración y Firma de la Empresa solo imagen */}
          <Box mt={4} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} justifyContent="center" alignItems="flex-start">
            {/* Firma del Auditor */}
            <Box flex={1} textAlign="center">
              <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
                Firma del Auditor
              </Typography>
              {reporte.firmaAuditor && typeof reporte.firmaAuditor === 'string' && reporte.firmaAuditor.length > 10 ? (
                <Box sx={{ border: '2px solid', borderColor: 'info.main', borderRadius: 1, p: 2, mb: 2, maxWidth: 300, mx: 'auto' }}>
                  <img
                    src={reporte.firmaAuditor}
                    alt="Firma del auditor"
                    style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay firma registrada.
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 1 }}>
                {nombreAuditor}
              </Typography>
              {(!reporte.firmaAuditor || typeof reporte.firmaAuditor !== 'string' || reporte.firmaAuditor.length < 10) && (
                <Typography variant="caption" color="error">
                  [ADVERTENCIA] La firma no está disponible o es inválida.
                </Typography>
              )}
            </Box>
            {/* Firma de la Empresa solo imagen */}
            <Box flex={1} textAlign="center">
              <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
                Firma de la Empresa
              </Typography>
              {firmaResponsableFinal && typeof firmaResponsableFinal === 'string' && firmaResponsableFinal.length > 10 ? (
                <Box sx={{ border: '2px solid', borderColor: 'success.main', borderRadius: 1, p: 2, mb: 2, maxWidth: 300, mx: 'auto' }}>
                  <img
                    src={firmaResponsableFinal}
                    alt="Firma de la empresa"
                    style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay firma registrada.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained" color="primary">
            Cerrar
          </Button>
          <Button onClick={handleImprimir} variant="outlined" color="secondary" startIcon={<PrintIcon />}>
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Si no es modal, renderiza el contenido suelto (por si acaso)
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          Reporte de Auditoría de Higiene y Seguridad
        </Typography>
        {empresa.logo && empresa.logo.trim() !== "" ? (
          <img
            src={empresa.logo}
            alt="Logo de la empresa"
            style={{ height: '60px' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Box
            sx={{
              width: "60px",
              height: "60px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: "#666",
              border: "1px solid #ccc"
            }}
          >
            {empresa.nombre ? empresa.nombre.charAt(0).toUpperCase() : '?'}
          </Box>
        )}
      </Box>
      <Typography variant="h6" gutterBottom>Datos de la Empresa</Typography>
      <Typography variant="body1">Empresa: {empresa.nombre}</Typography>
      <Typography variant="body1">Sucursal: {sucursal}</Typography>
      <Typography variant="body1">Formulario: {formulario.nombre}</Typography>
      <Typography variant="body1">Fecha: {fecha}</Typography>
      {/* Resumen avanzado de respuestas */}
      <ResumenRespuestas respuestas={respuestasNormalizadas} secciones={secciones} />
      {/* Gráfico general de respuestas */}
      {reporte.estadisticas && reporte.estadisticas.conteo && (
        <Box mt={3}>
          <EstadisticasChart
            ref={chartRef}
            estadisticas={reporte.estadisticas.conteo}
            title="Distribución general de respuestas"
          />
        </Box>
      )}
      {/* Gráficos por sección */}
      {secciones && secciones.length > 1 && respuestasNormalizadas.length === secciones.length && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>Distribución por sección</Typography>
          {secciones.map((seccion, idx) => {
            // Calcular conteo por sección
            const conteo = { 'Conforme': 0, 'No conforme': 0, 'Necesita mejora': 0, 'No aplica': 0 };
            (respuestasNormalizadas[idx] || []).forEach(r => {
              if (conteo[r] !== undefined) conteo[r]++;
            });
            // Solo mostrar si hay respuestas
            const total = Object.values(conteo).reduce((a, b) => a + b, 0);
            if (total === 0) return null;
            // Asignar ref dinámico
            if (!sectionChartRefs.current[idx]) sectionChartRefs.current[idx] = React.createRef();
            return (
              <Box key={idx} mt={2}>
                <Typography variant="subtitle1" gutterBottom>{seccion.nombre}</Typography>
                <EstadisticasChart
                  ref={sectionChartRefs.current[idx]}
                  estadisticas={conteo}
                  title={`Sección: ${seccion.nombre}`}
                />
              </Box>
            );
          })}
        </Box>
      )}
      {/* Preguntas, respuestas, comentarios e imágenes */}
      <Box mt={3}>
        <PreguntasRespuestasList
          secciones={secciones}
          respuestas={respuestasNormalizadas}
          comentarios={comentariosNormalizados}
          imagenes={imagenesNormalizadas}
        />
      </Box>
      {/* Firma del Auditor con aclaración y Firma de la Empresa solo imagen en la vista suelta */}
      <Box mt={3} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} justifyContent="center" alignItems="flex-start">
        <Box flex={1} textAlign="center">
          <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
            Firma del Auditor
          </Typography>
          {reporte.firmaAuditor && typeof reporte.firmaAuditor === 'string' && reporte.firmaAuditor.length > 10 ? (
            <Box sx={{ border: '2px solid', borderColor: 'info.main', borderRadius: 1, p: 2, mb: 2, maxWidth: 300 }}>
              <img
                src={reporte.firmaAuditor}
                alt="Firma del auditor"
                style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay firma registrada.
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1 }}>
            {nombreAuditor}
          </Typography>
          {(!reporte.firmaAuditor || typeof reporte.firmaAuditor !== 'string' || reporte.firmaAuditor.length < 10) && (
            <Typography variant="caption" color="error">
              [ADVERTENCIA] La firma no está disponible o es inválida.
            </Typography>
          )}
        </Box>
        {/* Firma de la Empresa solo imagen */}
        <Box flex={1} textAlign="center">
          <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
            Firma de la Empresa
          </Typography>
          {firmaResponsableFinal && typeof firmaResponsableFinal === 'string' && firmaResponsableFinal.length > 10 ? (
            <Box sx={{ border: '2px solid', borderColor: 'success.main', borderRadius: 1, p: 2, mb: 2, maxWidth: 300 }}>
              <img
                src={firmaResponsableFinal}
                alt="Firma de la empresa"
                style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay firma registrada.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ReporteDetallePro;