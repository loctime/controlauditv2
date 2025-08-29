import React, { useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import PreguntasRespuestasList from "../../../common/PreguntasRespuestasList";
import { Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import EstadisticasChart from './EstadisticasChart';
import EstadisticasChartSimple from './EstadisticasChartSimple';
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

function generarContenidoImpresion({
  empresa,
  sucursal,
  formulario,
  fecha, // string dd/mm/aaaa (o similar)
  respuestas, // array de arrays (ya normalizado)
  secciones,  // [{ nombre, preguntas: [...] }, ...]
  comentarios, // array de arrays (ya normalizado)
  imagenes, // array de arrays (urls o vacío)
  firmaAuditor,
  chartImgDataUrl, // dataURL del gráfico general (Google Charts)
  sectionChartsImgDataUrl = [], // opcional, dataURL por sección
  nombreAuditor,
  firmaResponsable,
  auditorTelefono = "",
  geolocalizacion = null, // { lat, lng } opcional
  fechaInicio = "", // opcional, p.ej. "04/09/2021 - 10:04:56"
  fechaFin = "" // opcional
}) {
  // ===== Resumen general =====
  const flat = (respuestas || []).flat();
  const total = flat.length || 0;

  const contar = (valor) => flat.filter(v => v === valor).length;
  const C = contar('Conforme');
  const NC = contar('No conforme');
  const NM = contar('Necesita mejora');
  const NA = contar('No aplica');

  const pct = (n) => total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";

  // Para numeración 1.1, 1.2, etc.
  const num = (sIdx, pIdx) => `${sIdx + 1}.${pIdx + 1}`;

  // Helpers seguros
  const val = (x) => (x ?? "").toString();
  const _empresa = empresa || {};
  const empresaNombre = val(_empresa.nombre);
  const empresaDir = val(_empresa.direccion);
  const empresaTel = val(_empresa.telefono);
  const formNombre = val(formulario?.nombre);

  const geo = geolocalizacion && (geolocalizacion.lat || geolocalizacion.lng)
      ? `Latitud: ${geolocalizacion.lat} | Longitud: ${geolocalizacion.lng}`
      : "";

  // ===== HTML + CSS estilo PROFESIONAL =====
  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Reporte de Auditoría - ${empresaNombre}</title>
<style>
  @page { 
    size: A4; 
    margin: 15mm 12mm; 
  }
  * { 
    box-sizing: border-box; 
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #2c3e50;
    font-size: 11px;
    line-height: 1.4;
    background: #ffffff;
  }

  /* Header principal */
  .header-main {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo-section {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .logo {
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
    color: #1e3c72;
  }
  
  .company-info h1 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 5px;
  }
  
  .company-info p {
    font-size: 14px;
    opacity: 0.9;
  }
  
  .audit-info {
    text-align: right;
  }
  
  .audit-info h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }
  
  .audit-info p {
    font-size: 12px;
    margin-bottom: 3px;
  }

  /* Información de la auditoría */
  .audit-details {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
  }
  
  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
  }
  
  .detail-label {
    font-weight: 600;
    color: #495057;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }
  
  .detail-value {
    font-size: 12px;
    color: #2c3e50;
    font-weight: 500;
  }

  /* Resumen estadístico */
  .stats-summary {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .stats-title {
    font-size: 16px;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 15px;
    text-align: center;
    border-bottom: 2px solid #3498db;
    padding-bottom: 8px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .stat-card {
    text-align: center;
    padding: 12px 8px;
    border-radius: 6px;
    border: 1px solid #e9ecef;
  }
  
  .stat-card.conforme {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    border-color: #28a745;
  }
  
  .stat-card.no-conforme {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    border-color: #dc3545;
  }
  
  .stat-card.mejora {
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    border-color: #ffc107;
  }
  
  .stat-card.no-aplica {
    background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
    border-color: #17a2b8;
  }
  
  .stat-card.total {
    background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
    border-color: #6c757d;
  }
  
  .stat-number {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 3px;
  }
  
  .stat-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .stat-percentage {
    font-size: 12px;
    font-weight: 500;
    margin-top: 2px;
  }

  /* Gráfico */
  .chart-section {
    text-align: center;
    margin: 20px 0;
  }
  
  .chart-container {
    display: inline-block;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 15px;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .chart-image {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  /* Secciones */
  .sections-container {
    margin-top: 25px;
  }
  
  .section {
    margin-bottom: 30px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .section-header {
    background: linear-gradient(135deg, #495057 0%, #6c757d 100%);
    color: white;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .section-stats {
    background: #f8f9fa;
    padding: 10px 20px;
    border-bottom: 1px solid #e9ecef;
    font-size: 11px;
    color: #6c757d;
  }
  
  .section-chart {
    text-align: center;
    padding: 15px;
    background: white;
    border-bottom: 1px solid #e9ecef;
  }
  
  .section-chart img {
    max-width: 300px;
    height: auto;
    border-radius: 4px;
  }

  /* Preguntas */
  .questions-container {
    padding: 20px;
  }
  
  .question {
    margin-bottom: 20px;
    border-left: 4px solid #3498db;
    background: #f8f9fa;
    border-radius: 0 6px 6px 0;
    padding: 15px;
  }
  
  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .question-number {
    font-weight: 700;
    color: #2c3e50;
    font-size: 12px;
  }
  
  .question-status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-conforme {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .status-no-conforme {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .status-mejora {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
  }
  
  .status-no-aplica {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }
  
  .question-text {
    font-size: 12px;
    color: #2c3e50;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .question-comment {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 8px 12px;
    margin-top: 8px;
    font-size: 11px;
    color: #6c757d;
    font-style: italic;
  }
  
  .question-image {
    margin-top: 10px;
    text-align: center;
  }
  
  .question-image img {
    max-width: 150px;
    max-height: 100px;
    border-radius: 4px;
    border: 1px solid #e9ecef;
  }

  /* Firmas */
  .signatures-section {
    margin-top: 40px;
    padding: 25px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }
  
  .signatures-title {
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 20px;
    border-bottom: 2px solid #3498db;
    padding-bottom: 8px;
  }
  
  .signatures-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
  
  .signature-box {
    text-align: center;
  }
  
  .signature-label {
    font-size: 12px;
    font-weight: 600;
    color: #495057;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .signature-image {
    border: 2px solid #3498db;
    border-radius: 6px;
    padding: 10px;
    background: white;
    margin-bottom: 8px;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .signature-image img {
    max-width: 100%;
    max-height: 70px;
    object-fit: contain;
  }
  
  .signature-name {
    font-size: 11px;
    color: #6c757d;
    font-weight: 500;
  }

  /* Footer */
  .footer {
    margin-top: 30px;
    padding: 15px;
    background: #2c3e50;
    color: white;
    text-align: center;
    border-radius: 6px;
  }
  
  .footer-content {
    font-size: 10px;
    opacity: 0.8;
  }

  /* Utilidades */
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .mb-10 { margin-bottom: 10px; }
  .mb-15 { margin-bottom: 15px; }
  .mt-20 { margin-top: 20px; }
  
  /* Evitar cortes feos */
  .avoid-break { page-break-inside: avoid; }
  
  /* Responsive para impresión */
  @media print {
    body { font-size: 10px; }
    .header-main { padding: 15px; }
    .stats-grid { gap: 10px; }
    .question { margin-bottom: 15px; }
  }
</style>
</head>
<body>

  <!-- HEADER PRINCIPAL -->
  <div class="header-main">
    <div class="header-content">
      <div class="logo-section">
        <div class="logo">
          <img src="/vite.svg" alt="ControlAudit" style="width: 40px; height: 40px; filter: brightness(0) invert(1);" />
        </div>
        <div class="company-info">
          <h1>ControlAudit</h1>
          <p>Sistema de Auditorías Profesionales</p>
        </div>
      </div>
      <div class="audit-info">
        <h2>REPORTE DE AUDITORÍA</h2>
        <p>Fecha: ${fecha}</p>
        <p>Auditor: ${nombreAuditor}</p>
      </div>
    </div>
  </div>

  <!-- INFORMACIÓN DE LA AUDITORÍA -->
  <div class="audit-details">
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Empresa</span>
        <span class="detail-value">${empresaNombre}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Sucursal</span>
        <span class="detail-value">${sucursal || 'Casa Central'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Formulario</span>
        <span class="detail-value">${formNombre}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Teléfono Auditor</span>
        <span class="detail-value">${auditorTelefono || 'No especificado'}</span>
      </div>
      ${empresaDir ? `
      <div class="detail-item">
        <span class="detail-label">Dirección</span>
        <span class="detail-value">${empresaDir}</span>
      </div>
      ` : ''}
      ${empresaTel ? `
      <div class="detail-item">
        <span class="detail-label">Teléfono Empresa</span>
        <span class="detail-value">${empresaTel}</span>
      </div>
      ` : ''}
      ${geo ? `
      <div class="detail-item">
        <span class="detail-label">Geolocalización</span>
        <span class="detail-value">${geo}</span>
      </div>
      ` : ''}
      ${fechaInicio ? `
      <div class="detail-item">
        <span class="detail-label">Inicio Auditoría</span>
        <span class="detail-value">${fechaInicio}</span>
      </div>
      ` : ''}
      ${fechaFin ? `
      <div class="detail-item">
        <span class="detail-label">Fin Auditoría</span>
        <span class="detail-value">${fechaFin}</span>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- RESUMEN ESTADÍSTICO -->
  <div class="stats-summary">
    <div class="stats-title">📊 RESUMEN ESTADÍSTICO DE LA AUDITORÍA</div>
    
    <div class="stats-grid">
      <div class="stat-card conforme">
        <div class="stat-number">${C}</div>
        <div class="stat-label">Conforme</div>
        <div class="stat-percentage">${pct(C)}%</div>
      </div>
      <div class="stat-card no-conforme">
        <div class="stat-number">${NC}</div>
        <div class="stat-label">No Conforme</div>
        <div class="stat-percentage">${pct(NC)}%</div>
      </div>
      <div class="stat-card mejora">
        <div class="stat-number">${NM}</div>
        <div class="stat-label">Necesita Mejora</div>
        <div class="stat-percentage">${pct(NM)}%</div>
      </div>
      <div class="stat-card no-aplica">
        <div class="stat-number">${NA}</div>
        <div class="stat-label">No Aplica</div>
        <div class="stat-percentage">${pct(NA)}%</div>
      </div>
      <div class="stat-card total">
        <div class="stat-number">${total}</div>
        <div class="stat-label">Total</div>
        <div class="stat-percentage">100%</div>
      </div>
    </div>

    ${chartImgDataUrl ? `
    <div class="chart-section">
      <div class="chart-container">
        <img class="chart-image" src="${chartImgDataUrl}" alt="Distribución general de respuestas" style="max-width: 100%; height: auto; border: 2px solid #3498db; border-radius: 8px;" />
      </div>
    </div>
    ` : `
    <div class="chart-section">
      <div class="chart-container" style="border: 2px dashed #e74c3c; padding: 20px; text-align: center;">
        <p style="color: #e74c3c; font-weight: bold;">⚠️ GRÁFICO NO DISPONIBLE</p>
        <p style="color: #7f8c8d; font-size: 12px;">No se pudo generar la imagen del gráfico</p>
      </div>
    </div>
    `}
  </div>

  <!-- SECCIONES -->
  <div class="sections-container">
    ${secciones.map((sec, sIdx) => {
      const preguntas = Array.isArray(sec.preguntas) ? sec.preguntas : [];
      const local = (respuestas[sIdx] || []);
      const lc = {
        C: local.filter(x => x === 'Conforme').length,
        NC: local.filter(x => x === 'No conforme').length,
        NM: local.filter(x => x === 'Necesita mejora').length,
        NA: local.filter(x => x === 'No aplica').length,
        T: local.length
      };

      const miniChart = sectionChartsImgDataUrl[sIdx]
        ? `<div class="section-chart"><img src="${sectionChartsImgDataUrl[sIdx]}" alt="Sección ${sIdx+1}" /></div>`
        : '';

      return `
        <div class="section avoid-break">
          <div class="section-header">
            📋 Sección ${sIdx + 1}: ${sec.nombre || ('Sección ' + (sIdx + 1))}
          </div>
          <div class="section-stats">
            <strong>Estadísticas:</strong> Conforme: ${lc.C} | No Conforme: ${lc.NC} | Necesita Mejora: ${lc.NM} | No Aplica: ${lc.NA} | Total: ${lc.T}
          </div>
          ${miniChart}
          <div class="questions-container">
            ${preguntas.map((text, pIdx) => {
              const r = val(respuestas[sIdx]?.[pIdx]) || 'Sin responder';
              const c = val(comentarios[sIdx]?.[pIdx]);
              const img = val(imagenes[sIdx]?.[pIdx]);
              
              let statusClass = 'status-conforme';
              if (r === 'No conforme') statusClass = 'status-no-conforme';
              else if (r === 'Necesita mejora') statusClass = 'status-mejora';
              else if (r === 'No aplica') statusClass = 'status-no-aplica';
              
              return `
                <div class="question">
                  <div class="question-header">
                    <span class="question-number">${num(sIdx, pIdx)}</span>
                    <span class="question-status ${statusClass}">${r}</span>
                  </div>
                  <div class="question-text">${text || 'Ítem sin descripción'}</div>
                  ${c ? `<div class="question-comment">💬 ${c}</div>` : ''}
                  ${img ? `<div class="question-image"><img src="${img}" alt="Evidencia" /></div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <!-- FIRMAS -->
  <div class="signatures-section avoid-break">
    <div class="signatures-title">✍️ FIRMAS</div>
    <div class="signatures-grid">
      <div class="signature-box">
        <div class="signature-label">Firma del Auditor</div>
        <div class="signature-image">
          ${firmaAuditor ? `<img src="${firmaAuditor}" alt="Firma Auditor" />` : `<span style="color: #6c757d; font-size: 12px;">No hay firma registrada</span>`}
        </div>
        <div class="signature-name">${nombreAuditor || ''}</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">Firma de la Empresa</div>
        <div class="signature-image">
          ${firmaResponsable ? `<img src="${firmaResponsable}" alt="Firma Empresa" />` : `<span style="color: #6c757d; font-size: 12px;">No hay firma registrada</span>`}
        </div>
        <div class="signature-name">Representante de ${empresaNombre}</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-content">
      <strong>ControlAudit</strong> - Sistema de Auditorías Profesionales<br>
      Reporte generado el ${new Date().toLocaleString('es-AR')} | 
      ${sucursal ? `Sucursal: ${sucursal} | ` : ""} 
      Fecha de auditoría: ${fecha || ""}
    </div>
  </div>

</body>
</html>
  `;
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

  // Calcular estadísticas si no están disponibles
  const estadisticasCalculadas = useMemo(() => {
    if (reporte.estadisticas && reporte.estadisticas.conteo) {
      return reporte.estadisticas;
    }
    
    // Calcular estadísticas desde las respuestas normalizadas
    if (respuestasNormalizadas && respuestasNormalizadas.length > 0) {
      const respuestasPlanas = respuestasNormalizadas.flat();
      const estadisticas = {
        Conforme: respuestasPlanas.filter(r => r === "Conforme").length,
        "No conforme": respuestasPlanas.filter(r => r === "No conforme").length,
        "Necesita mejora": respuestasPlanas.filter(r => r === "Necesita mejora").length,
        "No aplica": respuestasPlanas.filter(r => r === "No aplica").length,
      };

      const total = respuestasPlanas.length;
      const porcentajes = {};
      
      Object.keys(estadisticas).forEach(key => {
        porcentajes[key] = total > 0 ? ((estadisticas[key] / total) * 100).toFixed(2) : 0;
      });

      return {
        conteo: estadisticas,
        porcentajes,
        total,
        sinNoAplica: {
          ...estadisticas,
          "No aplica": 0
        }
      };
    }
    
    return null;
  }, [reporte.estadisticas, respuestasNormalizadas]);

  console.debug('[ReporteDetallePro] estadisticasCalculadas:', estadisticasCalculadas);

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
      try {
        chartImgDataUrl = await chartRef.current.getImage();
        console.log('Imagen del gráfico principal generada:', chartImgDataUrl ? 'Sí' : 'No');
      } catch (error) {
        console.error('Error obteniendo imagen del gráfico principal:', error);
      }
    }
    
    // Obtener imágenes de los gráficos por sección
    let sectionChartsImgDataUrl = [];
    if (sectionChartRefs.current && sectionChartRefs.current.length > 0) {
      try {
        sectionChartsImgDataUrl = await Promise.all(
          sectionChartRefs.current.map(async (ref) => {
            if (ref && ref.getImage) {
              try {
                return await ref.getImage();
              } catch (error) {
                console.error('Error obteniendo imagen de gráfico por sección:', error);
                return '';
              }
            }
            return '';
          })
        );
        console.log('Imágenes de gráficos por sección generadas:', sectionChartsImgDataUrl.filter(url => url).length);
      } catch (error) {
        console.error('Error obteniendo imágenes de gráficos por sección:', error);
      }
    }
    // Debug: verificar si tenemos la imagen del gráfico
    console.log('=== DEBUG IMPRESIÓN ===');
    console.log('chartImgDataUrl length:', chartImgDataUrl ? chartImgDataUrl.length : 0);
    console.log('chartImgDataUrl starts with data:', chartImgDataUrl ? chartImgDataUrl.startsWith('data:image') : false);
    console.log('sectionChartsImgDataUrl count:', sectionChartsImgDataUrl.filter(url => url).length);
    
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
      chartImgDataUrl, // Gráfico principal (Google Charts)
      sectionChartsImgDataUrl, // Array de gráficos por sección
      nombreAuditor,
      firmaResponsable: firmaResponsableFinal,
      auditorTelefono: reporte.auditorTelefono || userProfile?.telefono || "",
      geolocalizacion: reporte.geolocalizacion || null,
      fechaInicio: reporte.fechaInicio || "",
      fechaFin: reporte.fechaFin || ""
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
            
                         {/* Gráfico general de respuestas */}
             {(() => {
               console.log('[ReporteDetallePro] Renderizando gráfico:', {
                 estadisticasCalculadas: !!estadisticasCalculadas,
                 conteo: estadisticasCalculadas?.conteo,
                 tieneDatos: estadisticasCalculadas && estadisticasCalculadas.conteo
               });
               // Siempre mostrar el gráfico para debug
               return true;
             })() && (
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
                   📊 Gráfico de Distribución
                 </Typography>
                 
                 {/* Debug info */}
                 <Box sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                   <Typography variant="caption" color="primary" fontWeight="bold">
                     🔍 DEBUG: estadisticasCalculadas = {JSON.stringify(estadisticasCalculadas?.conteo)}
                   </Typography>
                 </Box>
                 
                 <EstadisticasChartSimple
                   ref={chartRef}
                   estadisticas={estadisticasCalculadas?.conteo || { 'Conforme': 0, 'No conforme': 0, 'Necesita mejora': 0, 'No aplica': 0 }}
                   title="Distribución general de respuestas"
                 />
               </Box>
             )}

             {/* Gráficos por sección */}
             {secciones && secciones.length > 1 && respuestasNormalizadas.length === secciones.length && (
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
                   📊 Distribución por Sección
                 </Typography>
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
                       <EstadisticasChartSimple
                         ref={sectionChartRefs.current[idx]}
                         estadisticas={conteo}
                         title={`Sección: ${seccion.nombre}`}
                       />
                     </Box>
                   );
                 })}
               </Box>
             )}

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
      <Typography variant="h4" gutterBottom color="primary" textAlign="center">
        🖨️ Reporte de Auditoría - Estilo Urquiza
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Este reporte usa el nuevo formato profesional estilo "Urquiza" con diseño optimizado para impresión.
        </Typography>
      </Alert>

      {/* Gráfico general de respuestas */}
      {estadisticasCalculadas && estadisticasCalculadas.conteo && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            📊 Gráfico de Distribución
          </Typography>
          
                     <EstadisticasChartSimple
             ref={chartRef}
             estadisticas={estadisticasCalculadas.conteo}
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
                                 <EstadisticasChartSimple
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
        <Typography variant="h6" gutterBottom>
          ❓ Preguntas y Respuestas
        </Typography>
        <PreguntasRespuestasList
          secciones={secciones}
          respuestas={respuestasNormalizadas}
          comentarios={comentariosNormalizados}
          imagenes={imagenesNormalizadas}
        />
      </Box>

      {/* Firmas */}
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
        </Box>
        
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