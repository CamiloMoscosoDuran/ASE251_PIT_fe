import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CosechaService } from '../../core/services/cosecha.service';
import { PlanificacionCosecha, EstadisticasCosecha } from '../../shared/interfaces/cosecha.interface';

@Component({
  selector: 'app-planificacion-cosecha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './planificacion-cosecha.component.html',
  styleUrl: './planificacion-cosecha.component.css'
})
export class PlanificacionCosechaComponent implements OnInit, OnDestroy {
  cosechas: PlanificacionCosecha[] = [];
  estadisticas: EstadisticasCosecha | null = null;
  loading: boolean = false;
  error: string | null = null;
  
  mostrarModal: boolean = false;
  formaCrear!: FormGroup;
  cargandoCrear: boolean = false;

  mostrarModalEditar: boolean = false;
  formaEditar!: FormGroup;
  cargandoEditar: boolean = false;
  cosechaEditando: PlanificacionCosecha | null = null;

  mostrarModalConfirmacion: boolean = false;
  cosechaAEliminar: number | null = null;
  cargandoEliminar: boolean = false;

  private destroy$ = new Subject<void>();
  private intentos: number = 0;
  private maxIntentos: number = 3;
  private cargandoActualmente: boolean = false;

  // Crops catalog for mapping crop IDs
  cultivos = [
    { id: 1, nombre: 'Papaya', icono: '🥭' },
    { id: 2, nombre: 'Uva', icono: '🍇' },
    { id: 3, nombre: 'Palta', icono: '🥑' },
    { id: 4, nombre: 'Piña', icono: '🍍' }
  ];

  cultivosMap: { [key: number]: { nombre: string; icono: string } } = {
    1: { nombre: 'Papaya', icono: '🥭' },
    2: { nombre: 'Uva', icono: '🍇' },
    3: { nombre: 'Palta', icono: '🥑' },
    4: { nombre: 'Piña', icono: '🍍' }
  };

  constructor(
    private cosechaService: CosechaService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.formaCrear = this.fb.group({
      fechaRecomendada: ['', Validators.required],
      idCampo: [1, [Validators.required, Validators.min(1)]],
      idCultivo: [1, [Validators.required, Validators.min(1)]],
      hectareas: ['', [Validators.required, Validators.min(0.1)]],
      produccionEstimadaTon: [0, [Validators.min(0)]],
      estado: ['Proyectando', Validators.required]
    });

    this.formaEditar = this.fb.group({
      idCosecha: ['', Validators.required],
      fechaRecomendada: ['', Validators.required],
      idCampo: ['', [Validators.required, Validators.min(1)]],
      idCultivo: ['', [Validators.required, Validators.min(1)]],
      hectareas: ['', [Validators.required, Validators.min(0.1)]],
      produccionEstimadaTon: [0, [Validators.min(0)]],
      estado: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarCosechas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarCosechas(): void {
    if (this.cargandoActualmente) {
      console.warn('[PlanificacionCosecha] Carga ya en progreso, ignorando nueva solicitud');
      return;
    }
    
    this.cargandoActualmente = true;
    this.loading = true;
    this.error = null;
    this.intentos = 0;
    this._realizarCargaCosechas();
  }

  private _realizarCargaCosechas(): void {
    this.ngZone.run(() => {
      this.cosechaService.obtenerCosechas()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cosechas) => {
            console.log('[PlanificacionCosecha] Cosechas cargadas exitosamente:', cosechas.length);
            this.cosechas = cosechas;
            this.loading = false;
            this.cargandoActualmente = false;

            // If empty, auto-seed with high-fidelity mockup data!
            if (cosechas.length === 0) {
              this.autosembrarCosechasMock();
            } else {
              this.cargarEstadisticas();
              this.cdr.markForCheck();
            }
          },
          error: (error) => {
            console.error('[PlanificacionCosecha] Error al cargar cosechas:', error);
            this.intentos++;
            
            if (this.intentos < this.maxIntentos) {
              console.log(`[PlanificacionCosecha] Reintentando... intento ${this.intentos} de ${this.maxIntentos}`);
              setTimeout(() => this._realizarCargaCosechas(), 1000);
            } else {
              this.error = 'Error al cargar las planificaciones de cosecha. Verifica la conexión con el servidor.';
              this.loading = false;
              this.cargandoActualmente = false;
              this.cdr.markForCheck();
            }
          }
        });
    });
  }

