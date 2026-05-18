import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Calendario, EstadisticasCalendario } from '../../shared/interfaces/calendario.interface';
import { environment } from '../../shared/config/environment';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private apiUrl = `${environment.apiUrl}/calendario`;
  private eventos = new BehaviorSubject<Calendario[]>([]);

  constructor(private http: HttpClient) {}

  obtenerEventos(): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(this.apiUrl).pipe(
      timeout(8000),
      map(datos => {
        this.eventos.next(datos);
        return datos;
      }),
      catchError(error => {
        console.error('[CalendarioService] Error al obtener eventos:', error);
        throw error;
      })
    );
  }

  obtenerEventoPorId(id: number): Observable<Calendario | null> {
    return this.http.get<Calendario>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener evento:', error);
        return of(null);
      })
    );
  }

  obtenerPorCampo(idCampo: number): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(`${this.apiUrl}/campo/${idCampo}`).pipe(
      catchError(error => {
        console.error('Error al obtener eventos por campo:', error);
        return of([]);
      })
    );
  }

  obtenerPorCultivo(idCultivo: number): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(`${this.apiUrl}/cultivo/${idCultivo}`).pipe(
      catchError(error => {
        console.error('Error al obtener eventos por cultivo:', error);
        return of([]);
      })
    );
  }

  obtenerPorTipoEvento(tipoEvento: string): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(`${this.apiUrl}/tipo/${tipoEvento}`).pipe(
      catchError(error => {
        console.error('Error al obtener eventos por tipo:', error);
        return of([]);
      })
    );
  }

  obtenerPorEstado(estado: string): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(`${this.apiUrl}/estado/${estado}`).pipe(
      catchError(error => {
        console.error('Error al obtener eventos por estado:', error);
        return of([]);
      })
    );
  }

  obtenerEstadisticas(): EstadisticasCalendario {
    const lista = this.eventos.value;
    return {
      totalSiembras: lista.filter(e => e.tipoEvento === 'SIEMBRA').length,
      totalCosechas: lista.filter(e => e.tipoEvento === 'COSECHA').length,
      totalRiegos: lista.filter(e => e.tipoEvento === 'RIEGO').length,
      totalFertilizaciones: lista.filter(e => e.tipoEvento === 'FERTILIZACION').length
    };
  }

  crearEvento(evento: Calendario): Observable<Calendario> {
    return this.http.post<Calendario>(this.apiUrl, evento).pipe(
      map(nuevoEvento => {
        const actuales = this.eventos.value;
        this.eventos.next([...actuales, nuevoEvento]);
        return nuevoEvento;
      }),
      catchError(error => {
        console.error('Error al crear evento:', error);
        throw error;
      })
    );
  }

  actualizarEvento(evento: Calendario): Observable<Calendario> {
    if (!evento.idEvento) {
      throw new Error('ID de evento es requerido para actualizar');
    }
    return this.http.put<Calendario>(`${this.apiUrl}/${evento.idEvento}`, evento).pipe(
      map(eventoActualizado => {
        const actuales = this.eventos.value;
        const index = actuales.findIndex(e => e.idEvento === eventoActualizado.idEvento);
        if (index !== -1) {
          actuales[index] = eventoActualizado;
          this.eventos.next([...actuales]);
        }
        return eventoActualizado;
      }),
      catchError(error => {
        console.error('Error al actualizar evento:', error);
        throw error;
      })
    );
  }

  eliminarEvento(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/delete/${id}`, {}).pipe(
      map(() => {
        const actuales = this.eventos.value;
        this.eventos.next(actuales.filter(e => e.idEvento !== id));
      }),
      catchError(error => {
        console.error('Error al eliminar evento:', error);
        throw error;
      })
    );
  }

  restaurarEvento(id: number): Observable<Calendario> {
    return this.http.patch<Calendario>(`${this.apiUrl}/restore/${id}`, {}).pipe(
      catchError(error => {
        console.error('Error al restaurar evento:', error);
        throw error;
      })
    );
  }
}
