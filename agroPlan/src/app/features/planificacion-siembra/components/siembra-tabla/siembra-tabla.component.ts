import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Siembra } from '../../../../shared/interfaces/siembra.interface';

@Component({
  selector: 'app-siembra-tabla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './siembra-tabla.component.html',
  styleUrl: './siembra-tabla.component.css'
})
export class SiembraTablaComponent {
  @Input() siembras: Siembra[] = [];
  @Output() eliminar = new EventEmitter<number>();
  @Output() editar = new EventEmitter<Siembra>();

  onEliminar(id?: number): void {
    if (id) {
      this.eliminar.emit(id);
    }
  }

  onEditar(siembra: Siembra): void {
    this.editar.emit(siembra);
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getEstadoBadgeClass(estado?: boolean | string): string {
    if (estado === true || estado === 'true') {
      return 'badge-activo';
    }
    return 'badge-inactivo';
  }

  getEstadoTexto(estado?: boolean | string): string {
    if (estado === true || estado === 'true') {
      return 'Activo';
    }
    return 'Inactivo';
  }
}
