import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasSiembra } from '../../../../shared/interfaces/siembra.interface';

@Component({
  selector: 'app-siembra-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './siembra-estadisticas.component.html',
  styleUrl: './siembra-estadisticas.component.css'
})
export class SiembraEstadisticasComponent {
  @Input() estadisticas: EstadisticasSiembra | null = null;
}
