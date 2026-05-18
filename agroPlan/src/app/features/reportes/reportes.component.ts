import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { ReporteHistoricoService } from '../../core/services/reporte-historico.service';
import { ReporteHistorico } from '../../shared/interfaces/reporte-historico.interface';

Chart.register(...registerables);

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CULTIVO_COLORES: Record<number, string> = {
  1: '#2ecc71',
  2: '#1abc9c',
  3: '#f39c12',
  4: '#e67e22',
  5: '#3498db',
  6: '#9b59b6'
};

const CULTIVO_NOMBRES: Record<number, string> = {
  1: 'Uva',
  2: 'Palta',
  3: 'Paltos',
  4: 'Otros',
  5: 'Maíz',
  6: 'Trigo'
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart') donutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;

  reportes: ReporteHistorico[] = [];
  loading = false;
  error: string | null = null;

  // KPIs
  produccionTotal = 0;
  ingresosAcumulados = 0;
  gastosAcumulados = 0;
  margenNeto = 0;

  // Filtros
  anioSeleccionado = new Date().getFullYear();
  aniosDisponibles: number[] = [];

  // Rango de meses mostrado
  rangoMeses = '';

  // Modales
  mostrarModalCrear = false;
  mostrarModalEditar = false;
  mostrarModalEliminar = false;
  mostrarTabla = false;
  reporteAEliminar: number | null = null;
  reporteEditando: ReporteHistorico | null = null;
  cargandoAccion = false;

  formaCrear!: FormGroup;
  formaEditar!: FormGroup;

  private barChart: Chart | null = null;
  private donutChart: Chart | null = null;
  private lineChart: Chart | null = null;
  private chartsInitialized = false;
  private destroy$ = new Subject<void>();

  readonly mesesNombres = MESES;

  constructor(
    private reporteService: ReporteHistoricoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.inicializarFormularios();
    const anioActual = new Date().getFullYear();
    for (let a = anioActual; a >= anioActual - 4; a--) {
      this.aniosDisponibles.push(a);
    }
  }

  ngOnInit(): void {
    this.cargarReportes();
  }

  ngAfterViewInit(): void {
    this.chartsInitialized = true;
    if (this.reportes.length > 0) {
      this.renderizarGraficos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destruirGraficos();
  }

  inicializarFormularios(): void {
    this.formaCrear = this.fb.group({
      idCampo: ['', [Validators.required, Validators.min(1)]],
      idCultivo: ['', [Validators.required, Validators.min(1)]],
      mes: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      anio: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
      produccionTon: ['', [Validators.required, Validators.min(0)]],
      ingresos: ['', [Validators.required, Validators.min(0)]],
      gastos: ['', [Validators.required, Validators.min(0)]]
    });

    this.formaEditar = this.fb.group({
      idCampo: ['', [Validators.required, Validators.min(1)]],
      idCultivo: ['', [Validators.required, Validators.min(1)]],
      mes: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      anio: ['', [Validators.required, Validators.min(2000)]],
      produccionTon: ['', [Validators.required, Validators.min(0)]],
      ingresos: ['', [Validators.required, Validators.min(0)]],
      gastos: ['', [Validators.required, Validators.min(0)]]
    });
  }

  cargarReportes(): void {
    this.loading = true;
    this.error = null;

    this.ngZone.run(() => {
      this.reporteService.obtenerPorAnio(this.anioSeleccionado)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (datos) => {
            this.reportes = datos.filter(r => !r.deletedAt);
            this.calcularKPIs();
            this.loading = false;
            this.cdr.markForCheck();
            if (this.chartsInitialized) {
              setTimeout(() => this.renderizarGraficos(), 100);
            }
          },
          error: (err) => {
            console.error('Error al cargar reportes:', err);
            this.error = 'No se pudo conectar con el servidor. Verifica que el backend esté activo.';
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
    });
  }

  cambiarAnio(): void {
    this.cargarReportes();
  }

  calcularKPIs(): void {
    this.produccionTotal = this.reportes.reduce((s, r) => s + Number(r.produccionTon), 0);
    this.ingresosAcumulados = this.reportes.reduce((s, r) => s + Number(r.ingresos), 0);
    this.gastosAcumulados = this.reportes.reduce((s, r) => s + Number(r.gastos), 0);
    const utilidad = this.ingresosAcumulados - this.gastosAcumulados;
    this.margenNeto = this.ingresosAcumulados > 0
      ? Math.round((utilidad / this.ingresosAcumulados) * 100)
      : 0;

    const mesesConDatos = [...new Set(this.reportes.map(r => r.mes))].sort((a, b) => a - b);
    if (mesesConDatos.length > 0) {
      const primerMes = MESES[mesesConDatos[0] - 1];
      const ultimoMes = MESES[mesesConDatos[mesesConDatos.length - 1] - 1];
      this.rangoMeses = mesesConDatos.length === 1
        ? `${primerMes} ${this.anioSeleccionado}`
        : `${primerMes}–${ultimoMes} ${this.anioSeleccionado}`;
    } else {
      this.rangoMeses = `${this.anioSeleccionado}`;
    }
  }

  renderizarGraficos(): void {
    this.destruirGraficos();
    this.renderizarBarras();
    this.renderizarDonut();
    this.renderizarLineas();
  }

  private renderizarBarras(): void {
    if (!this.barChartRef?.nativeElement) return;

    const cultivosUnicos = [...new Set(this.reportes.map(r => r.idCultivo))];
    const mesesUnicos = [...new Set(this.reportes.map(r => r.mes))].sort((a, b) => a - b);
    const labels = mesesUnicos.map(m => MESES[m - 1]);

    const datasets = cultivosUnicos.map(idCultivo => {
      const color = CULTIVO_COLORES[idCultivo] ?? '#95a5a6';
      const data = mesesUnicos.map(mes => {
        const reporte = this.reportes.find(r => r.idCultivo === idCultivo && r.mes === mes);
        return reporte ? Number(reporte.produccionTon) : 0;
      });
      return {
        label: CULTIVO_NOMBRES[idCultivo] ?? `Cultivo ${idCultivo}`,
        data,
        backgroundColor: color,
        borderRadius: 4,
        borderSkipped: false
      };
    });

    this.barChart = new Chart(this.barChartRef.nativeElement, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} ton`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#666', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f0f0f0' },
            ticks: { color: '#666', font: { size: 11 } }
          }
        }
      }
    });
  }

  private renderizarDonut(): void {
    if (!this.donutChartRef?.nativeElement) return;

    const cultivosUnicos = [...new Set(this.reportes.map(r => r.idCultivo))];
    const labels = cultivosUnicos.map(id => CULTIVO_NOMBRES[id] ?? `Cultivo ${id}`);
    const data = cultivosUnicos.map(id =>
      this.reportes.filter(r => r.idCultivo === id).reduce((s, r) => s + Number(r.produccionTon), 0)
    );
    const colors = cultivosUnicos.map(id => CULTIVO_COLORES[id] ?? '#95a5a6');

    this.donutChart = new Chart(this.donutChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#555',
              font: { size: 11 },
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 8
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} ton`
            }
          }
        }
      }
    });
  }

  private renderizarLineas(): void {
    if (!this.lineChartRef?.nativeElement) return;

    const mesesUnicos = [...new Set(this.reportes.map(r => r.mes))].sort((a, b) => a - b);
    const labels = mesesUnicos.map(m => MESES[m - 1]);

    const ingresosPorMes = mesesUnicos.map(mes =>
      this.reportes.filter(r => r.mes === mes).reduce((s, r) => s + Number(r.ingresos), 0)
    );
    const gastosPorMes = mesesUnicos.map(mes =>
      this.reportes.filter(r => r.mes === mes).reduce((s, r) => s + Number(r.gastos), 0)
    );

    this.lineChart = new Chart(this.lineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresosPorMes,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46,204,113,0.08)',
            borderWidth: 2.5,
            pointBackgroundColor: '#2ecc71',
            pointRadius: 4,
            tension: 0.4,
            fill: false
          },
          {
            label: 'Gastos',
            data: gastosPorMes,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231,76,60,0.08)',
            borderWidth: 2,
            borderDash: [5, 4],
            pointBackgroundColor: '#e74c3c',
            pointRadius: 4,
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: {
              color: '#555',
              font: { size: 12 },
              usePointStyle: true,
              pointStyleWidth: 10
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const yValue = ctx.parsed.y ?? 0;
                return ` ${ctx.dataset.label}: S/. ${yValue.toLocaleString('es-PE')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#666', font: { size: 11 } }
          },
          y: {
            beginAtZero: false,
            grid: { color: '#f0f0f0' },
            ticks: {
              color: '#666',
              font: { size: 11 },
              callback: (val) => `S/. ${Number(val).toLocaleString('es-PE')}`
            }
          }
        }
      }
    });
  }

  private destruirGraficos(): void {
    this.barChart?.destroy();
    this.donutChart?.destroy();
    this.lineChart?.destroy();
    this.barChart = null;
    this.donutChart = null;
    this.lineChart = null;
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  abrirModalCrear(): void {
    this.formaCrear.reset({ anio: this.anioSeleccionado });
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
  }

  guardarReporte(): void {
    if (this.formaCrear.invalid) return;
    this.cargandoAccion = true;
    this.reporteService.crear(this.formaCrear.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cargandoAccion = false;
          this.cerrarModalCrear();
          this.cargarReportes();
        },
        error: (err) => {
          console.error(err);
          this.cargandoAccion = false;
          alert('Error al guardar el reporte.');
        }
      });
  }

  editarReporte(reporte: ReporteHistorico): void {
    this.reporteEditando = reporte;
    this.formaEditar.patchValue(reporte);
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.reporteEditando = null;
  }

  actualizarReporte(): void {
    if (this.formaEditar.invalid || !this.reporteEditando?.idReporte) return;
    this.cargandoAccion = true;
    this.reporteService.actualizar(this.reporteEditando.idReporte, {
      ...this.reporteEditando,
      ...this.formaEditar.value
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cargandoAccion = false;
          this.cerrarModalEditar();
          this.cargarReportes();
        },
        error: (err) => {
          console.error(err);
          this.cargandoAccion = false;
          alert('Error al actualizar el reporte.');
        }
      });
  }

  confirmarEliminar(id: number): void {
    this.reporteAEliminar = id;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.reporteAEliminar = null;
  }

  eliminarReporte(): void {
    if (!this.reporteAEliminar) return;
    this.cargandoAccion = true;
    this.reporteService.eliminar(this.reporteAEliminar)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cargandoAccion = false;
          this.cerrarModalEliminar();
          this.cargarReportes();
        },
        error: (err) => {
          console.error(err);
          this.cargandoAccion = false;
          alert('Error al eliminar el reporte.');
        }
      });
  }

  toggleTabla(): void {
    this.mostrarTabla = !this.mostrarTabla;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getNombreMes(mes: number): string {
    return MESES[mes - 1] ?? `Mes ${mes}`;
  }

  getNombreCultivo(id: number): string {
    return CULTIVO_NOMBRES[id] ?? `Cultivo ${id}`;
  }

  formatearMoneda(valor: number): string {
    return `S/. ${Number(valor).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  calcularMargenReporte(r: ReporteHistorico): number {
    const ing = Number(r.ingresos);
    const gas = Number(r.gastos);
    return ing > 0 ? Math.round(((ing - gas) / ing) * 100) : 0;
  }

  get cultivosLeyenda(): { id: number; nombre: string; color: string }[] {
    const ids = [...new Set(this.reportes.map(r => r.idCultivo))];
    return ids.map(id => ({
      id,
      nombre: CULTIVO_NOMBRES[id] ?? `Cultivo ${id}`,
      color: CULTIVO_COLORES[id] ?? '#95a5a6'
    }));
  }
}
