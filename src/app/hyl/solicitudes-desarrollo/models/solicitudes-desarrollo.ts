// src/app/interfaces/solicitudes-desarrollo.ts

export interface SolicitudDesarrollo {
  id?: number;
  titulo: string;
  descripcion: string;
  solicitante: string;
  area: string;
  prioridad: 'alta' | 'media' | 'baja';
  estado: 'pendiente' | 'en progreso' | 'completada' | 'rechazada';
  fechaCreacion: Date;
  fechaLimite?: Date;
}