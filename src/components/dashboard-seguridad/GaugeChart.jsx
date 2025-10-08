import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function GaugeChart({ 
  value, 
  max = 100, 
  title, 
  subtitle, 
  size = 150,
  colors = ['#ef4444', '#f59e0b', '#22c55e']
}) {
  // Calcular el porcentaje
  const percentage = Math.min((value / max) * 100, 100);
  
  // Determinar el color basado en el porcentaje
  const getColor = (percent) => {
    if (percent >= 80) return colors[2]; // Verde
    if (percent >= 60) return colors[1]; // Amarillo
    return colors[0]; // Rojo
  };

  // Datos para el gráfico radial
  const data = [
    {
      name: 'value',
      value: percentage,
      fill: getColor(percentage)
    }
  ];

  // Crear ticks para el medidor
  const ticks = [];
  for (let i = 0; i <= max; i += max / 5) {
    ticks.push(i);
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '1.5rem',
      minHeight: '200px',
      justifyContent: 'center'
    }}>
      {/* Título */}
      <h3 style={{
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 0.5rem 0',
        textAlign: 'center'
      }}>
        {title}
      </h3>

      {/* Gráfico de medidor */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={20}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={getColor(percentage)}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Valor central */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827',
            lineHeight: 1
          }}>
            {percentage.toFixed(0)}%
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>
            {subtitle}
          </div>
        </div>

        {/* Escala de colores */}
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '4px'
        }}>
          {colors.map((color, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: color
              }}
            />
          ))}
        </div>
      </div>

      {/* Valor numérico */}
      <div style={{
        fontSize: '0.875rem',
        color: '#6b7280',
        marginTop: '0.5rem',
        textAlign: 'center'
      }}>
        {value} / {max}
      </div>
    </div>
  );
}
