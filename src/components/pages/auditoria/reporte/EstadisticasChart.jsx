import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const EstadisticasChart = ({ estadisticas, title }) => {
  useEffect(() => {
    const loadGoogleCharts = () => {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => {
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(() => {
          drawChart('donutchart-incluye', true);  // Gráfico con "No aplica"
          drawChart('donutchart-excluye', false); // Gráfico sin "No aplica"
        });
      };
      document.body.appendChild(script);
    };

    const drawChart = (elementId, includeNoAplica) => {
      const filteredData = Object.entries(estadisticas).filter(([key]) => includeNoAplica || key !== 'No aplica');
      const data = window.google.visualization.arrayToDataTable([
        ['Category', 'Value'],
        ...filteredData.map(([key, value]) => [key, value]),
      ]);

      const options = {
        title: title,
        pieHole: 0.4, // Hacer que el gráfico sea de tipo donut
        pieSliceText: 'label', // Mostrar etiquetas con nombres y porcentajes
        tooltip: {
          trigger: 'selection', // Mostrar tooltips al seleccionar
        },
        chartArea: {
          width: '90%', // Ajustar el área del gráfico para llenar el contenedor
          height: '80%', // Ajustar la altura del gráfico
        },
        slices: {
          0: { offset: 0.05 }, // Espacio entre los segmentos
        },
        legend: {
          position: 'bottom', // Posicionar la leyenda en la parte inferior
          alignment: 'center', // Alinear la leyenda al centro horizontalmente
        },
        pieSliceTextStyle: {
          color: 'black', // Color del texto de las etiquetas
          fontSize: 12, // Tamaño de la fuente de las etiquetas
        },
        pieSliceText: 'percentage', // Mostrar porcentajes en las etiquetas
      };

      const chart = new window.google.visualization.PieChart(
        document.getElementById(elementId)
      );
      chart.draw(data, options);
    };

    loadGoogleCharts();
  }, [estadisticas, title]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 3,
        padding: 2,
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        boxShadow: 2,
        height: '75vh', // Ocupa toda la altura de la pantalla
        width: '75vw', // Ocupa toda la anchura de la pantalla
        overflow: 'hidden', // Evita el desbordamiento
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          height: '90%', // Ajusta la altura para el espacio disponible
        }}
      >
        <Box
          id="donutchart-incluye"
          sx={{
            width: '48%',
            height: '100%', // Ocupa toda la altura disponible
            padding: 2,
          }}
        ></Box>
        <Box
          id="donutchart-excluye"
          sx={{
            width: '48%',
            height: '100%', // Ocupa toda la altura disponible
            padding: 2,
          }}
        ></Box>
      </Box>
    </Box>
  );
};

export default EstadisticasChart;
