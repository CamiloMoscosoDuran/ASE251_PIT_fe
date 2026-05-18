import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Siembra, EstadisticasSiembra } from '../../shared/interfaces/siembra.interface';
import { environment } from '../../shared/config/environment';

@Injectable({
  providedIn: 'root'
})
export class SiembraService {
  private apiUrl = `${environment.apiUrl}/planificacion-siembra`;
  private siembras = new BehaviorSubject<Siembra[]>([]);

  constructor(private http: HttpClient) {}

  obtenerSiembras(): Observable<Siembra[]> {
    console.log(`[SiembraService] Iniciando petición a ${this.apiUrl}`);
    return this.http.get<Siembra[]>(this.apiUrl).pipe(
      timeout(8000), // 8 segundos de timeout para detectar errores rápido
      map(datos => {
        console.log('[SiembraService] Datos recibidos:', datos);
        this.siembras.next(datos);
        return datos;
      }),
      catchError(error => {
        console.error('[SiembraService] Error al obtener siembras:', error);
        console.error('Status:', error.status);
        console.error('Mensaje:', error.message);
        throw error;
      })
    );
  }

  obtenerSiembrasPorCampo(idCampo: number): Observable<Siembra[]> {
    return this.http.get<Siembra[]>(`${this.apiUrl}/campo/${idCampo}`).pipe(
      catchError(error => {
        console.error('Error al obtener siembras por campo:', error);
        return of([]);
      })
    );
  }

  obtenerSiembrasPorCultivo(idCultivo: number): Observable<Siembra[]> {
    return this.http.get<Siembra[]>(`${this.apiUrl}/cultivo/${idCultivo}`).pipe(
      catchError(error => {
        console.error('Error al obtener siembras por cultivo:', error);
        return of([]);
      })
    );
  }

  obtenerSiembraPorId(id: number): Observable<Siembra | null> {
    return this.http.get<Siembra>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener siembra:', error);
        return of(null);
      })
    );
  }

  obtenerEstadisticas(): EstadisticasSiembra {
    const siembras = this.siembras.value;
    const totalHectareas = siembras.reduce((sum, s) => sum + s.hectareas, 0);
    const totalCultivos = siembras.length;
    const simbrasActivas = siembras.filter(s => s.estado === true || s.estado === 'true').length;

    return {
      totalHectareas,
      totalCultivos,
      simbrasActivas
    };
  }

  crearSiembra(siembra: Siembra): Observable<Siembra> {
    return this.http.post<Siembra>(this.apiUrl, siembra).pipe(
      map(nuevaSiembra => {
        const siembrasActuales = this.siembras.value;
        this.siembras.next([...siembrasActuales, nuevaSiembra]);
        return nuevaSiembra;
      }),
      catchError(error => {
        console.error('Error al crear siembra:', error);
        throw error;
      })
    );
  }

  actualizarSiembra(siembra: Siembra): Observable<Siembra> {
    if (!siembra.idSiembra) {
      throw new Error('ID de siembra es requerido para actualizar');
    }

    return this.http.put<Siembra>(`${this.apiUrl}/update/${siembra.idSiembra}`, siembra).pipe(
      map(siembraActualizada => {
        const siembrasActuales = this.siembras.value;
        const index = siembrasActuales.findIndex(s => s.idSiembra === siembraActualizada.idSiembra);
        if (index !== -1) {
          siembrasActuales[index] = siembraActualizada;
          this.siembras.next([...siembrasActuales]);
        }
        return siembraActualizada;
      }),
      catchError(error => {
        console.error('Error al actualizar siembra:', error);
        throw error;
      })
    );
  }

  eliminarSiembra(id: number): Observable<Siembra> {
    return this.http.patch<Siembra>(`${this.apiUrl}/delete/${id}`, {}).pipe(
      map(siembraEliminada => {
        const siembrasActuales = this.siembras.value;
        this.siembras.next(siembrasActuales.filter(s => s.idSiembra !== id));
        return siembraEliminada;
      }),
      catchError(error => {
        console.error('Error al eliminar siembra:', error);
        throw error;
      })
    );
  }

  restaurarSiembra(id: number): Observable<Siembra> {
    return this.http.patch<Siembra>(`${this.apiUrl}/restore/${id}`, {}).pipe(
      catchError(error => {
        console.error('Error al restaurar siembra:', error);
        throw error;
      })
    );
  }
}
