// Utilidades de normalización para reportes de auditoría
// Funciones extraídas de ReporteDetallePro.jsx para mejorar mantenibilidad

// Normaliza respuestas a array de arrays de strings
export const normalizarRespuestas = (res) => {
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
export const normalizarEmpresa = (empresa) => {
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
export const normalizarFormulario = (formulario, nombreForm) => {
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
export const normalizarImagenes = (imagenesFirestore, secciones) => {
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
        
        // Si es un objeto con URL válida
        if (val && typeof val === "object" && val.url && typeof val.url === 'string') {
          console.debug(`[normalizarImagenes] Encontrada URL: ${val.url}`);
          return val.url;
        } 
        
        // Si es string válido (no "[object Object]")
        else if (typeof val === "string" && val.trim() !== '' && val !== '[object Object]') {
          console.debug(`[normalizarImagenes] Encontrada string: ${val}`);
          return val;
        } 
        
        // Si es "[object Object]", es una imagen corrupta
        else if (typeof val === "string" && val === '[object Object]') {
          console.warn(`[normalizarImagenes] Imagen corrupta "[object Object]" detectada`);
          return "";
        }
        
        // Cualquier otro caso
        else {
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
        if (img && typeof img === "object" && img.url && typeof img.url === 'string') {
          return img.url;
        } else if (typeof img === "string" && img.trim() !== '' && img !== '[object Object]') {
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
          if (img && typeof img === "object" && img.url && typeof img.url === 'string') {
            return img.url;
          } else if (typeof img === "string" && img.trim() !== '' && img !== '[object Object]') {
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
          if (img && typeof img === "object" && img.url && typeof img.url === 'string') {
            imagenes.push(img.url);
          } else if (typeof img === "string" && img.trim() !== '' && img !== '[object Object]') {
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
export const normalizarComentarios = (comentariosFirestore, secciones) => {
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

// Normaliza fecha desde diferentes formatos de Firestore
export const normalizarFecha = (reporte) => {
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
};

// Normaliza empresa usando todos los campos disponibles del reporte
export const normalizarEmpresaCompleta = (reporte) => {
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
};

// Normaliza clasificaciones: array de objetos {seccion, valores: [ ... ]} a array de arrays de objetos { condicion: boolean, actitud: boolean }
export const normalizarClasificaciones = (clasificacionesFirestore, secciones) => {
  console.log('🔍 [normalizarClasificaciones] clasificacionesFirestore:', clasificacionesFirestore);
  console.log('🔍 [normalizarClasificaciones] Tipo:', typeof clasificacionesFirestore, Array.isArray(clasificacionesFirestore));
  console.log('🔍 [normalizarClasificaciones] secciones:', secciones);
  
  if (!clasificacionesFirestore || (Array.isArray(clasificacionesFirestore) && clasificacionesFirestore.length === 0)) {
    console.debug('[normalizarClasificaciones] No hay clasificaciones o array vacío, retornando arrays con valores por defecto');
    return secciones.map((seccion) => 
      Array(seccion?.preguntas?.length || 0).fill({ condicion: false, actitud: false })
    );
  }
  
  if (!Array.isArray(clasificacionesFirestore)) {
    // Si es objeto (caso Firestore), convertir a array
    if (clasificacionesFirestore && typeof clasificacionesFirestore === 'object') {
      // Verificar si es un objeto con claves numéricas (formato Firestore)
      const keys = Object.keys(clasificacionesFirestore);
      if (keys.length > 0 && !isNaN(keys[0])) {
        // Es un objeto indexado numéricamente, convertir a array
        clasificacionesFirestore = Object.keys(clasificacionesFirestore)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => clasificacionesFirestore[key]);
      } else {
        clasificacionesFirestore = Object.values(clasificacionesFirestore);
      }
    } else {
      return secciones.map((seccion) => 
        Array(seccion?.preguntas?.length || 0).fill({ condicion: false, actitud: false })
      );
    }
  }
  
  // Si es array de objetos {seccion, valores}
  if (clasificacionesFirestore.length > 0 && clasificacionesFirestore[0] && typeof clasificacionesFirestore[0] === 'object' && clasificacionesFirestore[0].seccion !== undefined && Array.isArray(clasificacionesFirestore[0].valores)) {
    console.debug('[normalizarClasificaciones] Procesando formato de objetos por sección');
    return secciones.map((_, idx) => {
      const clasSec = clasificacionesFirestore.find(clas => clas.seccion === idx || clas.seccion === idx.toString());
      if (!clasSec || !Array.isArray(clasSec.valores)) {
        return Array(secciones[idx]?.preguntas?.length || 0).fill({ condicion: false, actitud: false });
      }
      return clasSec.valores.map(val => {
        if (val && typeof val === 'object') {
          return {
            condicion: val.condicion === true || val.condicion === 'true' || val.condicion === 1,
            actitud: val.actitud === true || val.actitud === 'true' || val.actitud === 1
          };
        }
        return { condicion: false, actitud: false };
      });
    });
  }
  
  // Si es array de arrays (formato clásico)
  if (clasificacionesFirestore.length > 0 && Array.isArray(clasificacionesFirestore[0])) {
    console.debug('[normalizarClasificaciones] Procesando formato de arrays anidados');
    return clasificacionesFirestore.map((seccionClasificaciones) => {
      if (!Array.isArray(seccionClasificaciones)) {
        return [];
      }
      return seccionClasificaciones.map(clas => {
        if (clas && typeof clas === 'object') {
          return {
            condicion: clas.condicion === true || clas.condicion === 'true' || clas.condicion === 1,
            actitud: clas.actitud === true || clas.actitud === 'true' || clas.actitud === 1
          };
        }
        return { condicion: false, actitud: false };
      });
    });
  }
  
  // Fallback: retornar arrays vacíos con valores por defecto
  console.debug('[normalizarClasificaciones] Usando fallback');
  return secciones.map((seccion) => 
    Array(seccion?.preguntas?.length || 0).fill({ condicion: false, actitud: false })
  );
};

// Normaliza formulario usando todos los campos disponibles del reporte
export const normalizarFormularioCompleto = (reporte) => {
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
};
