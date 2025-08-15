// Optimización de importaciones de Charts
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar Chart.js de forma lazy
export const loadChartJS = async () => {
  const {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
    RadialLinearScale,
    Filler
  } = await import('chart.js');

  // Registrar componentes
  Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
    RadialLinearScale,
    Filler
  );

  return Chart;
};

// Función para cargar React-ChartJS-2 de forma lazy
export const loadReactChartJS2 = async () => {
  const { Line, Bar, Pie, Doughnut, Radar, PolarArea } = await import('react-chartjs-2');
  return { Line, Bar, Pie, Doughnut, Radar, PolarArea };
};

// Función para cargar Recharts de forma lazy
export const loadRecharts = async () => {
  const {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
  } = await import('recharts');

  return {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
  };
};

// Configuración optimizada para Chart.js
export const getChartJSConfig = async (options = {}) => {
  const Chart = await loadChartJS();
  
  const defaultConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Gráfico',
      },
    },
    ...options
  };
  
  return { Chart, config: defaultConfig };
};

// Configuración para gráficos de línea con Chart.js
export const getLineChartConfig = async (options = {}) => {
  const { config } = await getChartJSConfig(options);
  
  return {
    ...config,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
};

// Configuración para gráficos de barras con Chart.js
export const getBarChartConfig = async (options = {}) => {
  const { config } = await getChartJSConfig(options);
  
  return {
    ...config,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
};

// Configuración para gráficos de pastel con Chart.js
export const getPieChartConfig = async (options = {}) => {
  const { config } = await getChartJSConfig(options);
  
  return {
    ...config,
    plugins: {
      ...config.plugins,
      legend: {
        position: 'bottom',
      },
    },
  };
};

// Configuración para gráficos de radar con Chart.js
export const getRadarChartConfig = async (options = {}) => {
  const { config } = await getChartJSConfig(options);
  
  return {
    ...config,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  };
};

// Configuración optimizada para Recharts
export const getRechartsConfig = async (options = {}) => {
  const recharts = await loadRecharts();
  
  const defaultConfig = {
    width: 500,
    height: 300,
    data: [],
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
    ...options
  };
  
  return { recharts, config: defaultConfig };
};

// Utilidades para datos de gráficos
export const chartDataUtils = {
  // Crear datos para gráfico de línea
  createLineData: (labels, datasets) => {
    return {
      labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label || `Dataset ${index + 1}`,
        data: dataset.data,
        borderColor: dataset.borderColor || `hsl(${index * 137.5}, 70%, 50%)`,
        backgroundColor: dataset.backgroundColor || `hsla(${index * 137.5}, 70%, 50%, 0.1)`,
        tension: dataset.tension || 0.4,
        fill: dataset.fill || false,
        ...dataset
      }))
    };
  },
  
  // Crear datos para gráfico de barras
  createBarData: (labels, datasets) => {
    return {
      labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label || `Dataset ${index + 1}`,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || `hsl(${index * 137.5}, 70%, 50%)`,
        borderColor: dataset.borderColor || `hsl(${index * 137.5}, 70%, 50%)`,
        borderWidth: dataset.borderWidth || 1,
        ...dataset
      }))
    };
  },
  
  // Crear datos para gráfico de pastel
  createPieData: (labels, data, colors = []) => {
    const defaultColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.length > 0 ? colors : defaultColors.slice(0, data.length),
        borderColor: colors.length > 0 ? colors : defaultColors.slice(0, data.length),
        borderWidth: 1,
      }]
    };
  },
  
  // Crear datos para gráfico de radar
  createRadarData: (labels, datasets) => {
    return {
      labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label || `Dataset ${index + 1}`,
        data: dataset.data,
        borderColor: dataset.borderColor || `hsl(${index * 137.5}, 70%, 50%)`,
        backgroundColor: dataset.backgroundColor || `hsla(${index * 137.5}, 70%, 50%, 0.2)`,
        borderWidth: dataset.borderWidth || 2,
        ...dataset
      }))
    };
  },
  
  // Crear datos para Recharts
  createRechartsData: (data, xKey, yKey) => {
    return data.map(item => ({
      name: item[xKey] || item.name,
      value: item[yKey] || item.value,
      ...item
    }));
  },
  
  // Generar colores automáticamente
  generateColors: (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${i * 360 / count}, 70%, 50%)`);
    }
    return colors;
  },
  
  // Generar datos de ejemplo
  generateSampleData: (count = 10, min = 0, max = 100) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
  },
  
  // Generar etiquetas de ejemplo
  generateSampleLabels: (count = 10, prefix = 'Item') => {
    const labels = [];
    for (let i = 1; i <= count; i++) {
      labels.push(`${prefix} ${i}`);
    }
    return labels;
  }
};

// Utilidades para opciones de gráficos
export const chartOptionsUtils = {
  // Opciones para gráfico de línea
  getLineOptions: (title = 'Gráfico de Línea') => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }),
  
  // Opciones para gráfico de barras
  getBarOptions: (title = 'Gráfico de Barras') => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }),
  
  // Opciones para gráfico de pastel
  getPieOptions: (title = 'Gráfico de Pastel') => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: title,
      },
    },
  }),
  
  // Opciones para gráfico de radar
  getRadarOptions: (title = 'Gráfico de Radar') => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  }),
  
  // Opciones para Recharts
  getRechartsOptions: (title = 'Gráfico') => ({
    width: 500,
    height: 300,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
    title: title,
  })
};
