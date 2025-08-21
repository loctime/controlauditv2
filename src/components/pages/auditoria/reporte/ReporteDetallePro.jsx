import React, { useRef, useState, forwardRef, useImperativeHandle } from "react";
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
  console.debug('[normalizarEmpresa] entrada:', empresa);
  
  if (empresa && typeof empresa === "object" && empresa.nombre) {
    console.debug('[normalizarEmpresa] objeto con nombre:', empresa);
    return empresa;
  }
  
  if (typeof empresa === "string" && empresa.trim()) {
    console.debug('[normalizarEmpresa] string válido:', empresa);
    return { nombre: empresa.trim() };
  }
  
  console.debug('[normalizarEmpresa] fallback a vacío');
  return { nombre: "Empresa no disponible" };
};

// Normaliza formulario
const normalizarFormulario = (formulario, nombreForm) => {
  console.debug('[normalizarFormulario] formulario:', formulario, 'nombreForm:', nombreForm);
  
  if (formulario && typeof formulario === "object" && formulario.nombre) {
    console.debug('[normalizarFormulario] objeto con nombre:', formulario);
    return formulario;
  }
  
  if (nombreForm && nombreForm.trim()) {
    console.debug('[normalizarFormulario] usando nombreForm:', nombreForm);
    return { nombre: nombreForm.trim() };
  }
  
  if (typeof formulario === "string" && formulario.trim()) {
    console.debug('[normalizarFormulario] string válido:', formulario);
    return { nombre: formulario.trim() };
  }
  
  console.debug('[normalizarFormulario] fallback a vacío');
  return { nombre: "Formulario no disponible" };
};

