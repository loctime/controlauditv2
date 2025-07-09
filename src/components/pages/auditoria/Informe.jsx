import React from "react";
import { Typography } from "@mui/material";
import { Pie } from "react-chartjs-2";

const Informe = ({ empresa, sucursal, respuestas, secciones, nombreFormulario }) => {
  // Calcula los datos para el gráfico de torta
  const totalPreguntas = respuestas.flat().length;
  const conformes = respuestas.flat().filter(r => r === "Conforme").length;
  const noConformes = respuestas.flat().filter(r => r === "No conforme").length;
  const necesitaMejora = respuestas.flat().filter(r => r === "Necesita mejora").length;
  const noAplica = respuestas.flat().filter(r => r === "No aplica").length;

  const data = {
    labels: ["Conforme", "No conforme", "Necesita mejora", "No aplica"],
    datasets: [
      {
        data: [conformes, noConformes, necesitaMejora, noAplica],
        backgroundColor: ["#4caf50", "#f44336", "#ff9800", "#9e9e9e"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const percentage = ((value / totalPreguntas) * 100).toFixed(2) + "%";
            return `${label}: ${value} (${percentage})`;
          },
        },
      },
    },
  };

  return (
    <div className="reporte-container">
      <div className="reporte-content" id="reporte">
        <Typography variant="h5" gutterBottom>
          Informe de Auditoría
        </Typography>
        <Typography variant="body1" gutterBottom>
          Empresa: {empresa}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Sucursal: {sucursal}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Nombre del Formulario: {nombreFormulario || "Nombre no disponible"}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Preguntas respondidas: {totalPreguntas}
        </Typography>
        <div className="grafico-container">
          <Pie data={data} options={options} />
        </div>
        {/* Aquí puedes incluir el resto de la información del informe */}
      </div>
    </div>
  );
};

export default Informe;
