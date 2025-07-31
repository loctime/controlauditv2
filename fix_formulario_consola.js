// Script para arreglar el formulario RGRL
// Copiar y pegar en la consola del navegador (F12)

// Función para arreglar el formulario RGRL
const arreglarFormularioRGRL = async () => {
  try {
    // Obtener el UID del usuario actual
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.uid) {
      console.error('❌ No se pudo obtener el UID del usuario. Asegúrate de estar logueado.');
      return;
    }
    
    const userUID = userInfo.uid;
    console.log('👤 UID del usuario:', userUID);
    
    // Buscar el formulario RGRL
    const formulariosRef = firebase.firestore().collection('formularios');
    const snapshot = await formulariosRef.where('nombre', '==', 'RGRL').get();
    
    if (snapshot.empty) {
      console.error('❌ No se encontró el formulario RGRL');
      return;
    }
    
    const formularioDoc = snapshot.docs[0];
    const formularioId = formularioDoc.id;
    
    console.log('📋 Formulario encontrado:', formularioId);
    console.log('📄 Datos actuales:', formularioDoc.data());
    
    // Actualizar el documento
    await formulariosRef.doc(formularioId).update({
      esPublico: true, // Cambiar de "true" (string) a true (boolean)
      creadorId: userUID, // Agregar el creadorId
      clienteAdminId: userUID, // Agregar el clienteAdminId
      estado: 'activo', // Asegurar que sea string
      timestamp: new Date(), // Agregar timestamp si no existe
      ultimaModificacion: new Date() // Agregar última modificación
    });
    
    console.log('✅ Formulario RGRL actualizado correctamente');
    console.log('🔄 Recarga la página para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error al arreglar el formulario:', error);
  }
};

// Ejecutar la función
console.log('🚀 Iniciando arreglo del formulario RGRL...');
arreglarFormularioRGRL(); 