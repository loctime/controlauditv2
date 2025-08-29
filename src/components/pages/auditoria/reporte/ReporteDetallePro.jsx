import React, { useRef, forwardRef, useImperativeHandle } from "react";
import PreguntasRespuestasList from "../../../common/PreguntasRespuestasList";
import { Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
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

  const pct = (n) => total > 0 ? ((n / total) * 100).toFixed(2) : "0.00";

  // Para numeración 1.1, 1.2, etc.
  const num = (sIdx, pIdx) => `${sIdx + 1}.${pIdx + 1})`;

  // Helpers seguros
  const val = (x) => (x ?? "").toString();
  const _empresa = empresa || {};
  const empresaNombre = val(_empresa.nombre);
  const empresaDir = val(_empresa.direccion);
  const empresaTel = val(_empresa.telefono);
  const formNombre = val(formulario?.nombre);

  const geo = geolocalizacion && (geolocalizacion.lat || geolocalizacion.lng)
      ? `Latitud: ${geolocalizacion.lat} &nbsp; Longitud: ${geolocalizacion.lng}`
      : "";

  // ===== HTML + CSS estilo "Urquiza" =====
  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Reporte de Auditoría</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
    font-size: 12px;
    line-height: 1.35;
    margin: 0;
  }

  /* Cabecera */
  .header {
    border-bottom: 2px solid #1976d2;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }
  .row { display: flex; flex-wrap: wrap; }
  .col { padding: 4px 6px; }
  .col-50 { width: 50%; }
  .col-33 { width: 33.3333%; }
  .col-25 { width: 25%; }
  .col-100 { width: 100%; }

  .tit {
    font-size: 16px;
    color: #1976d2;
    font-weight: bold;
    margin: 2px 0 6px;
  }
  .subtit {
    font-size: 13px;
    color: #1976d2;
    font-weight: bold;
    margin: 10px 0 6px;
  }

  /* Bloques compactos con línea superior */
  .block {
    border-top: 1px solid #1976d2;
    padding-top: 8px;
    margin-top: 10px;
  }

  /* Etiqueta + dato en una misma línea */
  .kv { margin: 0 0 4px; }
  .kv b { color: #000; }

  /* Tabla resumen porcentajes */
  table {
    border-collapse: collapse;
    width: 100%;
  }
  .t-resumen {
    margin-top: 6px;
    margin-bottom: 8px;
    font-size: 12px;
  }
  .t-resumen th,
  .t-resumen td {
    border: 1px solid #ccc;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  .t-resumen th {
    background: #f2f4f7;
    color: #222;
    font-weight: 700;
  }
  .badge {
    display: inline-block;
    min-width: 18px;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    color: #fff;
    text-align: center;
  }
  .b-conforme { background: #43a047; }
  .b-nc { background: #e53935; }
  .b-nm { background: #fbc02d; color: #000; }
  .b-na { background: #1976d2; }

  /* Gráfico */
  .chart-wrap {
    text-align: center;
    margin: 6px 0 2px;
  }
  .chart {
    display: inline-block;
    width: 420px;
    height: 260px;
    object-fit: contain;
    border: 1px solid #e5e7eb;
    padding: 6px;
    border-radius: 4px;
    background: #fff;
  }
  .legend-hint {
    text-align: center;
    font-size: 11px;
    color: #666;
    margin-top: 2px;
  }

  /* Secciones e ítems */
  .sec-title {
    margin: 14px 0 6px;
    font-size: 14px;
    color: #000;
    font-weight: 700;
  }
  .sec-meta { font-size: 11px; color: #333; margin-bottom: 4px; }

  .item {
    border-left: 3px solid #1976d2;
    background: #f8f9fa;
    padding: 6px 8px;
    margin: 6px 0;
  }
  .item-title { font-weight: 700; margin-bottom: 4px; }
  .item-line { margin: 0 0 2px; }
  .item-line b { color: #000; }
  .thumb {
    margin-top: 4px;
    border: 1px solid #ddd;
    border-radius: 3px;
    max-width: 110px;
    max-height: 80px;
  }

  /* Firmas */
  .firmas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 12px;
  }
  .firma-box { text-align: center; }
  .firma-label {
    color: #1976d2;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .firma-img {
    max-width: 240px;
    max-height: 90px;
    border: 1px solid #43a047;
    border-radius: 4px;
    background: #fff;
  }
  .firma-aclaracion { margin-top: 4px; font-size: 12px; }

  /* Comentarios generales */
  .comentarios {
    border-top: 1px solid #ddd;
    padding-top: 8px;
    margin-top: 12px;
    font-size: 12px;
  }

  /* Footer */
  .footer {
    margin-top: 12px;
    border-top: 1px solid #ddd;
    padding-top: 6px;
    text-align: center;
    color: #888;
    font-size: 10px;
  }

  /* Evitar cortes feos */
  .avoid-break { page-break-inside: avoid; }
</style>
</head>
<body>

  <!-- CABECERA -->
  <div class="header">
    <div class="row">
      <div class="col col-50">
        <div class="tit">ESTABLECIMIENTO</div>
        <div class="kv"><b>${empresaNombre}</b></div>
      </div>
      <div class="col col-50">
        ${empresa?.logo ? `<img src="${empresa.logo}" alt="Logo" style="height:50px; float:right;" />` : ``}
      </div>
    </div>

    <div class="row">
      <div class="col col-33">
        <div class="tit">AUDITORÍA</div>
        <div class="kv">${formNombre || ''}</div>
      </div>
      <div class="col col-33">
        <div class="tit">INICIO AUDITORÍA</div>
        <div class="kv">${fechaInicio || ''}</div>
      </div>
      <div class="col col-33">
        <div class="tit">FIN DE AUDITORÍA</div>
        <div class="kv">${fechaFin || ''}</div>
      </div>
    </div>

    <div class="row block">
      <div class="col col-50">
        <div class="kv"><b>DIRECCIÓN:</b> ${empresaDir}</div>
        <div class="kv"><b>TELÉFONO DEL ESTABLECIMIENTO:</b> ${empresaTel}</div>
      </div>
      <div class="col col-50">
        <div class="kv"><b>AUDITOR:</b> ${nombreAuditor || ''}</div>
        <div class="kv"><b>TEL. DE AUDITOR:</b> ${auditorTelefono}</div>
      </div>
      ${geo ? `<div class="col col-100"><div class="kv"><b>GEOLOCALIZACIÓN</b> &nbsp; ${geo}</div></div>` : ``}
    </div>
  </div>

  <!-- RESUMEN + GRÁFICO -->
  <div class="block avoid-break">
    <div class="subtit">Puntaje Auditoría &nbsp;&nbsp; | &nbsp;&nbsp; Peso &nbsp;&nbsp; | &nbsp;&nbsp; Ítems</div>
    <table class="t-resumen">
      <thead>
        <tr>
          <th>Conforme</th>
          <th>No Conforme</th>
          <th>Necesita Mejora</th>
          <th>No Aplica</th>
          <th>Total de Ítems</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge b-conforme">${C}</span> &nbsp; ${pct(C)}%</td>
          <td><span class="badge b-nc">${NC}</span> &nbsp; ${pct(NC)}%</td>
          <td><span class="badge b-nm">${NM}</span> &nbsp; ${pct(NM)}%</td>
          <td><span class="badge b-na">${NA}</span> &nbsp; ${pct(NA)}%</td>
          <td><b>${total}</b></td>
        </tr>
      </tbody>
    </table>

    ${chartImgDataUrl
      ? `<div class="chart-wrap">
          <img class="chart" src="${chartImgDataUrl}" alt="Distribución general" />
          <div class="legend-hint">Distribución general de respuestas (12 meses / actual)</div>
        </div>`
      : ``}
  </div>

  <!-- SECCIONES E ÍTEMS -->
  <div class="block">
    ${secciones.map((sec, sIdx) => {
      const preguntas = Array.isArray(sec.preguntas) ? sec.preguntas : [];
      // Conteo por sección (por si querés usar mini donuts exportados)
      const local = (respuestas[sIdx] || []);
      const lc = {
        C: local.filter(x => x === 'Conforme').length,
        NC: local.filter(x => x === 'No conforme').length,
        NM: local.filter(x => x === 'Necesita mejora').length,
        NA: local.filter(x => x === 'No aplica').length,
        T: local.length
      };

      const miniChart = sectionChartsImgDataUrl[sIdx]
        ? `<div class="chart-wrap" style="margin:8px 0;"><img class="chart" style="width:320px;height:200px;" src="${sectionChartsImgDataUrl[sIdx]}" alt="Sección ${sIdx+1}" /></div>`
        : ``;

      return `
        <div class="avoid-break">
          <div class="sec-title">${sIdx + 1}) Sección: ${sec.nombre || ('Sección ' + (sIdx + 1))}</div>
          <div class="sec-meta">
            <b>Conforme:</b> ${lc.C} &nbsp;|&nbsp;
            <b>No Conforme:</b> ${lc.NC} &nbsp;|&nbsp;
            <b>Necesita Mejora:</b> ${lc.NM} &nbsp;|&nbsp;
            <b>No Aplica:</b> ${lc.NA} &nbsp;|&nbsp;
            <b>Total:</b> ${lc.T}
          </div>
          ${miniChart}
          ${
            preguntas.map((text, pIdx) => {
              const r = val(respuestas[sIdx]?.[pIdx]) || 'Sin responder';
              const c = val(comentarios[sIdx]?.[pIdx]);
              const img = val(imagenes[sIdx]?.[pIdx]);
              return `
                <div class="item">
                  <div class="item-title">${num(sIdx, pIdx)} ${text || 'Ítem'}</div>
                  <p class="item-line"><b>Resultado:</b> ${r}</p>
                  ${c ? `<p class="item-line"><b>Comentario:</b> ${c}</p>` : ``}
                  ${img ? `<img class="thumb" src="${img}" alt="Evidencia" />` : ``}
                </div>
              `;
            }).join('')
          }
        </div>
      `;
    }).join('')}
  </div>

  <!-- FIRMAS -->
  <div class="block firmas avoid-break">
    <div class="firma-box">
      <div class="firma-label">FIRMA DEL AUDITOR</div>
      ${firmaAuditor ? `<img class="firma-img" src="${firmaAuditor}" alt="Firma Auditor" />` : `<div style="font-size:11px;color:#666;">No hay firma registrada.</div>`}
      <div class="firma-aclaracion">${nombreAuditor || ''}</div>
    </div>
    <div class="firma-box">
      <div class="firma-label">FIRMA DE LA EMPRESA</div>
      ${firmaResponsable ? `<img class="firma-img" src="${firmaResponsable}" alt="Firma Empresa" />` : `<div style="font-size:11px;color:#666;">No hay firma registrada.</div>`}
    </div>
  </div>

  <!-- COMENTARIOS GENERALES -->
  <div class="comentarios">
    <div class="subtit" style="margin:0 0 6px;">COMENTARIOS GENERALES</div>
    <div>El personal toma, en forma positiva, las propuestas, a fin de trabajar en la mejora continua.</div>
  </div>

  <div class="footer">
    Reporte generado el ${new Date().toLocaleString('es-AR')} &nbsp;|&nbsp; ${sucursal ? `Sucursal: ${sucursal} &nbsp;|&nbsp;` : ""} Fecha de auditoría: ${fecha || ""}
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
      {reporte.estadisticas && reporte.estadisticas.conteo && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            📊 Gráfico de Distribución
          </Typography>
          
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