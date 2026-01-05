/**
 * Modelo Owner - Representa el propietario/administrador principal
 * 
 * El owner es la entidad raíz del modelo owner-centric.
 * Todos los usuarios y empresas pertenecen a un owner.
 */
export interface Owner {
  id: string;
  createdAt: Date;
  plan: string;
  activo: boolean;
}
