export interface Calendario {
  idEvento?: number;
  idCampo: number;
  idCultivo: number;
  fecha: string;
  tipoEvento: string;
  hectareas?: number;
  estado?: string;
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  restoredAt?: string | null;
}

export interface EstadisticasCalendario {
  totalSiembras: number;
  totalCosechas: number;
  totalRiegos: number;
  totalFertilizaciones: number;
}
