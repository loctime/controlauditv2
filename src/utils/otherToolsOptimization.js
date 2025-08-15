// Optimización de importaciones de Other Tools
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar HTML2Canvas de forma lazy
export const loadHTML2Canvas = async () => {
  const html2canvas = await import('html2canvas');
  return html2canvas.default;
};

// Función para cargar HTML2PDF de forma lazy
export const loadHTML2PDF = async () => {
  const html2pdf = await import('html2pdf.js');
  return html2pdf.default;
};

// Función para cargar React Signature Canvas de forma lazy
export const loadReactSignatureCanvas = async () => {
  const SignatureCanvas = await import('react-signature-canvas');
  return SignatureCanvas.default;
};

// Función para cargar React To Print de forma lazy
export const loadReactToPrint = async () => {
  const { useReactToPrint } = await import('react-to-print');
  return { useReactToPrint };
};

// Función para cargar EmailJS de forma lazy
export const loadEmailJS = async () => {
  const emailjs = await import('emailjs-com');
  return emailjs.default;
};

// Función para cargar DOCX de forma lazy
export const loadDOCX = async () => {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  return { Document, Packer, Paragraph, TextRun };
};

// Función para cargar CORS de forma lazy
export const loadCORS = async () => {
  const cors = await import('cors');
  return cors.default;
};

// Configuración optimizada para HTML2Canvas
export const getHTML2CanvasConfig = async (options = {}) => {
  const html2canvas = await loadHTML2Canvas();
  
  const defaultConfig = {
    allowTaint: true,
    useCORS: true,
    scale: 2,
    backgroundColor: '#ffffff',
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: 0,
    scrollY: 0,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    ...options
  };
  
  return { html2canvas, config: defaultConfig };
};

// Configuración optimizada para HTML2PDF
export const getHTML2PDFConfig = async (options = {}) => {
  const html2pdf = await loadHTML2PDF();
  
  const defaultConfig = {
    margin: 1,
    filename: 'documento.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    ...options
  };
  
  return { html2pdf, config: defaultConfig };
};

// Configuración optimizada para React Signature Canvas
export const getSignatureCanvasConfig = async (options = {}) => {
  const SignatureCanvas = await loadReactSignatureCanvas();
  
  const defaultConfig = {
    canvasProps: {
      width: 500,
      height: 200,
      className: 'signature-canvas'
    },
    backgroundColor: 'white',
    penColor: 'black',
    ...options
  };
  
  return { SignatureCanvas, config: defaultConfig };
};

// Configuración optimizada para React To Print
export const getReactToPrintConfig = async (options = {}) => {
  const { useReactToPrint } = await loadReactToPrint();
  
  const defaultConfig = {
    content: () => null,
    documentTitle: 'Documento',
    onBeforeGetContent: () => {},
    onAfterPrint: () => {},
    removeAfterPrint: true,
    suppressErrors: false,
    ...options
  };
  
  return { useReactToPrint, config: defaultConfig };
};

// Configuración optimizada para EmailJS
export const getEmailJSConfig = async (options = {}) => {
  const emailjs = await loadEmailJS();
  
  const defaultConfig = {
    serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID,
    templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
    userId: process.env.REACT_APP_EMAILJS_USER_ID,
    ...options
  };
  
  return { emailjs, config: defaultConfig };
};

// Configuración optimizada para DOCX
export const getDOCXConfig = async (options = {}) => {
  const { Document, Packer, Paragraph, TextRun } = await loadDOCX();
  
  const defaultConfig = {
    title: 'Documento',
    creator: 'Aplicación',
    description: 'Documento generado automáticamente',
    ...options
  };
  
  return { Document, Packer, Paragraph, TextRun, config: defaultConfig };
};

// Utilidades para captura de pantalla
export const screenshotUtils = {
  // Capturar elemento como imagen
  captureElement: async (element, options = {}) => {
    const { html2canvas, config } = await getHTML2CanvasConfig(options);
    return await html2canvas(element, config);
  },
  
  // Capturar página completa
  captureFullPage: async (options = {}) => {
    const { html2canvas, config } = await getHTML2CanvasConfig(options);
    return await html2canvas(document.body, config);
  },
  
  // Capturar y descargar como imagen
  captureAndDownload: async (element, filename = 'screenshot.png', options = {}) => {
    const canvas = await screenshotUtils.captureElement(element, options);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
    return canvas;
  }
};

// Utilidades para PDF
export const pdfUtils = {
  // Generar PDF desde HTML
  generatePDFFromHTML: async (element, options = {}) => {
    const { html2pdf, config } = await getHTML2PDFConfig(options);
    return await html2pdf().from(element).set(config).save();
  },
  
  // Generar PDF desde string HTML
  generatePDFFromString: async (htmlString, options = {}) => {
    const { html2pdf, config } = await getHTML2PDFConfig(options);
    return await html2pdf().from(htmlString).set(config).save();
  },
  
  // Generar PDF con datos personalizados
  generatePDFWithData: async (element, data, options = {}) => {
    const { html2pdf, config } = await getHTML2PDFConfig(options);
    
    // Reemplazar placeholders en el elemento
    const clonedElement = element.cloneNode(true);
    const placeholders = clonedElement.querySelectorAll('[data-pdf-placeholder]');
    
    placeholders.forEach(placeholder => {
      const key = placeholder.getAttribute('data-pdf-placeholder');
      if (data[key]) {
        placeholder.textContent = data[key];
      }
    });
    
    return await html2pdf().from(clonedElement).set(config).save();
  }
};

