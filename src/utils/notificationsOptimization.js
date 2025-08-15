// Optimización de importaciones de Notifications
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar React Toastify de forma lazy
export const loadReactToastify = async () => {
  const { toast } = await import('react-toastify');
  return toast;
};

// Función para cargar Notistack de forma lazy
export const loadNotistack = async () => {
  const { useSnackbar } = await import('notistack');
  return { useSnackbar };
};

// Función para cargar React Notifications Component de forma lazy
export const loadReactNotificationsComponent = async () => {
  const { addNotification } = await import('react-notifications-component');
  return { addNotification };
};

// Función para cargar SweetAlert2 de forma lazy
export const loadSweetAlert2 = async () => {
  const Swal = await import('sweetalert2');
  return Swal.default;
};

// Configuración optimizada para React Toastify
export const getToastifyConfig = async (options = {}) => {
  const toast = await loadReactToastify();
  
  const defaultConfig = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    ...options
  };
  
  return { toast, config: defaultConfig };
};

// Configuración optimizada para Notistack
export const getNotistackConfig = async (options = {}) => {
  const { useSnackbar } = await loadNotistack();
  
  const defaultConfig = {
    variant: 'default',
    autoHideDuration: 6000,
    anchorOrigin: {
      vertical: 'top',
      horizontal: 'right',
    },
    ...options
  };
  
  return { useSnackbar, config: defaultConfig };
};

// Configuración optimizada para React Notifications Component
export const getReactNotificationsConfig = async (options = {}) => {
  const { addNotification } = await loadReactNotificationsComponent();
  
  const defaultConfig = {
    title: "Notificación",
    message: "Mensaje de notificación",
    type: "info",
    insert: "top",
    container: "top-right",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
      duration: 5000,
      onScreen: true
    },
    ...options
  };
  
  return { addNotification, config: defaultConfig };
};

// Configuración optimizada para SweetAlert2
export const getSweetAlertConfig = async (options = {}) => {
  const Swal = await loadSweetAlert2();
  
  const defaultConfig = {
    title: "¡Atención!",
    text: "Mensaje de alerta",
    icon: "info",
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    showCancelButton: false,
    showConfirmButton: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    ...options
  };
  
  return { Swal, config: defaultConfig };
};

// Utilidades para notificaciones
export const notificationUtils = {
  // Notificación de éxito con Toastify
  success: async (message, options = {}) => {
    const { toast } = await getToastifyConfig(options);
    return toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      ...options
    });
  },
  
  // Notificación de error con Toastify
  error: async (message, options = {}) => {
    const { toast } = await getToastifyConfig(options);
    return toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      ...options
    });
  },
  
  // Notificación de información con Toastify
  info: async (message, options = {}) => {
    const { toast } = await getToastifyConfig(options);
    return toast.info(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      ...options
    });
  },
  
  // Notificación de advertencia con Toastify
  warning: async (message, options = {}) => {
    const { toast } = await getToastifyConfig(options);
    return toast.warning(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      ...options
    });
  },
  
  // Notificación de éxito con Notistack
  successSnackbar: async (message, options = {}) => {
    const { useSnackbar } = await loadNotistack();
    const { enqueueSnackbar } = useSnackbar();
    return enqueueSnackbar(message, {
      variant: 'success',
      autoHideDuration: 3000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      ...options
    });
  },
  
  // Notificación de error con Notistack
  errorSnackbar: async (message, options = {}) => {
    const { useSnackbar } = await loadNotistack();
    const { enqueueSnackbar } = useSnackbar();
    return enqueueSnackbar(message, {
      variant: 'error',
      autoHideDuration: 5000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      ...options
    });
  },
  
  // Notificación de información con Notistack
  infoSnackbar: async (message, options = {}) => {
    const { useSnackbar } = await loadNotistack();
    const { enqueueSnackbar } = useSnackbar();
    return enqueueSnackbar(message, {
      variant: 'info',
      autoHideDuration: 4000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      ...options
    });
  },
  
  // Notificación de advertencia con Notistack
  warningSnackbar: async (message, options = {}) => {
    const { useSnackbar } = await loadNotistack();
    const { enqueueSnackbar } = useSnackbar();
    return enqueueSnackbar(message, {
      variant: 'warning',
      autoHideDuration: 4000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      ...options
    });
  },
  
  // Notificación con React Notifications Component
  addNotification: async (title, message, type = 'info', options = {}) => {
    const { addNotification } = await loadReactNotificationsComponent();
    return addNotification({
      title,
      message,
      type,
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: {
        duration: 5000,
        onScreen: true
      },
      ...options
    });
  },
  
  // Alert de confirmación con SweetAlert2
  confirm: async (title, text, options = {}) => {
    const Swal = await loadSweetAlert2();
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      ...options
    });
  },
  
  // Alert de éxito con SweetAlert2
  successAlert: async (title, text, options = {}) => {
    const Swal = await loadSweetAlert2();
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Aceptar',
      ...options
    });
  },
  
  // Alert de error con SweetAlert2
  errorAlert: async (title, text, options = {}) => {
    const Swal = await loadSweetAlert2();
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Aceptar',
      ...options
    });
  },
  
  // Alert de advertencia con SweetAlert2
  warningAlert: async (title, text, options = {}) => {
    const Swal = await loadSweetAlert2();
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#ffc107',
      confirmButtonText: 'Aceptar',
      ...options
    });
  },
  
  // Alert de información con SweetAlert2
  infoAlert: async (title, text, options = {}) => {
    const Swal = await loadSweetAlert2();
    return Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonColor: '#17a2b8',
      confirmButtonText: 'Aceptar',
      ...options
    });
  }
};

// Hook personalizado para notificaciones
export const useNotifications = () => {
  const showSuccess = async (message, options = {}) => {
    return await notificationUtils.success(message, options);
  };
  
  const showError = async (message, options = {}) => {
    return await notificationUtils.error(message, options);
  };
  
  const showInfo = async (message, options = {}) => {
    return await notificationUtils.info(message, options);
  };
  
  const showWarning = async (message, options = {}) => {
    return await notificationUtils.warning(message, options);
  };
  
  const showConfirm = async (title, text, options = {}) => {
    return await notificationUtils.confirm(title, text, options);
  };
  
  const showSuccessAlert = async (title, text, options = {}) => {
    return await notificationUtils.successAlert(title, text, options);
  };
  
  const showErrorAlert = async (title, text, options = {}) => {
    return await notificationUtils.errorAlert(title, text, options);
  };
  
  const showWarningAlert = async (title, text, options = {}) => {
    return await notificationUtils.warningAlert(title, text, options);
  };
  
  const showInfoAlert = async (title, text, options = {}) => {
    return await notificationUtils.infoAlert(title, text, options);
  };
  
  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConfirm,
    showSuccessAlert,
    showErrorAlert,
    showWarningAlert,
    showInfoAlert
  };
};