// Normaliza imagenes: array de objetos {seccion, valores: [ ... ]} a array de arrays de urls
const normalizarImagenes = (imagenesFirestore, secciones) => {
  console.debug('[normalizarImagenes] imagenesFirestore:', imagenesFirestore);
  console.debug('[normalizarImagenes] secciones:', secciones);
  
  if (!Array.isArray(imagenesFirestore)) {
    console.debug('[normalizarImagenes] imagenesFirestore no es array, retornando array vacío');
    return secciones.map(() => []);
  }
  
  // Si es array de objetos {seccion, valores}
  if (imagenesFirestore.length > 0 && imagenesFirestore[0] && typeof imagenesFirestore[0] === 'object' && Array.isArray(imagenesFirestore[0].valores)) {
    console.debug('[normalizarImagenes] Procesando formato de objetos por sección');
    const resultado = secciones.map((_, idx) => {
      const imgSec = imagenesFirestore.find(img => img.seccion === idx);
      console.debug(`[normalizarImagenes] Sección ${idx}, imgSec:`, imgSec);
      
      if (!imgSec || !Array.isArray(imgSec.valores)) {
        console.debug(`[normalizarImagenes] Sección ${idx} no tiene valores válidos`);
        return [];
      }
      
      const imagenesSeccion = imgSec.valores.map(val => {
        console.debug(`[normalizarImagenes] Procesando valor:`, val);
        if (val && typeof val === "object" && val.url) {
          console.debug(`[normalizarImagenes] Encontrada URL: ${val.url}`);
          return val.url;
        } else if (typeof val === "string") {
          console.debug(`[normalizarImagenes] Encontrada string: ${val}`);
          return val;
        } else {
          console.debug(`[normalizarImagenes] Valor no válido:`, val);
          return "";
        }
      });
      
      console.debug(`[normalizarImagenes] Imágenes de sección ${idx}:`, imagenesSeccion);
      return imagenesSeccion;
    });
    
    console.debug('[normalizarImagenes] Resultado final:', resultado);
    return resultado;
  }
  
  // Si es array de arrays (formato clásico)
  if (Array.isArray(imagenesFirestore[0])) {
    console.debug('[normalizarImagenes] Procesando formato de arrays anidados');
    const resultado = imagenesFirestore.map((seccionImagenes, idx) => {
      console.debug(`[normalizarImagenes] Procesando sección ${idx}:`, seccionImagenes);
      if (!Array.isArray(seccionImagenes)) return [];
      
      return seccionImagenes.map(img => {
        if (img && typeof img === "object" && img.url) {
          return img.url;
        } else if (typeof img === "string") {
          return img;
        } else {
          return "";
        }
      });
    });
    
    console.debug('[normalizarImagenes] Resultado final (formato clásico):', resultado);
    return resultado;
  }
  
  // Si es un objeto plano con claves numéricas
  if (imagenesFirestore.length > 0 && typeof imagenesFirestore[0] === 'object' && !Array.isArray(imagenesFirestore[0])) {
    console.debug('[normalizarImagenes] Procesando formato de objeto plano');
    const resultado = secciones.map((_, idx) => {
      const seccionImagenes = imagenesFirestore[idx];
      console.debug(`[normalizarImagenes] Sección ${idx} del objeto plano:`, seccionImagenes);
      
      if (!seccionImagenes) return [];
      
      if (Array.isArray(seccionImagenes)) {
        return seccionImagenes.map(img => {
          if (img && typeof img === "object" && img.url) {
            return img.url;
          } else if (typeof img === "string") {
            return img;
          } else {
            return "";
          }
        });
      } else if (typeof seccionImagenes === 'object') {
        // Si es un objeto con propiedades numéricas
        const imagenes = [];
        Object.keys(seccionImagenes).forEach(key => {
          const img = seccionImagenes[key];
          if (img && typeof img === "object" && img.url) {
            imagenes.push(img.url);
          } else if (typeof img === "string") {
            imagenes.push(img);
          }
        });
        return imagenes;
      }
      
      return [];
    });
    
    console.debug('[normalizarImagenes] Resultado final (objeto plano):', resultado);
    return resultado;
  }
  
  // Fallback clásico
  console.debug('[normalizarImagenes] Usando fallback, retornando arrays vacíos');
  return secciones.map(() => []);
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
        @page {
          size: A4;
          margin: 2cm;
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          font-size: 12px;
          line-height: 1.4;
        }
        h1 { 
          color: #1976d2; 
          font-size: 24px;
          margin: 0 0 20px 0;
          text-align: center;
        }
        h2 { 
          color: #1976d2; 
          font-size: 16px;
          margin: 0 0 10px 0;
          border-bottom: 1px solid #1976d2;
          padding-bottom: 5px;
        }
        h3 { 
          color: #1976d2; 
          font-size: 14px;
          margin: 15px 0 8px 0;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #1976d2; 
          padding-bottom: 15px; 
          margin-bottom: 20px; 
        }
        .logo { height: 50px; }
        .section { margin-bottom: 20px; }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-box {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        .info-box h2 {
          margin-top: 0;
          font-size: 14px;
        }
        .info-item {
          margin: 5px 0;
          font-size: 11px;
        }
        .firma-img { 
          max-width: 200px; 
          max-height: 80px; 
          border: 1px solid #43a047; 
          border-radius: 5px; 
          margin-top: 5px; 
        }
        .imagenes-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px; 
          font-size: 10px;
        }
        .imagenes-table th, .imagenes-table td { 
          border: 1px solid #ccc; 
          padding: 5px; 
          text-align: left; 
        }
        .imagenes-table th { background: #f5f5f5; }
        .img-preview { max-width: 80px; max-height: 60px; }
        .firma-label { color: #1976d2; font-weight: bold; margin-bottom: 4px; }
        .firma-aclaracion { color: #333; font-size: 12px; margin-top: 4px; }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          color: #888; 
          font-size: 10px; 
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .pregunta-item {
          margin: 8px 0;
          padding: 8px;
          border-left: 3px solid #1976d2;
          background-color: #f8f9fa;
        }
        .pregunta-texto {
          font-weight: bold;
          margin-bottom: 3px;
        }
        .respuesta-texto {
          color: #333;
        }
        .comentario-texto {
          color: #666;
          font-style: italic;
          margin-top: 3px;
        }
        @media print { 
          .no-print { display: none !important; } 
          body { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reporte de Auditoría</h1>
        ${empresa.logo ? `<img src="${empresa.logo}" alt="Logo" class="logo" />` : ''}
      </div>
      
      <div class="info-grid">
        <div class="info-box">
          <h2>Datos de la Empresa</h2>
          <div class="info-item"><strong>Empresa:</strong> ${empresa.nombre || ''}</div>
          <div class="info-item"><strong>Sucursal:</strong> ${sucursal || ''}</div>
          <div class="info-item"><strong>Formulario:</strong> ${formulario.nombre || ''}</div>
          <div class="info-item"><strong>Fecha:</strong> ${fecha}</div>
          <div class="info-item"><strong>Auditor:</strong> ${nombreAuditor}</div>
        </div>
        
        <div class="info-box">
          <h2>Resumen de Respuestas</h2>
          <div class="info-item"><strong>Total de preguntas:</strong> ${totalPreguntas}</div>
          <div class="info-item"><strong>Conforme:</strong> ${conforme}</div>
          <div class="info-item"><strong>No conforme:</strong> ${noConforme}</div>
          <div class="info-item"><strong>Necesita mejora:</strong> ${necesitaMejora}</div>
          <div class="info-item"><strong>No aplica:</strong> ${noAplica}</div>
        </div>
      </div>
      
      <div class="section">
        <h2>Preguntas y Respuestas</h2>
        ${secciones.map((seccion, sIdx) => `
          <div style="margin-bottom: 15px;">
            <h3>${seccion.nombre}</h3>
            ${seccion.preguntas.map((pregunta, pIdx) => `
              <div class="pregunta-item">
                <div class="pregunta-texto">${pregunta}</div>
                <div class="respuesta-texto"><strong>Respuesta:</strong> ${respuestas[sIdx]?.[pIdx] || 'Sin responder'}</div>
                ${comentarios[sIdx]?.[pIdx] ? `<div class="comentario-texto"><strong>Comentario:</strong> ${comentarios[sIdx][pIdx]}</div>` : ''}
                ${imagenes[sIdx]?.[pIdx] ? `<div style="margin-top: 5px;"><img src="${imagenes[sIdx][pIdx]}" class="img-preview" alt="Imagen" /></div>` : ''}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h2>Firmas</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <div class="firma-label">Firma del Auditor</div>
            ${firmaAuditor ? `<img src="${firmaAuditor}" class="firma-img" alt="Firma del auditor" />` : '<p style="font-size: 11px; color: #666;">No hay firma registrada.</p>'}
            <div class="firma-aclaracion">${nombreAuditor}</div>
          </div>
          <div>
            <div class="firma-label">Firma de la Empresa</div>
            ${firmaResponsable ? `<img src="${firmaResponsable}" class="firma-img" alt="Firma de la empresa" />` : '<p style="font-size: 11px; color: #666;">No hay firma registrada.</p>'}
          </div>
        </div>
      </div>
      
      <div class="footer">
        Reporte generado el ${new Date().toLocaleString('es-ES')}
      </div>
    </body>
    </html>
  `;
  return html;
}

const ReporteDetallePro = forwardRef(({ open = false, onClose = () => {}, reporte = null, modo = 'modal', firmaResponsable, onPrint }, ref) => {
  const { userProfile } = useAuth();
  
  console.log('[ReporteDetallePro] Props recibidas:', { open, reporte, modo, firmaResponsable, onPrint });
  console.log('[ReporteDetallePro] reporte completo:', reporte);
  
  // Exponer métodos a través del ref
  useImperativeHandle(ref, () => ({
    printReport: () => {
      if (onPrint) {
        onPrint();
      } else {
        handleImprimir();
      }
    }
  }));
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
  console.log('[ReporteDetallePro] Normalizando secciones...');
  const secciones = Array.isArray(reporte.secciones) ? reporte.secciones : Object.values(reporte.secciones || {});
  console.log('[ReporteDetallePro] Secciones normalizadas:', secciones);
  
  // Normalizar empresa usando todos los campos disponibles
  const empresa = (() => {
    console.debug('[normalizarEmpresa] reporte.empresa:', reporte.empresa);
    console.debug('[normalizarEmpresa] reporte.empresaId:', reporte.empresaId);
    console.debug('[normalizarEmpresa] reporte.empresaNombre:', reporte.empresaNombre);
    
    // Si tenemos objeto completo
    if (reporte.empresa && typeof reporte.empresa === "object" && reporte.empresa.nombre) {
      return reporte.empresa;
    }
    
    // Si tenemos ID y nombre separados
    if (reporte.empresaId && reporte.empresaNombre) {
      return { id: reporte.empresaId, nombre: reporte.empresaNombre };
    }
    
    // Si solo tenemos nombre
    if (reporte.empresaNombre) {
      return { id: reporte.empresaId || 'unknown', nombre: reporte.empresaNombre };
    }
    
    // Si tenemos string
    if (typeof reporte.empresa === "string" && reporte.empresa.trim()) {
      return { id: reporte.empresaId || 'unknown', nombre: reporte.empresa.trim() };
    }
    
    return { id: 'unknown', nombre: "Empresa no disponible" };
  })();
  
  // Normalizar formulario usando todos los campos disponibles
  const formulario = (() => {
    console.debug('[normalizarFormulario] reporte.formulario:', reporte.formulario);
    console.debug('[normalizarFormulario] reporte.formularioId:', reporte.formularioId);
    console.debug('[normalizarFormulario] reporte.formularioNombre:', reporte.formularioNombre);
    console.debug('[normalizarFormulario] reporte.nombreForm:', reporte.nombreForm);
    
    // Si tenemos objeto completo
    if (reporte.formulario && typeof reporte.formulario === "object" && reporte.formulario.nombre) {
      return reporte.formulario;
    }
    
    // Si tenemos ID y nombre separados
    if (reporte.formularioId && reporte.formularioNombre) {
      return { id: reporte.formularioId, nombre: reporte.formularioNombre };
    }
    
    // Si tenemos nombreForm
    if (reporte.nombreForm && reporte.nombreForm.trim()) {
      return { id: reporte.formularioId || 'unknown', nombre: reporte.nombreForm.trim() };
    }
    
    // Si tenemos formularioNombre
    if (reporte.formularioNombre && reporte.formularioNombre.trim()) {
      return { id: reporte.formularioId || 'unknown', nombre: reporte.formularioNombre.trim() };
    }
    
    // Si tenemos string
    if (typeof reporte.formulario === "string" && reporte.formulario.trim()) {
      return { id: reporte.formularioId || 'unknown', nombre: reporte.formulario.trim() };
    }
    
    return { id: 'unknown', nombre: "Formulario no disponible" };
  })();
  
  const sucursal = reporte.sucursal || '';
  const respuestasNormalizadas = normalizarRespuestas(reporte.respuestas || []);
  const imagenesNormalizadas = normalizarImagenes(reporte.imagenes, secciones);
  const comentariosNormalizados = normalizarComentarios(reporte.comentarios, secciones);
  const fecha = (() => {
    console.debug('[normalizarFecha] reporte.fecha:', reporte.fecha);
    console.debug('[normalizarFecha] reporte.fechaGuardado:', reporte.fechaGuardado);
    console.debug('[normalizarFecha] reporte.timestamp:', reporte.timestamp);
    console.debug('[normalizarFecha] reporte.fechaCreacion:', reporte.fechaCreacion);
    console.debug('[normalizarFecha] reporte.fechaActualizacion:', reporte.fechaActualizacion);
    
    // Intentar con reporte.fecha (Timestamp de Firestore)
    if (reporte.fecha && reporte.fecha.seconds) {
      const fechaTimestamp = new Date(reporte.fecha.seconds * 1000);
      console.debug('[normalizarFecha] usando reporte.fecha:', fechaTimestamp);
      return fechaTimestamp.toLocaleDateString('es-ES');
    }
    
    // Intentar con reporte.fechaGuardado (string ISO)
    if (reporte.fechaGuardado) {
      try {
        const fechaGuardado = new Date(reporte.fechaGuardado);
        if (!isNaN(fechaGuardado.getTime())) {
          console.debug('[normalizarFecha] usando reporte.fechaGuardado:', fechaGuardado);
          return fechaGuardado.toLocaleDateString('es-ES');
        }
      } catch (error) {
        console.error('[normalizarFecha] error parseando fechaGuardado:', error);
      }
    }
    
    // Intentar con reporte.timestamp
    if (reporte.timestamp && reporte.timestamp.seconds) {
      const fechaTimestamp = new Date(reporte.timestamp.seconds * 1000);
      console.debug('[normalizarFecha] usando reporte.timestamp:', fechaTimestamp);
      return fechaTimestamp.toLocaleDateString('es-ES');
    }
    
    // Intentar con reporte.fechaCreacion
    if (reporte.fechaCreacion) {
      try {
        const fechaCreacion = new Date(reporte.fechaCreacion);
        if (!isNaN(fechaCreacion.getTime())) {
          console.debug('[normalizarFecha] usando reporte.fechaCreacion:', fechaCreacion);
          return fechaCreacion.toLocaleDateString('es-ES');
        }
      } catch (error) {
        console.error('[normalizarFecha] error parseando fechaCreacion:', error);
      }
    }
    
    // Intentar con reporte.fechaActualizacion
    if (reporte.fechaActualizacion) {
      try {
        const fechaActualizacion = new Date(reporte.fechaActualizacion);
        if (!isNaN(fechaActualizacion.getTime())) {
          console.debug('[normalizarFecha] usando reporte.fechaActualizacion:', fechaActualizacion);
          return fechaActualizacion.toLocaleDateString('es-ES');
        }
      } catch (error) {
        console.error('[normalizarFecha] error parseando fechaActualizacion:', error);
      }
    }
    
    console.debug('[normalizarFecha] fallback a fecha actual');
    return new Date().toLocaleDateString('es-ES');
  })();

  // Debug logs para ver qué datos están llegando
  console.debug('[ReporteDetallePro] reporte completo:', reporte);
  console.debug('[ReporteDetallePro] empresa normalizada:', empresa);
  console.debug('[ReporteDetallePro] formulario normalizado:', formulario);
  console.debug('[ReporteDetallePro] sucursal:', sucursal);
  console.debug('[ReporteDetallePro] fecha:', fecha);
  console.debug('[ReporteDetallePro] reporte.empresa:', reporte.empresa);
  console.debug('[ReporteDetallePro] reporte.formulario:', reporte.formulario);
  console.debug('[ReporteDetallePro] reporte.formularioNombre:', reporte.formularioNombre);
  console.debug('[ReporteDetallePro] reporte.fecha:', reporte.fecha);
  console.debug('[ReporteDetallePro] reporte.fechaGuardado:', reporte.fechaGuardado);

  // Usar la firma pasada por prop o la del reporte
  const firmaResponsableFinal = firmaResponsable || reporte.firmaResponsable;
  console.debug('[ReporteDetallePro] firmaAuditor:', reporte.firmaAuditor);
  console.debug('[ReporteDetallePro] firmaResponsableFinal:', firmaResponsableFinal);

  // Debug logs
  console.debug('[ReporteDetallePro] respuestasNormalizadas:', respuestasNormalizadas);
  console.debug('[ReporteDetallePro] comentariosNormalizados:', comentariosNormalizados);
  console.debug('[ReporteDetallePro] imagenesNormalizadas:', imagenesNormalizadas);
  console.debug('[ReporteDetallePro] reporte.estadisticas:', reporte.estadisticas);
  console.debug('[ReporteDetallePro] reporte.estadisticas?.conteo:', reporte.estadisticas?.conteo);

  // Función de debug temporal
  const debugImagenes = () => {
    console.log('=== DEBUG IMÁGENES ===');
    console.log('Reporte completo:', reporte);
    console.log('Imágenes del reporte:', reporte.imagenes);
    console.log('Secciones:', secciones);
    console.log('Imágenes normalizadas:', imagenesNormalizadas);
    
    // Verificar estructura de imágenes
    if (reporte.imagenes) {
      console.log('Estructura de imágenes:');
      reporte.imagenes.forEach((seccion, idx) => {
        console.log(`Sección ${idx}:`, seccion);
      });
    }
  };

  // Función para probar carga de imágenes
  const probarCargaImagenes = async () => {
    console.log('=== PROBANDO CARGA DE IMÁGENES ===');
    
    if (!reporte.imagenes) {
      console.log('No hay imágenes en el reporte');
      return;
    }

    // Probar diferentes formatos de imágenes
    const testUrls = [];
    
    // Buscar URLs en la estructura de imágenes
    const buscarUrls = (obj, path = '') => {
      if (typeof obj === 'string' && obj.startsWith('http')) {
        testUrls.push({ url: obj, path });
      } else if (typeof obj === 'object' && obj !== null) {
        if (obj.url && typeof obj.url === 'string') {
          testUrls.push({ url: obj.url, path: path + '.url' });
        }
        Object.keys(obj).forEach(key => {
          buscarUrls(obj[key], path + '.' + key);
        });
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          buscarUrls(item, path + '[' + index + ']');
        });
      }
    };

    buscarUrls(reporte.imagenes);
    
    console.log('URLs encontradas:', testUrls);
    
    // Probar cargar cada URL
    for (const { url, path } of testUrls) {
      try {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Imagen cargada exitosamente: ${path} - ${url}`);
        };
        img.onerror = () => {
          console.error(`❌ Error cargando imagen: ${path} - ${url}`);
        };
        img.src = url;
      } catch (error) {
        console.error(`❌ Error probando imagen ${path}:`, error);
      }
    }
  };

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
    
    // Crear un iframe oculto para imprimir
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    
    document.body.appendChild(printFrame);
    
    // Escribir el contenido en el iframe
    printFrame.contentDocument.write(html);
    printFrame.contentDocument.close();
    
    // Imprimir y luego remover el iframe
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    
    // Remover el iframe después de un breve delay
    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 1000);
  };

  // En el modal, eliminar la firma del responsable y mostrar aclaración solo en la firma del auditor
  console.log('[ReporteDetallePro] Renderizando modal...');
  if (modo === 'modal') {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="xl" 
        fullWidth
        fullScreen={window.innerWidth < 768}
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'none'
        }} />
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box>
                         {/* Header con datos del reporte y estadísticas */}
             <Box sx={{ 
               mb: 3, 
               p: 2, 
               bgcolor: 'background.paper', 
               borderRadius: 2, 
               border: '1px solid',
               borderColor: 'divider',
               boxShadow: 1
             }}>
               <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                 📊 Datos del Reporte
               </Typography>
               <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mb: 2 }}>
                 <Typography variant="body2"><b>🏢 Empresa:</b> {empresa.nombre}</Typography>
                 <Typography variant="body2"><b>📍 Sucursal:</b> {sucursal || 'Casa Central'}</Typography>
                 <Typography variant="body2"><b>📋 Formulario:</b> {formulario.nombre}</Typography>
                 <Typography variant="body2"><b>📅 Fecha:</b> {fecha}</Typography>
                 <Typography variant="body2"><b>👤 Auditor:</b> {nombreAuditor}</Typography>
               </Box>
               
               
             </Box>
            
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: 'background.paper', 
              borderRadius: 2, 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 1
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                ❓ Preguntas y Respuestas
              </Typography>
              <PreguntasRespuestasList
                secciones={secciones}
                respuestas={respuestasNormalizadas}
                comentarios={comentariosNormalizados}
                imagenes={imagenesNormalizadas}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <Button 
            onClick={onClose} 
            variant="contained" 
            color="primary"
            size="medium"
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Cerrar
          </Button>
          <Button 
            onClick={handleImprimir} 
            variant="outlined" 
            color="secondary" 
            startIcon={<PrintIcon />}
            size="medium"
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Imprimir
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button 
              onClick={debugImagenes} 
              variant="outlined" 
              color="warning"
              size="small"
              sx={{ minWidth: { xs: '70px', sm: '90px' } }}
            >
              Debug
            </Button>
          )}
          {process.env.NODE_ENV === 'development' && (
            <Button 
              onClick={probarCargaImagenes} 
              variant="outlined" 
              color="info"
              size="small"
              sx={{ minWidth: { xs: '70px', sm: '90px' } }}
            >
              Probar
            </Button>
          )}
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
});

export default ReporteDetallePro;