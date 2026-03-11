import logger from '@/utils/logger';
import { validateFile, MAX_FILE_SIZE, WARNING_FILE_SIZE } from '@/services/fileValidationPolicy';
// Funcion para comprimir imagenes

export const comprimirImagen = (file) => {
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
      
      if (file.size > WARNING_FILE_SIZE) {
        compressionQuality = 0.3;
      } else if (file.size > WARNING_FILE_SIZE * 0.25) {
        compressionQuality = 0.4;
      } else if (file.size > WARNING_FILE_SIZE * 0.1) {
        compressionQuality = 0.5;
      } else if (file.size > WARNING_FILE_SIZE * 0.02) {
        compressionQuality = 0.6;
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
        if (compressedFile.size > WARNING_FILE_SIZE * 0.1) {
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

export const validarArchivoImagen = (file) => {
  const result = validateFile(file);
  if (!result.valid) {
    return { valido: false, error: result.issues.map((i) => i.message).join(' | ') };
  }

  if (file.size >= WARNING_FILE_SIZE) {
    logger.warn('Archivo grande detectado', { sizeMB: (file.size / 1024 / 1024).toFixed(1) });
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valido: false, error: 'El archivo excede el tamano maximo permitido (500MB).' };
  }

  return { valido: true };
}; 

