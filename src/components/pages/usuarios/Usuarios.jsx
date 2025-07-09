import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';


//boton
const AgregarUsuarioButton = () => {
  const navigate = useNavigate(); // Mueve esta línea dentro del componente

  const handleClick = () => {
    navigate('/register'); // Debes pasar la ruta como una cadena
  };
  return (
    <Button variant="contained" onClick={handleClick}>
      Agregar usuario
    </Button>
  );
};

export default AgregarUsuarioButton;
