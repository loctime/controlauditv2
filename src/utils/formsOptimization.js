// Optimización de importaciones de Forms
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar Formik de forma lazy
export const loadFormik = async () => {
  const { Formik, Form, Field, ErrorMessage } = await import('formik');
  return { Formik, Form, Field, ErrorMessage };
};

// Función para cargar Yup de forma lazy
export const loadYup = async () => {
  const yup = await import('yup');
  return yup.default;
};

// Función para cargar React Hook Form de forma lazy (alternativa más ligera)
export const loadReactHookForm = async () => {
  const { useForm, Controller } = await import('react-hook-form');
  return { useForm, Controller };
};

// Configuración optimizada para Formik
export const getFormikConfig = async (options = {}) => {
  const { Formik, Form, Field, ErrorMessage } = await loadFormik();
  
  const defaultConfig = {
    initialValues: {},
    validationSchema: null,
    onSubmit: (values) => {
      console.log('Form submitted:', values);
    },
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    validateOnMount: false,
    ...options
  };
  
  return { Formik, Form, Field, ErrorMessage, config: defaultConfig };
};

// Configuración optimizada para Yup
export const getYupConfig = async (options = {}) => {
  const yup = await loadYup();
  
  const defaultConfig = {
    strict: false,
    abortEarly: false,
    stripUnknown: true,
    recursive: true,
    context: {},
    ...options
  };
  
  return { yup, config: defaultConfig };
};

// Esquemas de validación comunes con Yup
export const validationSchemas = {
  // Esquema para email
  email: async () => {
    const yup = await loadYup();
    return yup.object({
      email: yup
        .string()
        .email('Email inválido')
        .required('Email es requerido')
    });
  },
  
  // Esquema para contraseña
  password: async () => {
    const yup = await loadYup();
    return yup.object({
      password: yup
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número')
        .required('Contraseña es requerida')
    });
  },
  
  // Esquema para confirmar contraseña
  confirmPassword: async () => {
    const yup = await loadYup();
    return yup.object({
      password: yup
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .required('Contraseña es requerida'),
      confirmPassword: yup
        .string()
        .oneOf([yup.ref('password'), null], 'Las contraseñas deben coincidir')
        .required('Confirmar contraseña es requerido')
    });
  },
  
  // Esquema para login
  login: async () => {
    const yup = await loadYup();
    return yup.object({
      email: yup
        .string()
        .email('Email inválido')
        .required('Email es requerido'),
      password: yup
        .string()
        .required('Contraseña es requerida')
    });
  },
  
  // Esquema para registro
  register: async () => {
    const yup = await loadYup();
    return yup.object({
      name: yup
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .required('Nombre es requerido'),
      email: yup
        .string()
        .email('Email inválido')
        .required('Email es requerido'),
      password: yup
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número')
        .required('Contraseña es requerida'),
      confirmPassword: yup
        .string()
        .oneOf([yup.ref('password'), null], 'Las contraseñas deben coincidir')
        .required('Confirmar contraseña es requerido')
    });
  },
  
  // Esquema para formulario de contacto
  contact: async () => {
    const yup = await loadYup();
    return yup.object({
      name: yup
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .required('Nombre es requerido'),
      email: yup
        .string()
        .email('Email inválido')
        .required('Email es requerido'),
      subject: yup
        .string()
        .min(5, 'El asunto debe tener al menos 5 caracteres')
        .required('Asunto es requerido'),
      message: yup
        .string()
        .min(10, 'El mensaje debe tener al menos 10 caracteres')
        .required('Mensaje es requerido')
    });
  },
  
  // Esquema para formulario de perfil
  profile: async () => {
    const yup = await loadYup();
    return yup.object({
      firstName: yup
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .required('Nombre es requerido'),
      lastName: yup
        .string()
        .min(2, 'El apellido debe tener al menos 2 caracteres')
        .required('Apellido es requerido'),
      email: yup
        .string()
        .email('Email inválido')
        .required('Email es requerido'),
      phone: yup
        .string()
        .matches(/^\+?[\d\s-()]+$/, 'Número de teléfono inválido'),
      address: yup
        .string()
        .min(10, 'La dirección debe tener al menos 10 caracteres'),
      city: yup
        .string()
        .min(2, 'La ciudad debe tener al menos 2 caracteres'),
      country: yup
        .string()
        .min(2, 'El país debe tener al menos 2 caracteres')
    });
  }
};

