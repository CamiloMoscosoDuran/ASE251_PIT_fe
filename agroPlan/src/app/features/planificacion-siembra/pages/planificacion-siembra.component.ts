import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SiembraService } from '../../../core/services/siembra.service';
import { Siembra, EstadisticasSiembra } from '../../../shared/interfaces/siembra.interface';
import { SiembraTablaComponent } from '../components/siembra-tabla/siembra-tabla.component';
import { SiembraEstadisticasComponent } from '../components/siembra-estadisticas/siembra-estadisticas.component';

@Component({
  selector: 'app-planificacion-siembra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SiembraTablaComponent, SiembraEstadisticasComponent],
  templateUrl: './planificacion-siembra.component.html',
  styleUrl: './planificacion-siembra.component.css'
})
export class PlanificacionSiembraComponent implements OnInit, OnDestroy {
  siembras: Siembra[] = [];
  estadisticas: EstadisticasSiembra | null = null;
  loading: boolean = false;
  error: string | null = null;
  mostrarModal: boolean = false;
  formaCrear!: FormGroup;
  cargandoCrear: boolean = false;
  mostrarModalEditar: boolean = false;
  formaEditar!: FormGroup;
  cargandoEditar: boolean = false;
  siembraEditando: Siembra | null = null;
  mostrarModalConfirmacion: boolean = false;
  siembraAEliminar: number | null = null;
  cargandoEliminar: boolean = false;
  private destroy$ = new Subject<void>();
  private intentos: number = 0;
  private maxIntentos: number = 3;
  private cargandoActualmente: boolean = false;

  constructor(
    private siembraService: SiembraService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.formaCrear = this.fb.group({
      fechaSiembra: ['', Validators.required],
      idCampo: ['', [Validators.required, Validators.min(1)]],
      cultivo: ['', Validators.required],
      idCultivo: ['', [Validators.required, Validators.min(1)]],
      hectareas: ['', [Validators.required, Validators.min(0.1)]],
      estado: [true]
    });

    this.formaEditar = this.fb.group({
      idSiembra: ['', Validators.required],
      fechaSiembra: ['', Validators.required],
      idCampo: ['', [Validators.required, Validators.min(1)]],
      cultivo: ['', Validators.required],
      idCultivo: ['', [Validators.required, Validators.min(1)]],
      hectareas: ['', [Validators.required, Validators.min(0.1)]],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.cargarSiembras();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarSiembras(): void {
    // Evitar múltiples cargas simultáneas
    if (this.cargandoActualmente) {
      console.warn('[PlanificacionSiembra] Carga ya en progreso, ignorando nueva solicitud');
      return;
    }
    
    this.cargandoActualmente = true;
    this.loading = true;
    this.error = null;
    this.intentos = 0;
    this._realizarCargaSiembras();
  }

  private _realizarCargaSiembras(): void {
    this.ngZone.run(() => {
      this.siembraService.obtenerSiembras()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (siembras) => {
            console.log('[PlanificacionSiembra] Siembras cargadas exitosamente:', siembras.length);
            this.siembras = siembras;
            this.loading = false;
            this.cargandoActualmente = false;
            this.cargarEstadisticas();
            // Forzar detección de cambios para asegurar que la vista se actualiza
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('[PlanificacionSiembra] Error al cargar siembras:', error);
            this.intentos++;
            
            if (this.intentos < this.maxIntentos) {
              console.log(`[PlanificacionSiembra] Reintentando... intento ${this.intentos} de ${this.maxIntentos}`);
              setTimeout(() => this._realizarCargaSiembras(), 1000);
            } else {
              this.error = 'Error al cargar las siembras. Verifica la conexión con el servidor.';
              this.loading = false;
              this.cargandoActualmente = false;
              // Forzar detección de cambios en caso de error
              this.cdr.markForCheck();
            }
          }
        });
    });
  }

  cargarEstadisticas(): void {
    this.estadisticas = this.siembraService.obtenerEstadisticas();
  }

  abrirModal(): void {
    this.mostrarModal = true;
    this.formaCrear.reset({ estado: true });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.formaCrear.reset({ estado: true });
  }

  crearNuevaSiembra(): void {
    if (this.formaCrear.invalid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.cargandoCrear = true;
    const nuevaSiembra: Siembra = this.formaCrear.value;

    this.ngZone.run(() => {
      this.siembraService.crearSiembra(nuevaSiembra)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargandoCrear = false;
            this.cerrarModal();
            this.cargarSiembras();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error al crear siembra:', error);
            this.error = 'Error al crear la siembra. Intenta de nuevo.';
            this.cargandoCrear = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  eliminarSiembra(id: number): void {
    this.siembraAEliminar = id;
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.siembraAEliminar = null;
    this.cargandoEliminar = false;
  }

  confirmarEliminar(): void {
    if (this.siembraAEliminar === null) return;

    this.cargandoEliminar = true;
    this.ngZone.run(() => {
      this.siembraService.eliminarSiembra(this.siembraAEliminar!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargandoEliminar = false;
            this.cerrarModalConfirmacion();
            this.cargarSiembras();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error al eliminar siembra:', error);
            this.error = 'Error al eliminar la siembra.';
            this.cargandoEliminar = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  editarSiembra(siembra: Siembra): void {
    this.siembraEditando = siembra;
    this.mostrarModalEditar = true;
    
    // Convertir la fecha al formato que acepta el input type="date"
    let fechaFormato = '';
    if (siembra.fechaSiembra) {
      const fecha = new Date(siembra.fechaSiembra);
      fechaFormato = fecha.toISOString().split('T')[0];
    }

    this.formaEditar.patchValue({
      idSiembra: siembra.idSiembra,
      fechaSiembra: fechaFormato,
      idCampo: siembra.idCampo,
      cultivo: siembra.cultivo || '',
      idCultivo: siembra.idCultivo,
      hectareas: siembra.hectareas,
      estado: siembra.estado
    });
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.siembraEditando = null;
    this.formaEditar.reset({ estado: true });
  }

  guardarCambiosSiembra(): void {
    if (this.formaEditar.invalid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.cargandoEditar = true;
    const siembraActualizada: Siembra = this.formaEditar.value;

    this.ngZone.run(() => {
      this.siembraService.actualizarSiembra(siembraActualizada)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargandoEditar = false;
            this.cerrarModalEditar();
            this.cargarSiembras();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error al actualizar siembra:', error);
            this.error = 'Error al actualizar la siembra. Intenta de nuevo.';
            this.cargandoEditar = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  reintentar(): void {
    this.cargarSiembras();
  }
}
