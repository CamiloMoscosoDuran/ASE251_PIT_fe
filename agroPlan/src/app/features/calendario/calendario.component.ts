import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CalendarioService } from '../../core/services/calendario.service';
import { Calendario, EstadisticasCalendario } from '../../shared/interfaces/calendario.interface';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit, OnDestroy {
  eventos: Calendario[] = [];
  estadisticas: EstadisticasCalendario = {
    totalSiembras: 0,
    totalCosechas: 0,
    totalRiegos: 0,
    totalFertilizaciones: 0
  };

  loading: boolean = false;
  error: string | null = null;

  // Modal crear
  mostrarModal: boolean = false;
  formaCrear!: FormGroup;
  cargandoCrear: boolean = false;
  fechaSeleccionada: string = '';

  // Modal editar
  mostrarModalEditar: boolean = false;
  formaEditar!: FormGroup;
  cargandoEditar: boolean = false;
  eventoEditando: Calendario | null = null;

  // Modal confirmar eliminación
  mostrarModalConfirmacion: boolean = false;
  eventoAEliminar: number | null = null;
  cargandoEliminar: boolean = false;

  // Calendario
  mesActual: Date = new Date();
  diasCalendario: (number | null)[] = [];
  nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  tiposEvento = ['Siembra', 'Cosecha', 'Riego', 'Fertilización', 'Otro'];
  estadosEvento = ['Pendiente', 'Programado', 'Planificado', 'En progreso', 'Completado', 'Cancelado'];
  hectareasOpciones = [1, 2, 5, 10, 15, 20, 25, 50, 100];

  private destroy$ = new Subject<void>();
  private cargandoActualmente: boolean = false;

  constructor(
    private calendarioService: CalendarioService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    this.generarCalendario();
    this.cargarEventos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormularios(): void {
    this.formaCrear = this.fb.group({
      fecha: ['', Validators.required],
      tipoEvento: ['Siembra', Validators.required],
      idCultivo: ['', [Validators.required, Validators.min(1)]],
      idCampo: ['', [Validators.required, Validators.min(1)]],
      hectareas: ['', Validators.required],
      estado: ['Pendiente', Validators.required],
      descripcion: ['']
    });

    this.formaEditar = this.fb.group({
      idEvento: [''],
      fecha: ['', Validators.required],
      tipoEvento: ['', Validators.required],
      idCultivo: ['', [Validators.required, Validators.min(1)]],
      idCampo: ['', [Validators.required, Validators.min(1)]],
      hectareas: ['', Validators.required],
      estado: ['', Validators.required],
      descripcion: ['']
    });
  }

  // ─── Calendario ───────────────────────────────────────────────────────────

  generarCalendario(): void {
    const año = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();

    this.diasCalendario = [];
    for (let i = 0; i < primerDia; i++) {
      this.diasCalendario.push(null);
    }
    for (let d = 1; d <= diasEnMes; d++) {
      this.diasCalendario.push(d);
    }
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.generarCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.generarCalendario();
  }

  get mesNombre(): string {
    return `${this.nombresMeses[this.mesActual.getMonth()]} ${this.mesActual.getFullYear()}`;
  }

  get ultimoDiaMes(): number {
    return new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0).getDate();
  }

  obtenerEventosDia(dia: number | null): Calendario[] {
    if (!dia) return [];
    const año = this.mesActual.getFullYear();
    const mes = String(this.mesActual.getMonth() + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    const fechaBuscada = `${año}-${mes}-${diaStr}`;
    // Excluir eventos eliminados (deletedAt != null o estado INACTIVO)
    return this.eventos.filter(e =>
      e.fecha &&
      e.fecha.startsWith(fechaBuscada) &&
      !e.deletedAt &&
      e.estado !== 'INACTIVO'
    );
  }

  claseEvento(tipo: string): Record<string, boolean> {
    return {
      'evento-siembra':       tipo === 'SIEMBRA',
      'evento-cosecha':       tipo === 'COSECHA',
      'evento-riego':         tipo === 'RIEGO',
      'evento-fertilizacion': tipo === 'FERTILIZACION',
      'evento-otro':          !['SIEMBRA','COSECHA','RIEGO','FERTILIZACION'].includes(tipo)
    };
  }

  colorEvento(tipo: string): { background: string; color: string } {
    const colores: Record<string, { background: string; color: string }> = {
      'siembra':       { background: '#d4edda', color: '#1a6b35' },
      'cosecha':       { background: '#fff3cd', color: '#856404' },
      'riego':         { background: '#cce5ff', color: '#004085' },
      'fertilización': { background: '#e2d9f3', color: '#5a3e8a' },
      'fertilizacion': { background: '#e2d9f3', color: '#5a3e8a' },
      'poda':          { background: '#fde8d8', color: '#7d3c00' },
      'monitoreo':     { background: '#d6eaf8', color: '#1a5276' }
    };
    return colores[tipo?.toLowerCase()] ?? { background: '#e2e3e5', color: '#383d41' };
  }

  calcularEstadisticas(): void {
    // Solo contar eventos activos (no eliminados)
    const activos = this.eventos.filter(e => !e.deletedAt && e.estado !== 'INACTIVO');
    this.estadisticas = {
      totalSiembras:        activos.filter(e => e.tipoEvento?.toLowerCase() === 'siembra').length,
      totalCosechas:        activos.filter(e => e.tipoEvento?.toLowerCase() === 'cosecha').length,
      totalRiegos:          activos.filter(e => e.tipoEvento?.toLowerCase() === 'riego').length,
      totalFertilizaciones: activos.filter(e =>
        e.tipoEvento?.toLowerCase() === 'fertilización' ||
        e.tipoEvento?.toLowerCase() === 'fertilizacion'
      ).length
    };
    console.log('[Calendario] Estadísticas calculadas:', this.estadisticas);
  }

  // ─── Carga de datos ───────────────────────────────────────────────────────

  cargarEventos(): void {
    if (this.cargandoActualmente) return;
    this.cargandoActualmente = true;
    this.loading = true;
    this.error = null;

    this.ngZone.run(() => {
      this.calendarioService.obtenerEventos()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (eventos: Calendario[]) => {
            this.eventos = eventos;
            this.loading = false;
            this.cargandoActualmente = false;
            this.calcularEstadisticas();
            this.cdr.markForCheck();
          },
          error: (error: unknown) => {
            console.error('[Calendario] Error al cargar eventos:', error);
            this.error = 'Error al cargar los eventos. Verifica la conexión con el servidor.';
            this.loading = false;
            this.cargandoActualmente = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  reintentar(): void {
    this.cargarEventos();
  }

  // ─── Modal Crear ──────────────────────────────────────────────────────────

  abrirModal(dia?: number): void {
    // Si hay un modal de edición abierto, no abrir el de crear
    if (this.mostrarModalEditar) return;

    if (dia) {
      const año = this.mesActual.getFullYear();
      const mes = String(this.mesActual.getMonth() + 1).padStart(2, '0');
      const diaStr = String(dia).padStart(2, '0');
      this.fechaSeleccionada = `${año}-${mes}-${diaStr}`;
      this.formaCrear.reset({ tipoEvento: 'Siembra', estado: 'Pendiente' });
      this.formaCrear.patchValue({ fecha: this.fechaSeleccionada });
    } else {
      this.formaCrear.reset({ tipoEvento: 'Siembra', estado: 'Pendiente' });
    }
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.formaCrear.reset({ tipoEvento: 'Siembra', estado: 'Pendiente' });
  }

  crearNuevoEvento(): void {
    if (this.formaCrear.invalid) {
      this.formaCrear.markAllAsTouched();
      return;
    }

    this.cargandoCrear = true;
    const nuevoEvento: Calendario = this.formaCrear.value;

    this.ngZone.run(() => {
      this.calendarioService.crearEvento(nuevoEvento)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargandoCrear = false;
            this.cerrarModal();
            this.cargarEventos();
            this.cdr.markForCheck();
          },
          error: (error: unknown) => {
            console.error('Error al crear evento:', error);
            this.error = 'Error al crear el evento. Intenta de nuevo.';
            this.cargandoCrear = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  // ─── Modal Editar ─────────────────────────────────────────────────────────

  editarEvento(evento: Calendario, e: Event): void {
    e.stopPropagation();
    e.preventDefault();
    this.eventoEditando = { ...evento };
    this.mostrarModalEditar = true;

    const fecha = evento.fecha ? evento.fecha.split('T')[0] : '';
    this.formaEditar.reset();
    this.formaEditar.patchValue({
      idEvento:    evento.idEvento,
      fecha,
      tipoEvento:  evento.tipoEvento,
      idCultivo:   evento.idCultivo,
      idCampo:     evento.idCampo,
      hectareas:   evento.hectareas,
      estado:      evento.estado,
      descripcion: evento.descripcion ?? ''
    });
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.eventoEditando = null;
    this.formaEditar.reset();
  }

  guardarCambiosEvento(): void {
    if (this.formaEditar.invalid) {
      this.formaEditar.markAllAsTouched();
      return;
    }

    this.cargandoEditar = true;
    const eventoActualizado: Calendario = this.formaEditar.value;

    this.ngZone.run(() => {
      this.calendarioService.actualizarEvento(eventoActualizado)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cargandoEditar = false;
            this.cerrarModalEditar();
            this.cargarEventos();
            this.cdr.markForCheck();
          },
          error: (error: unknown) => {
            console.error('Error al actualizar evento:', error);
            this.error = 'Error al actualizar el evento. Intenta de nuevo.';
            this.cargandoEditar = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  // ─── Modal Eliminar ───────────────────────────────────────────────────────

  eliminarEvento(id: number, e: Event): void {
    e.stopPropagation();
    this.eventoAEliminar = id;
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.eventoAEliminar = null;
    this.cargandoEliminar = false;
  }

  confirmarEliminar(): void {
    if (this.eventoAEliminar === null) return;

    this.cargandoEliminar = true;
    const idAEliminar = this.eventoAEliminar;

    this.ngZone.run(() => {
      this.calendarioService.eliminarEvento(idAEliminar)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Quitar del array local inmediatamente → desaparece del calendario al instante
            this.eventos = this.eventos.filter(e => e.idEvento !== idAEliminar);
            this.calcularEstadisticas();
            this.cargandoEliminar = false;
            this.cerrarModalConfirmacion();
            this.cerrarModalEditar();   // cerrar también el modal de detalle
            this.cdr.markForCheck();
          },
          error: (error: unknown) => {
            console.error('Error al eliminar evento:', error);
            this.error = 'Error al eliminar el evento.';
            this.cargandoEliminar = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  formatearFecha(dia: number): string {
    const mes = this.nombresMeses[this.mesActual.getMonth()];
    return `${dia} de ${mes}`;
  }

  esHoy(dia: number | null): boolean {
    if (!dia) return false;
    const hoy = new Date();
    return (
      dia === hoy.getDate() &&
      this.mesActual.getMonth() === hoy.getMonth() &&
      this.mesActual.getFullYear() === hoy.getFullYear()
    );
  }
}