// Utilidades para formularios
export const formUtils = {
  // Validar email
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validar contraseña
  validatePassword: (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
      errors: {
        minLength: !minLength ? 'Mínimo 8 caracteres' : null,
        hasUpperCase: !hasUpperCase ? 'Al menos una mayúscula' : null,
        hasLowerCase: !hasLowerCase ? 'Al menos una minúscula' : null,
        hasNumbers: !hasNumbers ? 'Al menos un número' : null,
        hasSpecialChar: !hasSpecialChar ? 'Al menos un carácter especial' : null
      }
    };
  },
  
  // Validar teléfono
  validatePhone: (phone) => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone);
  },
  
  // Validar URL
  validateURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // Validar número
  validateNumber: (value) => {
    return !isNaN(value) && isFinite(value);
  },
  
  // Validar fecha
  validateDate: (date) => {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  },
  
  // Formatear número de teléfono
  formatPhoneNumber: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
  },
  
  // Formatear número de tarjeta de crédito
  formatCreditCard: (card) => {
    const cleaned = card.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{4})(\d{4})(\d{4})(\d{4})$/);
    if (match) {
      return match[1] + ' ' + match[2] + ' ' + match[3] + ' ' + match[4];
    }
    return card;
  },
  
  // Formatear fecha
  formatDate: (date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('es-ES');
  },
  
  // Formatear moneda
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  
  // Limpiar formulario
  clearForm: (formikRef) => {
    if (formikRef && formikRef.current) {
      formikRef.current.resetForm();
    }
  },
  
  // Establecer valores del formulario
  setFormValues: (formikRef, values) => {
    if (formikRef && formikRef.current) {
      formikRef.current.setValues(values);
    }
  },
  
  // Establecer errores del formulario
  setFormErrors: (formikRef, errors) => {
    if (formikRef && formikRef.current) {
      formikRef.current.setErrors(errors);
    }
  },
  
  // Validar formulario
  validateForm: async (formikRef) => {
    if (formikRef && formikRef.current) {
      return await formikRef.current.validateForm();
    }
    return {};
  },
  
  // Enviar formulario
  submitForm: (formikRef) => {
    if (formikRef && formikRef.current) {
      formikRef.current.submitForm();
    }
  }
};

// Hook personalizado para formularios
export const useFormUtils = () => {
  const validateEmail = (email) => {
    return formUtils.validateEmail(email);
  };
  
  const validatePassword = (password) => {
    return formUtils.validatePassword(password);
  };
  
  const validatePhone = (phone) => {
    return formUtils.validatePhone(phone);
  };
  
  const validateURL = (url) => {
    return formUtils.validateURL(url);
  };
  
  const validateNumber = (value) => {
    return formUtils.validateNumber(value);
  };
  
  const validateDate = (date) => {
    return formUtils.validateDate(date);
  };
  
  const formatPhoneNumber = (phone) => {
    return formUtils.formatPhoneNumber(phone);
  };
  
  const formatCreditCard = (card) => {
    return formUtils.formatCreditCard(card);
  };
  
  const formatDate = (date) => {
    return formUtils.formatDate(date);
  };
  
  const formatCurrency = (amount, currency) => {
    return formUtils.formatCurrency(amount, currency);
  };
  
  const clearForm = (formikRef) => {
    return formUtils.clearForm(formikRef);
  };
  
  const setFormValues = (formikRef, values) => {
    return formUtils.setFormValues(formikRef, values);
  };
  
  const setFormErrors = (formikRef, errors) => {
    return formUtils.setFormErrors(formikRef, errors);
  };
  
  const validateForm = async (formikRef) => {
    return await formUtils.validateForm(formikRef);
  };
  
  const submitForm = (formikRef) => {
    return formUtils.submitForm(formikRef);
  };
  
  return {
    validateEmail,
    validatePassword,
    validatePhone,
    validateURL,
    validateNumber,
    validateDate,
    formatPhoneNumber,
    formatCreditCard,
    formatDate,
    formatCurrency,
    clearForm,
    setFormValues,
    setFormErrors,
    validateForm,
    submitForm
  };
};