  autosembrarCosechasMock(): void {
    console.log('[PlanificacionCosecha] La base de datos está vacía. Sembrando datos de demostración...');
    
    const mockCosechas: PlanificacionCosecha[] = [
      { idCampo: 1, idCultivo: 1, fechaRecomendada: '2026-05-10', hectareas: 8, produccionEstimadaTon: 24, estado: 'En planificación' },
      { idCampo: 1, idCultivo: 2, fechaRecomendada: '2026-07-09', hectareas: 14, produccionEstimadaTon: 56, estado: 'Pendiente' },
      { idCampo: 1, idCultivo: 3, fechaRecomendada: '2026-07-02', hectareas: 13, produccionEstimadaTon: 39, estado: 'En letrago' },
      { idCampo: 1, idCultivo: 4, fechaRecomendada: '2026-06-30', hectareas: 5, produccionEstimadaTon: 20, estado: 'Proyectando' }
    ];

    let creadas = 0;
    mockCosechas.forEach(c => {
      this.cosechaService.crearCosecha(c)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            creadas++;
            if (creadas === mockCosechas.length) {
              console.log('[PlanificacionCosecha] Sembrado completado exitosamente.');
              this.cargandoActualmente = false;
              // Volver a cargar desde base de datos
              this.cosechaService.obtenerCosechas().subscribe(datos => {
                this.cosechas = datos;
                this.cargarEstadisticas();
                this.cdr.markForCheck();
              });
            }
          },
          error: (err) => {
            console.error('[PlanificacionCosecha] Error al sembrar registro:', err);
          }
        });
    });
  }

  cargarEstadisticas(): void {
    this.estadisticas = this.cosechaService.obtenerEstadisticas();
  }

  abrirModal(): void {
    this.mostrarModal = true;
    this.formaCrear.reset({
      fechaRecomendada: '',
      idCampo: 1,
      idCultivo: 1,
      hectareas: '',
      produccionEstimadaTon: 0,
      estado: 'Proyectando'
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.formaCrear.reset();
  }

  crearNuevaCosecha(): void {
    if (this.formaCrear.invalid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.cargandoCrear = true;
    const nuevaCosecha: PlanificacionCosecha = this.formaCrear.value;

    this.ngZone.run(() => {
      this.cosechaService.crearCosecha(nuevaCosecha)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargandoCrear = false;
            this.cerrarModal();
            this.cargarCosechas();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error al crear cosecha:', error);
            this.error = 'Error al crear la planificación de cosecha. Intenta de nuevo.';
            this.cargandoCrear = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  eliminarCosecha(id: number): void {
    this.cosechaAEliminar = id;
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.cosechaAEliminar = null;
    this.cargandoEliminar = false;
  }

  confirmarEliminar(): void {
    if (this.cosechaAEliminar === null) return;

    this.cargandoEliminar = true;
    this.ngZone.run(() => {
      this.cosechaService.eliminarCosecha(this.cosechaAEliminar!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargandoEliminar = false;
            this.cerrarModalConfirmacion();
            this.cargarCosechas();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error al eliminar cosecha:', error);
            this.error = 'Error al eliminar la planificación de cosecha.';
            this.cargandoEliminar = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  editarCosecha(cosecha: PlanificacionCosecha): void {
    this.cosechaEditando = cosecha;
    this.mostrarModalEditar = true;
    
    let fechaFormato = '';
    if (cosecha.fechaRecomendada) {
      const fecha = new Date(cosecha.fechaRecomendada);
      fechaFormato = fecha.toISOString().split('T')[0];
    }

    this.formaEditar.patchValue({
      idCosecha: cosecha.idCosecha,
      fechaRecomendada: fechaFormato,
      idCampo: cosecha.idCampo,
      idCultivo: cosecha.idCultivo,
      hectareas: cosecha.hectareas,
      produccionEstimadaTon: cosecha.produccionEstimadaTon || 0,
      estado: cosecha.estado
    });
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.cosechaEditando = null;
    this.formaEditar.reset();
  }

  guardarCambiosCosecha(): void {
    if (this.formaEditar.invalid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.cargandoEditar = true;
    const cosechaActualizada: PlanificacionCosecha = this.formaEditar.value;

    this.ngZone.run(() => {
      this.cosechaService.actualizarCosecha(cosechaActualizada)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargandoEditar = false;
            this.cerrarModalEditar();
            this.cargarCosechas();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error al actualizar cosecha:', error);
            this.error = 'Error al actualizar la planificación de cosecha. Intenta de nuevo.';
            this.cargandoEditar = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  getCultivoNombre(idCultivo: number): string {
    return this.cultivosMap[idCultivo]?.nombre || `Cultivo ${idCultivo}`;
  }

  getCultivoIcono(idCultivo: number): string {
    return this.cultivosMap[idCultivo]?.icono || '🌾';
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';
    // Evitar desajustes de zona horaria reemplazando guiones
    const dateStr = typeof fecha === 'string' ? fecha.replace(/-/g, '\/') : fecha;
    const date = new Date(dateStr);
    
    return date.toLocaleDateString('es-PE', { 
      day: '2-digit',
      month: 'long', 
      year: 'numeric'
    }).replace(/de\s/g, ''); // Deja el formato limpio e.g. "10 Mayo 2026"
  }

  getEstadoBadgeClass(estado?: string): string {
    if (!estado) return 'badge-proyectando';
    const est = estado.toLowerCase().trim();
    if (est === 'en planificacion' || est === 'en planificación') {
      return 'badge-planificacion';
    } else if (est === 'pendiente') {
      return 'badge-pendiente';
    } else if (est === 'en letrago' || est === 'en letargo') {
      return 'badge-letargo';
    } else if (est === 'proyectando') {
      return 'badge-proyectando';
    } else if (est === 'finalizada' || est === 'completada') {
      return 'badge-finalizada';
    }
    return 'badge-proyectando';
  }

  reintentar(): void {
    this.cargarCosechas();
  }
}
