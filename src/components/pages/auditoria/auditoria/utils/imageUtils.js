// Función para comprimir imágenes - Optimizada para evitar tildes del sistema
import logger from '../../../../../utils/logger';

export const comprimirImagen = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      logger.warn('Archivo no es una imagen:', file.type);
      resolve(file);
      return;
    }

    // SIEMPRE comprimir, sin importar el tamaño inicial
    // Esto garantiza que las imágenes nunca sean problemáticas
    logger.debug('Comprimiendo imagen', { sizeMB: (file.size/1024/1024).toFixed(2) });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones - más agresivo para evitar problemas
      let { width, height } = img;
      
      // Límites más estrictos para evitar imágenes muy grandes
      const maxWidthLimit = 800;
      const maxHeightLimit = 800;
      
      // Reducir ancho si es muy grande
      if (width > maxWidthLimit) {
        height = (height * maxWidthLimit) / width;
        width = maxWidthLimit;
      }
      
      // Reducir alto si es muy alto
      if (height > maxHeightLimit) {
        width = (width * maxHeightLimit) / height;
        height = maxHeightLimit;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compresión más agresiva según el tamaño original
      let compressionQuality = 0.6; // Calidad base más baja
      
      if (file.size > 10 * 1024 * 1024) { // > 10MB
        compressionQuality = 0.3; // Muy agresiva
      } else if (file.size > 5 * 1024 * 1024) { // > 5MB
        compressionQuality = 0.4; // Agresiva
      } else if (file.size > 2 * 1024 * 1024) { // > 2MB
        compressionQuality = 0.5; // Moderada
      } else if (file.size > 1 * 1024 * 1024) { // > 1MB
        compressionQuality = 0.6; // Normal
      }
      
      canvas.toBlob((blob) => {
        // Crear nuevo archivo con el blob comprimido
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        const reductionPercent = Math.round((1 - compressedFile.size/file.size) * 100);
        const finalSizeMB = (compressedFile.size/1024/1024).toFixed(2);
        
        logger.debug('Imagen optimizada', { 
          originalMB: (file.size/1024/1024).toFixed(2),
          finalMB: finalSizeMB,
          reductionPercent 
        });
        
        // Verificar que el tamaño final sea razonable (< 2MB)
        if (compressedFile.size > 2 * 1024 * 1024) {
          logger.debug('Imagen aún grande, aplicando compresión adicional', { sizeMB: finalSizeMB });
          // Aplicar compresión adicional si aún es muy grande
          canvas.toBlob((finalBlob) => {
            const finalFile = new File([finalBlob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            logger.debug('Compresión final completada', { sizeMB: (finalFile.size/1024/1024).toFixed(2) });
            resolve(finalFile);
          }, 'image/jpeg', 0.4);
        } else {
          resolve(compressedFile);
        }
      }, 'image/jpeg', compressionQuality);
    };
    
    img.onerror = () => {
      logger.error('Error al cargar la imagen para compresión');
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Función para validar archivo de imagen
export const validarArchivoImagen = (file) => {
  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    logger.error('Archivo no es una imagen:', file.type);
    return { valido: false, error: 'Por favor selecciona solo archivos de imagen (JPG, PNG, etc.)' };
  }
  
  // Validar tamaño máximo (50MB para permitir archivos grandes que se comprimirán)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    logger.error('Archivo demasiado grande', { size: file.size, sizeMB: (file.size/1024/1024).toFixed(1) });
    return { 
      valido: false, 
      error: `El archivo es demasiado grande (${(file.size/1024/1024).toFixed(1)}MB). El tamaño máximo es 50MB.` 
    };
  }
  
  return { valido: true };
}; 