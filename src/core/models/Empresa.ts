/**
 * Modelo Empresa - Representa una empresa del owner
 * 
 * Las empresas pertenecen a un owner específico.
 * Los usuarios pueden tener acceso a empresas asignadas.
 */
export interface Empresa {
  id: string;
  ownerId: string;
  nombre: string;
  createdAt: Date;
  activa: boolean;
}