// Utilidades para firma digital
export const signatureUtils = {
  // Crear componente de firma
  createSignatureComponent: async (options = {}) => {
    const { SignatureCanvas, config } = await getSignatureCanvasConfig(options);
    return SignatureCanvas;
  },
  
  // Obtener firma como imagen
  getSignatureAsImage: (signatureRef) => {
    if (signatureRef && signatureRef.current) {
      return signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
    }
    return null;
  },
  
  // Limpiar firma
  clearSignature: (signatureRef) => {
    if (signatureRef && signatureRef.current) {
      signatureRef.current.clear();
    }
  },
  
  // Verificar si hay firma
  hasSignature: (signatureRef) => {
    if (signatureRef && signatureRef.current) {
      return !signatureRef.current.isEmpty();
    }
    return false;
  }
};

// Utilidades para impresión
export const printUtils = {
  // Configurar impresión
  setupPrint: async (options = {}) => {
    const { useReactToPrint, config } = await getReactToPrintConfig(options);
    return useReactToPrint(config);
  },
  
  // Imprimir elemento
  printElement: async (element, options = {}) => {
    const { useReactToPrint, config } = await getReactToPrintConfig(options);
    const handlePrint = useReactToPrint({
      ...config,
      content: () => element
    });
    return handlePrint();
  },
  
  // Imprimir página completa
  printFullPage: async (options = {}) => {
    const { useReactToPrint, config } = await getReactToPrintConfig(options);
    const handlePrint = useReactToPrint({
      ...config,
      content: () => document.body
    });
    return handlePrint();
  }
};

// Utilidades para email
export const emailUtils = {
  // Enviar email
  sendEmail: async (templateParams, options = {}) => {
    const { emailjs, config } = await getEmailJSConfig(options);
    
    return new Promise((resolve, reject) => {
      emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams,
        config.userId
      )
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
    });
  },
  
  // Enviar email de contacto
  sendContactEmail: async (contactData, options = {}) => {
    const templateParams = {
      from_name: contactData.name,
      from_email: contactData.email,
      subject: contactData.subject,
      message: contactData.message,
      to_name: 'Administrador'
    };
    
    return await emailUtils.sendEmail(templateParams, options);
  },
  
  // Enviar email de confirmación
  sendConfirmationEmail: async (userData, options = {}) => {
    const templateParams = {
      to_name: userData.name,
      to_email: userData.email,
      confirmation_link: userData.confirmationLink,
      subject: 'Confirmación de cuenta'
    };
    
    return await emailUtils.sendEmail(templateParams, options);
  },
  
  // Enviar email de recuperación de contraseña
  sendPasswordResetEmail: async (userData, options = {}) => {
    const templateParams = {
      to_name: userData.name,
      to_email: userData.email,
      reset_link: userData.resetLink,
      subject: 'Recuperación de contraseña'
    };
    
    return await emailUtils.sendEmail(templateParams, options);
  }
};

// Utilidades para documentos DOCX
export const docxUtils = {
  // Crear documento DOCX
  createDocument: async (content, options = {}) => {
    const { Document, Packer, Paragraph, TextRun, config } = await getDOCXConfig(options);
    
    const doc = new Document({
      title: config.title,
      creator: config.creator,
      description: config.description,
      sections: [{
        properties: {},
        children: content.map(item => new Paragraph({
          children: [new TextRun(item)]
        }))
      }]
    });
    
    return await Packer.toBlob(doc);
  },
  
  // Crear documento con formato
  createFormattedDocument: async (content, options = {}) => {
    const { Document, Packer, Paragraph, TextRun, config } = await getDOCXConfig(options);
    
    const doc = new Document({
      title: config.title,
      creator: config.creator,
      description: config.description,
      sections: [{
        properties: {},
        children: content.map(item => new Paragraph({
          children: [new TextRun({
            text: item.text,
            bold: item.bold || false,
            italic: item.italic || false,
            size: item.size || 24,
            color: item.color || '000000'
          })]
        }))
      }]
    });
    
    return await Packer.toBlob(doc);
  },
  
  // Descargar documento DOCX
  downloadDocument: async (content, filename = 'documento.docx', options = {}) => {
    const blob = await docxUtils.createDocument(content, options);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

// Utilidades para CORS
export const corsUtils = {
  // Configurar CORS
  setupCORS: async (options = {}) => {
    const cors = await loadCORS();
    
    const defaultOptions = {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      ...options
    };
    
    return cors(defaultOptions);
  },
  
  // Verificar si CORS está habilitado
  isCORSEnabled: () => {
    return typeof window !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
  },
  
  // Configurar headers CORS para fetch
  setCORSHeaders: (headers = {}) => {
    return {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers
    };
  }
};
