export interface Siembra {
  idSiembra?: number;
  idCampo: number;
  idCultivo: number;
  cultivo?: string; // Nombre del cultivo para mostrar en tabla (opcional)
  fechaSiembra: string | Date;
  hectareas: number;
  estado?: boolean | string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  restoredAt?: Date | null;
}

export interface EstadisticasSiembra {
  totalHectareas: number;
  totalCultivos: number;
  simbrasActivas: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}
