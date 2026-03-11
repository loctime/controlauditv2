import logger from '@/utils/logger';
// Test para verificar que la estructura de datos es compatible con Firestore
// Firestore no acepta arrays anidados, solo objetos planos

export const testFirestoreStructure = (data) => {
  logger.debug('🧪 Testing Firestore structure compatibility...');
  
  const issues = [];
  
  const checkValue = (value, path = 'root') => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (Array.isArray(item)) {
          issues.push(`❌ Array anidado encontrado en ${path}[${index}]`);
        } else {
          checkValue(item, `${path}[${index}]`);
        }
      });
    } else if (value && typeof value === 'object') {
      Object.keys(value).forEach(key => {
        checkValue(value[key], `${path}.${key}`);
      });
    }
  };
  
  checkValue(data);
  
  if (issues.length === 0) {
    logger.debug('✅ Estructura compatible con Firestore');
  } else {
    logger.warn('⚠️ Problemas encontrados:');
    issues.forEach(issue => logger.warn(issue));
  }
  
  return issues.length === 0;
};

// Ejemplo de estructura correcta para imágenes en Firestore
export const ejemploEstructuraCorrecta = {
  imagenes: [
    {
      seccion: 0,
      valores: [
        {
          url: "https://example.com/imagen1.jpg",
          nombre: "imagen1.jpg",
          tipo: "image/jpeg",
          tamaño: 1024,
          timestamp: 1234567890
        }
      ]
    }
  ]
};

// Ejemplo de estructura INCORRECTA (arrays anidados)
export const ejemploEstructuraIncorrecta = {
  imagenes: [
    [
      "https://example.com/imagen1.jpg",
      "https://example.com/imagen2.jpg"
    ]
  ]
};
