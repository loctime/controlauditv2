import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import BuildIcon from '@mui/icons-material/Build';
import BlockIcon from '@mui/icons-material/Block';

export const respuestasPosibles = ["Conforme", "No conforme", "Necesita mejora", "No aplica"];

// Función para obtener el color de cada respuesta
export const obtenerColorRespuesta = (respuesta) => {
  switch (respuesta) {
    case "Conforme":
      return {
        backgroundColor: '#4caf50',
        color: 'white',
        '&:hover': {
          backgroundColor: '#45a049',
        }
      };
    case "No conforme":
      return {
        backgroundColor: '#f44336',
        color: 'white',
        '&:hover': {
          backgroundColor: '#d32f2f',
        }
      };
    case "Necesita mejora":
      return {
        backgroundColor: '#ff9800',
        color: 'white',
        '&:hover': {
          backgroundColor: '#e68900',
        }
      };
    case "No aplica":
      return {
        backgroundColor: '#9e9e9e',
        color: 'white',
        '&:hover': {
          backgroundColor: '#757575',
        }
      };
    default:
      return {};
  }
};

// Función para obtener el icono de cada respuesta
export const obtenerIconoRespuesta = (respuesta) => {
  switch (respuesta) {
    case "Conforme":
      return <ThumbUpIcon />;
    case "No conforme":
      return <ThumbDownIcon />;
    case "Necesita mejora":
      return <BuildIcon />;
    case "No aplica":
      return <BlockIcon />;
    default:
      return null;
  }
};

// Función para verificar si una pregunta está contestada
export const preguntaContestada = (respuestas, seccionIndex, preguntaIndex) => {
  const respuesta = respuestas[seccionIndex]?.[preguntaIndex];
  return respuesta && respuesta.trim() !== '';
};

// Función para obtener todas las preguntas no contestadas
export const obtenerPreguntasNoContestadas = (secciones, respuestas) => {
  const noContestadas = [];
  secciones.forEach((seccion, seccionIndex) => {
    seccion.preguntas.forEach((pregunta, preguntaIndex) => {
      if (!preguntaContestada(respuestas, seccionIndex, preguntaIndex)) {
        noContestadas.push({
          seccionIndex,
          preguntaIndex,
          seccion: seccion.nombre,
          pregunta: pregunta
        });
      }
    });
  });
  return noContestadas;
}; 