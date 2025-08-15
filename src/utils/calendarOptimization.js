// Optimización de importaciones de Calendar
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar FullCalendar de forma lazy
export const loadFullCalendar = async () => {
  const { Calendar } = await import('@fullcalendar/core');
  const dayGridPlugin = await import('@fullcalendar/daygrid');
  const interactionPlugin = await import('@fullcalendar/interaction');
  
  return {
    Calendar,
    dayGridPlugin: dayGridPlugin.default,
    interactionPlugin: interactionPlugin.default
  };
};

// Función para cargar React Calendar de forma lazy
export const loadReactCalendar = async () => {
  const Calendar = await import('react-calendar');
  return Calendar.default;
};

// Función para cargar Date-fns de forma lazy
export const loadDateFns = async () => {
  const { format, parseISO, addDays, subDays, startOfDay, endOfDay } = await import('date-fns');
  return { format, parseISO, addDays, subDays, startOfDay, endOfDay };
};

// Función para cargar Day.js de forma lazy
export const loadDayJS = async () => {
  const dayjs = await import('dayjs');
  return dayjs.default;
};

// Configuración optimizada para FullCalendar
export const getFullCalendarConfig = async (options = {}) => {
  const { Calendar, dayGridPlugin, interactionPlugin } = await loadFullCalendar();
  
  const defaultConfig = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay'
    },
    locale: 'es',
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    height: 'auto',
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    events: [],
    select: (arg) => {
      console.log('Fecha seleccionada:', arg.startStr);
    },
    eventClick: (arg) => {
      console.log('Evento clickeado:', arg.event.title);
    },
    eventDrop: (arg) => {
      console.log('Evento movido:', arg.event.title);
    },
    eventResize: (arg) => {
      console.log('Evento redimensionado:', arg.event.title);
    },
    ...options
  };
  
  return { Calendar, config: defaultConfig };
};

// Configuración optimizada para React Calendar
export const getReactCalendarConfig = async (options = {}) => {
  const Calendar = await loadReactCalendar();
  
  const defaultConfig = {
    locale: 'es-ES',
    formatDay: (locale, date) => date.getDate(),
    formatMonth: (locale, date) => date.toLocaleDateString(locale, { month: 'long' }),
    formatYear: (locale, date) => date.getFullYear(),
    formatMonthYear: (locale, date) => date.toLocaleDateString(locale, { 
      month: 'long', 
      year: 'numeric' 
    }),
    minDate: new Date(1900, 0, 1),
    maxDate: new Date(2100, 11, 31),
    showNeighboringMonth: true,
    showFixedNumberOfWeeks: true,
    showWeekNumbers: false,
    selectRange: false,
    multiple: false,
    onChange: (value) => {
      console.log('Fecha seleccionada:', value);
    },
    ...options
  };
  
  return { Calendar, config: defaultConfig };
};

// Utilidades de fecha optimizadas
export const dateUtils = {
  // Formatear fecha
  formatDate: async (date, format = 'dd/MM/yyyy') => {
    const { format: formatFn } = await loadDateFns();
    return formatFn(new Date(date), format);
  },
  
  // Parsear fecha ISO
  parseDate: async (dateString) => {
    const { parseISO } = await loadDateFns();
    return parseISO(dateString);
  },
  
  // Agregar días
  addDays: async (date, days) => {
    const { addDays: addDaysFn } = await loadDateFns();
    return addDaysFn(new Date(date), days);
  },
  
  // Restar días
  subtractDays: async (date, days) => {
    const { subDays } = await loadDateFns();
    return subDays(new Date(date), days);
  },
  
  // Inicio del día
  startOfDay: async (date) => {
    const { startOfDay: startOfDayFn } = await loadDateFns();
    return startOfDayFn(new Date(date));
  },
  
  // Fin del día
  endOfDay: async (date) => {
    const { endOfDay: endOfDayFn } = await loadDateFns();
    return endOfDayFn(new Date(date));
  },
  
  // Verificar si es hoy
  isToday: (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  },
  
  // Verificar si es fin de semana
  isWeekend: (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  },
  
  // Obtener nombre del día
  getDayName: async (date, locale = 'es') => {
    const dayjs = await loadDayJS();
    return dayjs(date).locale(locale).format('dddd');
  },
  
  // Obtener nombre del mes
  getMonthName: async (date, locale = 'es') => {
    const dayjs = await loadDayJS();
    return dayjs(date).locale(locale).format('MMMM');
  },
  
  // Calcular diferencia en días
  differenceInDays: async (date1, date2) => {
    const { differenceInDays: diffInDays } = await import('date-fns');
    return diffInDays(new Date(date1), new Date(date2));
  },
  
  // Calcular diferencia en semanas
  differenceInWeeks: async (date1, date2) => {
    const { differenceInWeeks: diffInWeeks } = await import('date-fns');
    return diffInWeeks(new Date(date1), new Date(date2));
  },
  
  // Calcular diferencia en meses
  differenceInMonths: async (date1, date2) => {
    const { differenceInMonths: diffInMonths } = await import('date-fns');
    return diffInMonths(new Date(date1), new Date(date2));
  },
  
  // Calcular diferencia en años
  differenceInYears: async (date1, date2) => {
    const { differenceInYears: diffInYears } = await import('date-fns');
    return diffInYears(new Date(date1), new Date(date2));
  }
};

// Utilidades para eventos del calendario
export const eventUtils = {
  // Crear evento
  createEvent: (title, start, end, options = {}) => {
    return {
      id: options.id || Date.now().toString(),
      title,
      start,
      end,
      allDay: options.allDay || false,
      color: options.color || '#378006',
      textColor: options.textColor || '#ffffff',
      backgroundColor: options.backgroundColor || '#378006',
      borderColor: options.borderColor || '#378006',
      editable: options.editable !== false,
      selectable: options.selectable !== false,
      ...options
    };
  },
  
  // Validar evento
  validateEvent: (event) => {
    const errors = [];
    
    if (!event.title) {
      errors.push('El título es requerido');
    }
    
    if (!event.start) {
      errors.push('La fecha de inicio es requerida');
    }
    
    if (event.end && new Date(event.start) > new Date(event.end)) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
    
    return errors;
  },
  
  // Filtrar eventos por fecha
  filterEventsByDate: (events, startDate, endDate) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end || event.start);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      return eventStart <= filterEnd && eventEnd >= filterStart;
    });
  },
  
  // Filtrar eventos por categoría
  filterEventsByCategory: (events, category) => {
    return events.filter(event => event.category === category);
  },
  
  // Agrupar eventos por día
  groupEventsByDay: (events) => {
    const grouped = {};
    
    events.forEach(event => {
      const date = new Date(event.start).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    
    return grouped;
  },
  
  // Ordenar eventos por fecha
  sortEventsByDate: (events, ascending = true) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }
};
