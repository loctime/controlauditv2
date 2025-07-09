// SafeData.js
import React, { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    empresa: null,
    sucursal: null,
    formulario: null,
    respuestas: {},
  });

  // Funciones para actualizar el contexto, si es necesario
  const updateData = (newData) => setData(prevData => ({ ...prevData, ...newData }));

  return (
    <DataContext.Provider value={{ data, updateData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
