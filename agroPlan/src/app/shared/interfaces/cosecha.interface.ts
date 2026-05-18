export interface PlanificacionCosecha {
  idCosecha?: number;
  idCampo: number;
  idCultivo: number;
  fechaRecomendada: string | Date;
  hectareas: number;
  produccionEstimadaTon?: number;
  estado?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
  restoredAt?: string | Date | null;
}

export interface EstadisticasCosecha {
  totalHectareas: number;
  totalCultivos: number;
  cosechasCompletadas: number;
}
