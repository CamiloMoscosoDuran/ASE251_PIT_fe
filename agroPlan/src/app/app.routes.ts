import { Routes } from '@angular/router';
import { PlanificacionSiembraComponent } from './features/planificacion-siembra/pages/planificacion-siembra.component';
import { PlanificacionCosechaComponent } from './features/planificacion-cosecha/planificacion-cosecha.component';
import { CalendarioComponent } from './features/calendario/calendario.component';
import { ClimaAlertasComponent } from './features/clima-alertas/clima-alertas.component';
import { ReportesComponent } from './features/reportes/reportes.component';
import { CampoFamiliarComponent } from './features/campo-familiar/campo-familiar.component';

export const routes: Routes = [
  {
    path: 'planificacion-siembra',
    component: PlanificacionSiembraComponent
  },
  {
    path: 'planificacion-cosecha',
    component: PlanificacionCosechaComponent
  },
  {
    path: 'calendario',
    component: CalendarioComponent
  },
  {
    path: 'clima-alertas',
    component: ClimaAlertasComponent
  },
  {
    path: 'reportes',
    component: ReportesComponent
  },
  {
    path: 'campo-familiar',
    component: CampoFamiliarComponent
  },
  {
    path: '',
    redirectTo: 'planificacion-siembra',
    pathMatch: 'full'
  }
];
