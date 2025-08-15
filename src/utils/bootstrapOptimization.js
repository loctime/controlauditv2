// Optimización de importaciones de Bootstrap
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar Bootstrap de forma lazy
export const loadBootstrap = async () => {
  const bootstrap = await import('bootstrap');
  return bootstrap.default;
};

// Función para cargar React Bootstrap de forma lazy
export const loadReactBootstrap = async () => {
  const {
    Container,
    Row,
    Col,
    Button,
    Form,
    FormControl,
    FormGroup,
    FormLabel,
    FormText,
    InputGroup,
    InputGroupText,
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    CardTitle,
    CardSubtitle,
    CardText,
    CardImg,
    CardImgOverlay,
    Nav,
    Navbar,
    NavDropdown,
    NavItem,
    NavLink,
    Breadcrumb,
    BreadcrumbItem,
    Pagination,
    PageItem,
    PageLink,
    Alert,
    Badge,
    ButtonGroup,
    ButtonToolbar,
    Dropdown,
    DropdownButton,
    SplitButton,
    Modal,
    ModalHeader,
    ModalTitle,
    ModalBody,
    ModalFooter,
    ModalDialog,
    Tooltip,
    Popover,
    Overlay,
    OverlayTrigger,
    ProgressBar,
    Spinner,
    Table,
    ListGroup,
    ListGroupItem,
    Accordion,
    AccordionItem,
    AccordionHeader,
    AccordionBody,
    Carousel,
    CarouselItem,
    CarouselCaption,
    Image,
    Figure,
    FigureImage,
    FigureCaption,
    CloseButton,
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
    OffcanvasTitle,
    Placeholder,
    PlaceholderButton,
    Ratio,
    Stack,
    Toast,
    ToastContainer,
    ToastHeader,
    ToastBody,
    Fade,
    Collapse,
    Transition
  } = await import('react-bootstrap');

  return {
    Container,
    Row,
    Col,
    Button,
    Form,
    FormControl,
    FormGroup,
    FormLabel,
    FormText,
    InputGroup,
    InputGroupText,
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    CardTitle,
    CardSubtitle,
    CardText,
    CardImg,
    CardImgOverlay,
    Nav,
    Navbar,
    NavDropdown,
    NavItem,
    NavLink,
    Breadcrumb,
    BreadcrumbItem,
    Pagination,
    PageItem,
    PageLink,
    Alert,
    Badge,
    ButtonGroup,
    ButtonToolbar,
    Dropdown,
    DropdownButton,
    SplitButton,
    Modal,
    ModalHeader,
    ModalTitle,
    ModalBody,
    ModalFooter,
    ModalDialog,
    Tooltip,
    Popover,
    Overlay,
    OverlayTrigger,
    ProgressBar,
    Spinner,
    Table,
    ListGroup,
    ListGroupItem,
    Accordion,
    AccordionItem,
    AccordionHeader,
    AccordionBody,
    Carousel,
    CarouselItem,
    CarouselCaption,
    Image,
    Figure,
    FigureImage,
    FigureCaption,
    CloseButton,
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
    OffcanvasTitle,
    Placeholder,
    PlaceholderButton,
    Ratio,
    Stack,
    Toast,
    ToastContainer,
    ToastHeader,
    ToastBody,
    Fade,
    Collapse,
    Transition
  };
};

// Configuración optimizada para Bootstrap
export const getBootstrapConfig = async (options = {}) => {
  const bootstrap = await loadBootstrap();
  
  const defaultConfig = {
    theme: 'light',
    rtl: false,
    ...options
  };
  
  return { bootstrap, config: defaultConfig };
};

// Configuración optimizada para React Bootstrap
export const getReactBootstrapConfig = async (options = {}) => {
  const reactBootstrap = await loadReactBootstrap();
  
  const defaultConfig = {
    theme: 'light',
    rtl: false,
    ...options
  };
  
  return { reactBootstrap, config: defaultConfig };
};

