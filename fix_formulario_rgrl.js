// Script para arreglar el formulario RGRL
// Ejecutar en la consola del navegador en la página de tu aplicación

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './src/firebaseConfig';

// Función para arreglar el formulario RGRL
const arreglarFormularioRGRL = async () => {
  try {
    // Primero necesitamos encontrar el documento del formulario RGRL
    // Buscar por nombre en la colección formularios
    const formulariosRef = collection(db, 'formularios');
    const q = query(formulariosRef, where('nombre', '==', 'RGRL'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.error('No se encontró el formulario RGRL');
      return;
    }
    
    const formularioDoc = snapshot.docs[0];
    const formularioId = formularioDoc.id;
    
    console.log('Formulario encontrado:', formularioId);
    
    // Obtener el UID del usuario licvidalfernando@gmail.com
    // Esto lo puedes obtener de tu perfil de usuario o del AuthContext
    const userUID = 'TU_UID_AQUI'; // Reemplazar con el UID real
    
    // Actualizar el documento con los campos correctos
    const formularioRef = doc(db, 'formularios', formularioId);
    await updateDoc(formularioRef, {
      esPublico: true, // Cambiar de "true" (string) a true (boolean)
      creadorId: userUID, // Agregar el creadorId
      clienteAdminId: userUID, // Agregar el clienteAdminId
      estado: 'activo', // Asegurar que sea string
      timestamp: new Date(), // Agregar timestamp si no existe
      ultimaModificacion: new Date() // Agregar última modificación
    });
    
    console.log('✅ Formulario RGRL actualizado correctamente');
    console.log('Ahora debería aparecer en la galería pública y en tus formularios');
    
  } catch (error) {
    console.error('Error al arreglar el formulario:', error);
  }
};

// Ejecutar la función
arreglarFormularioRGRL(); 