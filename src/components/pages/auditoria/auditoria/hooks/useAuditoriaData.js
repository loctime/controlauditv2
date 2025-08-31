import { useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import { useAuth } from "../../../../context/AuthContext";

export const useAuditoriaData = (
  setEmpresas,
  setSucursales,
  setFormularios,
  empresaSeleccionada,
  userProfile,
  userEmpresas,
  userFormularios
) => {
  const { recargarEmpresas } = useAuth();
  
  // Cargar empresas desde el contexto
  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0) {
      setEmpresas(userEmpresas);
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG Auditoria] Empresas desde contexto:', userEmpresas);
      }
    }
  }, [userEmpresas, setEmpresas]);

  // Cargar sucursales cuando cambie la empresa
  useEffect(() => {
    const obtenerSucursales = async () => {
      if (empresaSeleccionada) {
        try {
          const sucursalesCollection = collection(db, "sucursales");
          const q = query(sucursalesCollection, where("empresa", "==", empresaSeleccionada.nombre));
          const snapshot = await getDocs(q);
          const sucursalesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            nombre: doc.data().nombre,
          }));
          setSucursales(sucursalesData);
        } catch (error) {
          console.error("Error al obtener sucursales:", error);
        }
      } else {
        setSucursales([]);
      }
    };

    obtenerSucursales();
  }, [empresaSeleccionada, setSucursales]);

  // Cargar formularios desde el contexto o Firestore
  useEffect(() => {
    if (userFormularios && userFormularios.length > 0) {
      setFormularios(userFormularios);
      console.log('[DEBUG Auditoria] Formularios desde contexto:', userFormularios);
    }
  }, [userFormularios, setFormularios]);

  // Cargar formularios desde Firestore si no están en el contexto
  useEffect(() => {
    if (!userFormularios || userFormularios.length === 0) {
      const obtenerFormularios = async () => {
        try {
          if (!userProfile) return;
          const formulariosCollection = collection(db, "formularios");
          const snapshot = await getDocs(formulariosCollection);
          const todosLosFormularios = snapshot.docs.map((doc) => ({
            id: doc.id,
            nombre: doc.data().nombre,
            secciones: doc.data().secciones,
            creadorId: doc.data().creadorId,
            creadorEmail: doc.data().creadorEmail,
            esPublico: doc.data().esPublico,
            permisos: doc.data().permisos,
            clienteAdminId: doc.data().clienteAdminId
          }));
          
          // Filtrar formularios por permisos multi-tenant
          const formulariosPermitidos = todosLosFormularios.filter(formulario => {
            if (userProfile.role === 'supermax') return true;
            if (userProfile.role === 'max') {
              return formulario.clienteAdminId === userProfile.uid || 
                     formulario.creadorId === userProfile.uid;
            }
            if (userProfile.role === 'operario') {
              return formulario.creadorId === userProfile.uid ||
                     formulario.clienteAdminId === userProfile.clienteAdminId ||
                     formulario.esPublico ||
                     formulario.permisos?.puedeVer?.includes(userProfile.uid);
            }
            return false;
          });
          setFormularios(formulariosPermitidos);
          console.log(`[DEBUG Auditoria] Formularios permitidos: ${formulariosPermitidos.length} de ${todosLosFormularios.length}`);
        } catch (error) {
          console.error("Error al obtener formularios:", error);
        }
      };
      obtenerFormularios();
    }
  }, [userProfile, userFormularios, setFormularios]);
}; 