// Utilidades para componentes Bootstrap
export const bootstrapUtils = {
  // Configurar tooltips
  initTooltips: async () => {
    const { bootstrap } = await getBootstrapConfig();
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    return tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  },
  
  // Configurar popovers
  initPopovers: async () => {
    const { bootstrap } = await getBootstrapConfig();
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    return popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
  },
  
  // Configurar modales
  initModals: async () => {
    const { bootstrap } = await getBootstrapConfig();
    const modalTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="modal"]'));
    return modalTriggerList.map(function (modalTriggerEl) {
      return new bootstrap.Modal(modalTriggerEl);
    });
  },
  
  // Configurar dropdowns
  initDropdowns: async () => {
    const { bootstrap } = await getBootstrapConfig();
    const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    return dropdownElementList.map(function (dropdownToggleEl) {
      return new bootstrap.Dropdown(dropdownToggleEl);
    });
  },
  
  // Configurar collapse
  initCollapse: async () => {
    const { bootstrap } = await getBootstrapConfig();
    const collapseElementList = [].slice.call(document.querySelectorAll('.collapse'));
    return collapseElementList.map(function (collapseEl) {
      return new bootstrap.Collapse(collapseEl);
    });
  },
  
  // Configurar carousel
  initCarousel: async () => {
    const { bootstrap } = await getBootstrapConfig();
    const carouselElementList = [].slice.call(document.querySelectorAll('.carousel'));
    return carouselElementList.map(function (carouselEl) {
      return new bootstrap.Carousel(carouselEl);
    });
  },
  
  // Configurar todos los componentes
  initAll: async () => {
    await Promise.all([
      bootstrapUtils.initTooltips(),
      bootstrapUtils.initPopovers(),
      bootstrapUtils.initModals(),
      bootstrapUtils.initDropdowns(),
      bootstrapUtils.initCollapse(),
      bootstrapUtils.initCarousel()
    ]);
  }
};

// Utilidades para estilos Bootstrap
export const bootstrapStyles = {
  // Colores de tema
  colors: {
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    light: '#f8f9fa',
    dark: '#212529'
  },
  
  // Espaciado
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '3rem'
  },
  
  // Breakpoints
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px'
  },
  
  // Bordes
  borders: {
    radius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '1rem'
    }
  },
  
  // Sombras
  shadows: {
    sm: '0 .125rem .25rem rgba(0,0,0,.075)',
    md: '0 .5rem 1rem rgba(0,0,0,.15)',
    lg: '0 1rem 3rem rgba(0,0,0,.175)'
  }
};

// Utilidades para validación Bootstrap
export const bootstrapValidation = {
  // Validar formulario
  validateForm: (formElement) => {
    const form = formElement;
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    form.classList.add('was-validated');
  },
  
  // Validar campo
  validateField: (fieldElement) => {
    const field = fieldElement;
    const isValid = field.checkValidity();
    
    if (isValid) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
    } else {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
    }
    
    return isValid;
  },
  
  // Limpiar validación
  clearValidation: (formElement) => {
    const form = formElement;
    form.classList.remove('was-validated');
    
    const fields = form.querySelectorAll('.form-control, .form-select');
    fields.forEach(field => {
      field.classList.remove('is-valid', 'is-invalid');
    });
  },
  
  // Mostrar mensaje de error
  showError: (fieldElement, message) => {
    const field = fieldElement;
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
    
    let feedback = field.parentNode.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentNode.appendChild(feedback);
    }
    feedback.textContent = message;
  },
  
  // Mostrar mensaje de éxito
  showSuccess: (fieldElement, message) => {
    const field = fieldElement;
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    let feedback = field.parentNode.querySelector('.valid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'valid-feedback';
      field.parentNode.appendChild(feedback);
    }
    feedback.textContent = message;
  }
};

// Utilidades para animaciones Bootstrap
export const bootstrapAnimations = {
  // Fade in
  fadeIn: (element, duration = 300) => {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },
  
  // Fade out
  fadeOut: (element, duration = 300) => {
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.max(1 - progress / duration, 0);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    requestAnimationFrame(animate);
  },
  
  // Slide down
  slideDown: (element, duration = 300) => {
    element.style.height = '0px';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const targetHeight = element.scrollHeight;
    let start = null;
    
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const height = Math.min((progress / duration) * targetHeight, targetHeight);
      
      element.style.height = height + 'px';
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.height = 'auto';
        element.style.overflow = 'visible';
      }
    };
    
    requestAnimationFrame(animate);
  },
  
  // Slide up
  slideUp: (element, duration = 300) => {
    const targetHeight = element.scrollHeight;
    element.style.height = targetHeight + 'px';
    element.style.overflow = 'hidden';
    
    let start = null;
    
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const height = Math.max(targetHeight - (progress / duration) * targetHeight, 0);
      
      element.style.height = height + 'px';
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        element.style.height = 'auto';
        element.style.overflow = 'visible';
      }
    };
    
    requestAnimationFrame(animate);
  }
};
