import { useState, useEffect } from 'react';
import { getDocs, updateDoc, doc, query, where, Timestamp, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '@/components/context/AuthContext';

/**
 * ⚠️ MIGRACIÓN PENDIENTE: Este hook usa colecciones que requieren referencias por parámetro:
 * - apps/audit/users (necesita referencia de colección)
 * - empresas (necesita referencia de colección)
 * - apps/audit/users/{clienteId}/pagos (necesita referencia de colección)
 * 
 * Para migrar completamente, el hook debería recibir estas referencias como parámetros.
 */

export const useClientes = (usuariosCollectionRef, empresasCollectionRef) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operariosPorCliente, setOperariosPorCliente] = useState({});
  const { userProfile } = useAuth();

  // Función para calcular el estado del semáforo
  const calcularSemaforo = (cliente) => {
    const hoy = new Date();
    const fechaVencimiento = cliente.fechaVencimiento ? 
      (cliente.fechaVencimiento.toDate ? new Date(cliente.fechaVencimiento.toDate()) : new Date(cliente.fechaVencimiento)) : null;
    const diasRestantes = fechaVencimiento ? 
      Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)) : 0;
    
    if (!cliente.activo) return 'rojo';
    if (cliente.esDemo) {
      if (diasRestantes <= 0) return 'rojo';
      if (diasRestantes <= 7) return 'amarillo';
      return 'verde';
    }
    if (cliente.estadoPago === 'vencido') return 'rojo';
    if (cliente.estadoPago === 'pendiente') return 'amarillo';
    if (diasRestantes <= 7) return 'amarillo';
    return 'verde';
  };

  // Cargar todos los clientes (max)
  const cargarClientes = async () => {
    if (!usuariosCollectionRef) {
      console.error('useClientes: usuariosCollectionRef es requerido');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const q = query(usuariosCollectionRef, where('role', '==', 'max'));
      const snapshot = await getDocs(q);
      
      const clientesData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const cliente = { id: doc.id, ...doc.data() };
          
          // Contar usuarios activos (operarios)
          const qOperarios = query(usuariosCollectionRef, where('clienteAdminId', '==', doc.id));
          const snapshotOperarios = await getDocs(qOperarios);
          cliente.usuariosActivos = snapshotOperarios.size;
          
          // Contar empresas
          if (empresasCollectionRef) {
            const qEmpresas = query(empresasCollectionRef, where('propietarioId', '==', doc.id));
            const snapshotEmpresas = await getDocs(qEmpresas);
            cliente.empresasCount = snapshotEmpresas.size;
          } else {
            cliente.empresasCount = 0;
          }
          
          // Calcular estado del semáforo
          cliente.semaforo = calcularSemaforo(cliente);
          
          return cliente;
        })
      );
      
      setClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Cargar operarios de un cliente
  const cargarOperarios = async (clienteId) => {
    if (operariosPorCliente[clienteId]) return; // Ya cargados
    if (!usuariosCollectionRef) {
      console.error('useClientes: usuariosCollectionRef es requerido');
      return;
    }
    
    try {
      const q = query(usuariosCollectionRef, where('clienteAdminId', '==', clienteId), where('role', '==', 'operario'));
      const snapshot = await getDocs(q);
      setOperariosPorCliente(prev => ({
        ...prev,
        [clienteId]: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }));
    } catch (error) {
      toast.error('Error al cargar operarios');
    }
  };

  // Función para procesar pago
  const handlePago = async (cliente, pagosCollectionRef) => {
    if (!usuariosCollectionRef) {
      throw new Error('usuariosCollectionRef es requerido');
    }
    
    try {
      const userRef = doc(usuariosCollectionRef, cliente.id);
      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // 1 mes
      await updateDoc(userRef, {
        estadoPago: 'al_dia',
        activo: true, // Activar al usuario automáticamente
        fechaVencimiento: Timestamp.fromDate(fechaVencimiento),
        esDemo: false,
        ultimaModificacion: Timestamp.now()
      });
      // Agregar registro al historial de pagos
      if (pagosCollectionRef) {
        await addDoc(pagosCollectionRef, {
          fecha: Timestamp.now(),
          tipo: 'pago',
          detalle: 'Se acreditó el pago de ControlDoc. ¡Gracias por su compra!',
          usuarioEmail: userProfile?.email || ''
        });
      }
      toast.success(`Pago procesado para ${cliente.nombre || cliente.email}`);
      cargarClientes();
    } catch (error) {
      console.error('Error al procesar pago:', error);
      toast.error('Error al procesar pago');
    }
  };

  // Función para activar demo
  const handleDemo = async (cliente) => {
    if (!usuariosCollectionRef) {
      throw new Error('usuariosCollectionRef es requerido');
    }
    
    try {
      const userRef = doc(usuariosCollectionRef, cliente.id);
      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // 1 mes de demo
      
      await updateDoc(userRef, {
        esDemo: true,
        activo: true, // Activar al usuario automáticamente
        fechaVencimiento: Timestamp.fromDate(fechaVencimiento),
        estadoPago: 'al_dia',
        ultimaModificacion: Timestamp.now()
      });
      
      toast.success(`Demo activado para ${cliente.nombre || cliente.email}`);
      cargarClientes();
    } catch (error) {
      console.error('Error al activar demo:', error);
      toast.error('Error al activar demo');
    }
  };

  // Función para activar/desactivar cliente
  const handleToggleActivo = async (cliente) => {
    if (!usuariosCollectionRef) {
      throw new Error('usuariosCollectionRef es requerido');
    }
    
    try {
      const userRef = doc(usuariosCollectionRef, cliente.id);
      await updateDoc(userRef, {
        activo: !cliente.activo,
        ultimaModificacion: Timestamp.now()
      });
      
      toast.success(`${cliente.activo ? 'Desactivado' : 'Activado'} ${cliente.nombre || cliente.email}`);
      cargarClientes();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado');
    }
  };

  // Función para actualizar cliente
  const handleSaveCliente = async (clienteEditando, form) => {
    if (!usuariosCollectionRef) {
      throw new Error('usuariosCollectionRef es requerido');
    }
    
    try {
      const userRef = doc(usuariosCollectionRef, clienteEditando.id);
      const updateData = {
        limiteUsuarios: Number(form.limiteUsuarios),
        plan: form.plan,
        estadoPago: form.estadoPago,
        esDemo: form.esDemo,
        activo: form.activo,
        ultimaModificacion: Timestamp.now()
      };
      
      // Si hay fecha de vencimiento, convertirla
      if (form.fechaVencimiento) {
        updateData.fechaVencimiento = Timestamp.fromDate(new Date(form.fechaVencimiento));
      }
      
      await updateDoc(userRef, updateData);
      
      toast.success('Cliente actualizado correctamente');
      cargarClientes();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast.error('Error al actualizar cliente');
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  return {
    clientes,
    loading,
    operariosPorCliente,
    cargarClientes,
    cargarOperarios,
    handlePago,
    handleDemo,
    handleToggleActivo,
    handleSaveCliente
  };
};
