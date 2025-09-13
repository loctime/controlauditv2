// Utilidades para manejo de cámara e imágenes

/**
 * Comprime una imagen reduciendo su tamaño y calidad
 * @param {File} file - Archivo de imagen a comprimir
 * @param {number} maxWidth - Ancho máximo en píxeles
 * @param {number} quality - Calidad de compresión (0-1)
 * @returns {Promise<File>} - Archivo comprimido
 */
export const comprimirImagen = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      console.warn('Archivo no es una imagen:', file.type);
      resolve(file);
      return;
    }

    console.log(`🔄 Comprimiendo imagen: ${(file.size/1024/1024).toFixed(2)}MB`);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      const maxWidthLimit = 800;
      const maxHeightLimit = 800;
      
      if (width > maxWidthLimit) {
        height = (height * maxWidthLimit) / width;
        width = maxWidthLimit;
      }
      
      if (height > maxHeightLimit) {
        width = (width * maxHeightLimit) / height;
        height = maxHeightLimit;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      let compressionQuality = 0.6;
      
      if (file.size > 10 * 1024 * 1024) {
        compressionQuality = 0.3;
      } else if (file.size > 5 * 1024 * 1024) {
        compressionQuality = 0.4;
      } else if (file.size > 2 * 1024 * 1024) {
        compressionQuality = 0.5;
      } else if (file.size > 1 * 1024 * 1024) {
        compressionQuality = 0.6;
      }
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        const reductionPercent = Math.round((1 - compressedFile.size/file.size) * 100);
        const finalSizeMB = (compressedFile.size/1024/1024).toFixed(2);
        
        console.log(`✅ Imagen optimizada: ${(file.size/1024/1024).toFixed(2)}MB -> ${finalSizeMB}MB (${reductionPercent}% reducción)`);
        
        if (compressedFile.size > 2 * 1024 * 1024) {
          console.warn(`⚠️ Imagen aún grande (${finalSizeMB}MB), aplicando compresión adicional`);
          canvas.toBlob((finalBlob) => {
            const finalFile = new File([finalBlob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log(`🎯 Compresión final: ${(finalFile.size/1024/1024).toFixed(2)}MB`);
            resolve(finalFile);
          }, 'image/jpeg', 0.4);
        } else {
          resolve(compressedFile);
        }
      }, 'image/jpeg', compressionQuality);
    };
    
    img.onerror = () => {
      console.error('Error al cargar la imagen para compresión');
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Evalúa la calidad de una imagen basándose en su variación de brillo
 * @param {string} imageData - Data URL de la imagen
 * @returns {Promise<string>} - 'excellent', 'good', o 'poor'
 */
export const evaluatePhotoQuality = (imageData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let totalVariance = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        totalVariance += brightness;
      }
      
      const averageBrightness = totalVariance / (data.length / 4);
      let variance = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        variance += Math.pow(brightness - averageBrightness, 2);
      }
      
      variance = variance / (data.length / 4);
      
      let quality = 'good';
      if (variance > 1000) {
        quality = 'excellent';
      } else if (variance < 200) {
        quality = 'poor';
      }
      
      resolve(quality);
    };
    
    img.src = imageData;
  });
};

/**
 * Verifica si el navegador es compatible con la funcionalidad de cámara
 * @returns {boolean} - true si es compatible
 */
export const checkBrowserCompatibility = () => {
  const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasEnumerateDevices = !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
  
  console.log('🔍 Verificando compatibilidad del navegador:');
  console.log('- HTTPS/Localhost:', isHTTPS);
  console.log('- getUserMedia disponible:', hasGetUserMedia);
  console.log('- enumerateDevices disponible:', hasEnumerateDevices);
  
  if (!isHTTPS) {
    console.warn('⚠️ La cámara requiere HTTPS (excepto en localhost)');
  }
  
  if (!hasGetUserMedia) {
    console.error('❌ getUserMedia no está disponible en este navegador');
    return false;
  }
  
  return true;
};

/**
 * Detecta las cámaras disponibles en el dispositivo
 * @returns {Promise<Array>} - Array de dispositivos de video
 */
export const detectAvailableCameras = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log('📷 Cámaras disponibles:', videoDevices.length);
    return videoDevices;
  } catch (error) {
    console.error('Error al detectar cámaras:', error);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('📷 Cámaras detectadas (sin permisos):', videoDevices.length);
      return videoDevices;
    } catch (fallbackError) {
      console.error('Error en fallback de detección:', fallbackError);
      return [];
    }
  }
};

/**
 * Obtiene un mensaje de error amigable basado en el tipo de error
 * @param {Error} error - Error de la cámara
 * @returns {string} - Mensaje de error descriptivo
 */
export const getCameraErrorMessage = (error) => {
  if (error.name === 'NotAllowedError') {
    return 'Permiso denegado. Por favor, permite el acceso a la cámara y recarga la página.';
  } else if (error.name === 'NotFoundError') {
    return 'No se encontró ninguna cámara en tu dispositivo.';
  } else if (error.name === 'NotSupportedError') {
    return 'Tu navegador no soporta el acceso a la cámara.';
  } else if (error.name === 'NotReadableError') {
    return 'La cámara está siendo usada por otra aplicación.';
  } else if (error.name === 'OverconstrainedError') {
    return 'La configuración de la cámara no es compatible con tu dispositivo.';
  } else if (error.name === 'TypeError') {
    return 'Error de configuración de la cámara.';
  }
  
  return 'No se pudo acceder a la cámara.';
};
