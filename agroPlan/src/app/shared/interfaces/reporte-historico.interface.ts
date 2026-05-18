export interface ReporteHistorico {
  idReporte?: number;
  idCampo: number;
  idCultivo: number;
  mes: number;
  anio: number;
  produccionTon: number;
  ingresos: number;
  gastos: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  restoredAt?: string | null;
}

export interface ResumenReportes {
  produccionTotal: number;
  ingresosAcumulados: number;
  gastosAcumulados: number;
  margenNeto: number;
  variacionProduccion: number;
  variacionIngresos: number;
  variacionGastos: number;
  variacionMargen: number;
}

export interface DatosMensuales {
  mes: string;
  produccion: number;
  ingresos: number;
  gastos: number;
  idCultivo: number;
}
