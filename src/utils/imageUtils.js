/**
 * Utilidades unificadas para manejo de imágenes con ControlFile
 * Patrón obligatorio: shareToken en datos, URL en render, base64 en impresión
 */

/**
 * Convierte shareToken (string) a URL de ControlFile para render en UI
 * @param {string|object} valor - shareToken string o objeto con shareToken
 * @returns {string|null} URL de ControlFile o null si no es válido
 */
export const convertirShareTokenAUrl = (valor) => {
  if (!valor) return null;
  
  // Si es objeto con shareToken
  if (typeof valor === 'object' && valor.shareToken) {
    return `https://files.controldoc.app/api/shares/${valor.shareToken}/image`;
  }
  
  // Si es string
  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    if (!trimmed || trimmed === '[object Object]') return null;
    
    // Si ya es URL, retornarla (compatibilidad con datos antiguos)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // Asumir que es shareToken
    return `https://files.controldoc.app/api/shares/${trimmed}/image`;
  }
  
  return null;
};

/**
 * Convierte imagen externa a data:image/base64 para PDF/impresión
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<string|null>} data URL o null si falla
 */
export const convertirImagenADataUrl = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  
  // Si ya es data URL, retornarla
  if (imageUrl.startsWith('data:image')) return imageUrl;
  
  try {
    const res = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) {
      console.warn(`[imageUtils] No se pudo cargar imagen: ${imageUrl} (status: ${res.status})`);
      return null;
    }
    
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`[imageUtils] Error convirtiendo imagen a base64: ${imageUrl}`, error);
    return null;
  }
};

/**
 * Convierte todas las imágenes de un reporte a data URLs
 * Acepta shareTokens o URLs, los convierte a URLs primero y luego a base64
 * @param {Array<Array<string|object>>} imagenes - Array de arrays de shareTokens/URLs
 * @returns {Promise<Array<Array<string>>>} Array de arrays de data URLs
 */
export const convertirImagenesADataUrls = async (imagenes) => {
  if (!imagenes || !Array.isArray(imagenes)) return imagenes;
  
  return Promise.all(
    imagenes.map(async (seccion) => {
      if (!Array.isArray(seccion)) return seccion;
      
      return Promise.all(
        seccion.map(async (img) => {
          if (!img) return img;
          
          // Primero convertir shareToken a URL si es necesario
          const url = convertirShareTokenAUrl(img);
          if (!url) return img;
          
          // Si es URL externa, convertir a base64
          if (url.startsWith('http://') || url.startsWith('https://')) {
            const dataUrl = await convertirImagenADataUrl(url);
            return dataUrl || url; // Fallback a URL si falla conversión
          }
          
          return img;
        })
      );
    })
  );
};

