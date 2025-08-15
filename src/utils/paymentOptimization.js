// Optimización de importaciones de Payment
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar MercadoPago SDK de forma lazy
export const loadMercadoPago = async () => {
  const { initMercadoPago, Card } = await import('@mercadopago/sdk-react');
  return { initMercadoPago, Card };
};

// Configuración optimizada para MercadoPago
export const getMercadoPagoConfig = async (options = {}) => {
  const { initMercadoPago, Card } = await loadMercadoPago();
  
  const defaultConfig = {
    publicKey: process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY,
    locale: 'es-AR',
    ...options
  };
  
  // Inicializar MercadoPago
  initMercadoPago(defaultConfig.publicKey, {
    locale: defaultConfig.locale
  });
  
  return { Card, config: defaultConfig };
};

// Utilidades para pagos
export const paymentUtils = {
  // Crear preferencia de pago
  createPaymentPreference: async (items, options = {}) => {
    const { initMercadoPago } = await loadMercadoPago();
    
    const defaultOptions = {
      items: items.map(item => ({
        title: item.title,
        unit_price: item.price,
        quantity: item.quantity || 1,
        currency_id: 'ARS',
        ...item
      })),
      back_urls: {
        success: `${window.location.origin}/payment/success`,
        failure: `${window.location.origin}/payment/failure`,
        pending: `${window.location.origin}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: options.externalReference || Date.now().toString(),
      notification_url: options.notificationUrl,
      ...options
    };
    
    try {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultOptions)
      });
      
      if (!response.ok) {
        throw new Error('Error creating payment preference');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating payment preference:', error);
      throw error;
    }
  },
  
  // Procesar pago con tarjeta
  processCardPayment: async (paymentData, options = {}) => {
    const { initMercadoPago } = await loadMercadoPago();
    
    const defaultOptions = {
      transaction_amount: paymentData.amount,
      token: paymentData.token,
      description: paymentData.description,
      installments: paymentData.installments || 1,
      payment_method_id: paymentData.paymentMethodId,
      payer: {
        email: paymentData.payerEmail,
        identification: {
          type: paymentData.payerIdentificationType || 'DNI',
          number: paymentData.payerIdentificationNumber
        }
      },
      ...options
    };
    
    try {
      const response = await fetch('/api/payments/process-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultOptions)
      });
      
      if (!response.ok) {
        throw new Error('Error processing card payment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error processing card payment:', error);
      throw error;
    }
  },
  
  // Obtener métodos de pago disponibles
  getPaymentMethods: async (bin) => {
    try {
      const response = await fetch(`/api/payments/payment-methods?bin=${bin}`);
      
      if (!response.ok) {
        throw new Error('Error fetching payment methods');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },
  
  // Obtener información de la tarjeta
  getCardInfo: async (bin) => {
    try {
      const response = await fetch(`/api/payments/card-info?bin=${bin}`);
      
      if (!response.ok) {
        throw new Error('Error fetching card info');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching card info:', error);
      throw error;
    }
  },
  
  // Validar tarjeta
  validateCard: (cardNumber) => {
    // Algoritmo de Luhn para validar tarjeta
    let sum = 0;
    let isEven = false;
    
    // Eliminar espacios y guiones
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Verificar longitud mínima
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }
    
    // Aplicar algoritmo de Luhn
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },
  
  // Obtener tipo de tarjeta
  getCardType: (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Patrones de tarjetas
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      dinersclub: /^3(?:0[0-5]|[68])/,
      jcb: /^(?:2131|1800|35\d{3})/
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cleanNumber)) {
        return type;
      }
    }
    
    return 'unknown';
  },
  
  // Formatear número de tarjeta
  formatCardNumber: (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const cardType = paymentUtils.getCardType(cleanNumber);
    
    switch (cardType) {
      case 'amex':
        return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
      case 'dinersclub':
        return cleanNumber.replace(/(\d{4})(\d{6})(\d{4})/, '$1 $2 $3');
      default:
        return cleanNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
  },
  
  // Enmascarar número de tarjeta
  maskCardNumber: (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const cardType = paymentUtils.getCardType(cleanNumber);
    
    if (cleanNumber.length < 4) {
      return cleanNumber;
    }
    
    const lastFour = cleanNumber.slice(-4);
    
    switch (cardType) {
      case 'amex':
        return `**** ****** ${lastFour}`;
      case 'dinersclub':
        return `**** ****** ${lastFour}`;
      default:
        return `**** **** **** ${lastFour}`;
    }
  },
  
  // Validar CVV
  validateCVV: (cvv, cardType) => {
    const cleanCVV = cvv.replace(/\D/g, '');
    
    switch (cardType) {
      case 'amex':
        return cleanCVV.length === 4;
      default:
        return cleanCVV.length === 3;
    }
  },
  
  // Validar fecha de expiración
  validateExpiryDate: (month, year) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    // Validar formato
    if (expMonth < 1 || expMonth > 12) {
      return false;
    }
    
    // Validar que no esté expirada
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }
    
    return true;
  },
  
  // Calcular cuotas
  calculateInstallments: (amount, installments, interestRate = 0) => {
    if (installments === 1) {
      return {
        amount: amount,
        total: amount,
        interest: 0
      };
    }
    
    const monthlyRate = interestRate / 100 / 12;
    const total = amount * Math.pow(1 + monthlyRate, installments);
    const interest = total - amount;
    
    return {
      amount: amount / installments,
      total: total,
      interest: interest
    };
  }
};

// Hook personalizado para pagos
export const usePayment = () => {
  const createPreference = async (items, options = {}) => {
    return await paymentUtils.createPaymentPreference(items, options);
  };
  
  const processCardPayment = async (paymentData, options = {}) => {
    return await paymentUtils.processCardPayment(paymentData, options);
  };
  
  const getPaymentMethods = async (bin) => {
    return await paymentUtils.getPaymentMethods(bin);
  };
  
  const getCardInfo = async (bin) => {
    return await paymentUtils.getCardInfo(bin);
  };
  
  const validateCard = (cardNumber) => {
    return paymentUtils.validateCard(cardNumber);
  };
  
  const getCardType = (cardNumber) => {
    return paymentUtils.getCardType(cardNumber);
  };
  
  const formatCardNumber = (cardNumber) => {
    return paymentUtils.formatCardNumber(cardNumber);
  };
  
  const maskCardNumber = (cardNumber) => {
    return paymentUtils.maskCardNumber(cardNumber);
  };
  
  const validateCVV = (cvv, cardType) => {
    return paymentUtils.validateCVV(cvv, cardType);
  };
  
  const validateExpiryDate = (month, year) => {
    return paymentUtils.validateExpiryDate(month, year);
  };
  
  const calculateInstallments = (amount, installments, interestRate) => {
    return paymentUtils.calculateInstallments(amount, installments, interestRate);
  };
  
  return {
    createPreference,
    processCardPayment,
    getPaymentMethods,
    getCardInfo,
    validateCard,
    getCardType,
    formatCardNumber,
    maskCardNumber,
    validateCVV,
    validateExpiryDate,
    calculateInstallments
  };
};
