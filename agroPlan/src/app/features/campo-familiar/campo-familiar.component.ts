import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campo-familiar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campo-familiar.component.html',
  styleUrl: './campo-familiar.component.css'
})
export class CampoFamiliarComponent {
  farm = {
    name: 'Campo Los Laureles',
    location: 'Chincha, Ica',
    totalArea: 120,
    cultivatedArea: 85,
    activeCrops: 4,
    familyMembers: 6
  };

  stats = [
    { label: 'Área total', value: '120 ha', icon: '🌾' },
    { label: 'Área cultivada', value: '85 ha', icon: '🌱' },
    { label: 'Cultivos activos', value: '4', icon: '🌿' },
    { label: 'Miembros familia', value: '6', icon: '👨‍🌾' }
  ];

  fields = [
    { name: 'Parcela Norte', crop: 'Papaya', area: '30 ha', status: 'Activo', statusClass: 'activo', icon: '🌸' },
    { name: 'Parcela Sur', crop: 'Uva', area: '25 ha', status: 'Activo', statusClass: 'activo', icon: '🍇' },
    { name: 'Parcela Este', crop: 'Palta', area: '20 ha', status: 'Activo', statusClass: 'activo', icon: '🥑' },
    { name: 'Parcela Oeste', crop: 'Maíz', area: '10 ha', status: 'Descanso', statusClass: 'descanso', icon: '🌽' }
  ];

  familyMembers = [
    { name: 'Carlos Quispe', role: 'Administrador', icon: '👨‍🌾' },
    { name: 'María Quispe', role: 'Encargada de riego', icon: '👩‍🌾' },
    { name: 'José Quispe', role: 'Cosecha y postcosecha', icon: '🧑‍🌾' },
    { name: 'Ana Quispe', role: 'Comercialización', icon: '👩‍💼' }
  ];

  tasks = [
    { task: 'Riego programado', field: 'Parcela Norte', due: 'Hoy', type: 'warning' },
    { task: 'Fertilización', field: 'Parcela Sur', due: 'Mañana', type: 'info' },
    { task: 'Cosecha de palta', field: 'Parcela Este', due: 'Vie', type: 'success' },
    { task: 'Mantenimiento de equipos', field: 'General', due: 'Sáb', type: 'danger' }
  ];
}
