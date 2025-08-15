// Optimización de importaciones de Chart.js
// Importar solo los componentes necesarios para reducir el tamaño del bundle

import {
  Chart as ChartJS,
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
} from 'chart.js';

// Registrar solo los componentes que necesites
ChartJS.register(
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

// Exportar configuración optimizada
export const chartConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Chart Title',
    },
  },
};

// Configuración para gráficos de línea
export const lineChartConfig = {
  ...chartConfig,
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// Configuración para gráficos de barras
export const barChartConfig = {
  ...chartConfig,
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// Configuración para gráficos de pastel
export const pieChartConfig = {
  ...chartConfig,
  plugins: {
    ...chartConfig.plugins,
    legend: {
      position: 'bottom',
    },
  },
};

// Configuración para gráficos de radar
export const radarChartConfig = {
  ...chartConfig,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
    },
  },
};
