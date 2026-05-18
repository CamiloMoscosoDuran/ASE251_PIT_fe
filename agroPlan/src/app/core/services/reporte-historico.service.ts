import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ReporteHistorico } from '../../shared/interfaces/reporte-historico.interface';
import { environment } from '../../shared/config/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteHistoricoService {
  private apiUrl = `${environment.apiUrl}/reportes-historicos`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<ReporteHistorico[]> {
    return this.http.get<ReporteHistorico[]>(this.apiUrl).pipe(
      timeout(8000),
      catchError(error => {
        console.error('[ReporteHistoricoService] Error al obtener reportes:', error);
        throw error;
      })
    );
  }

  obtenerPorAnio(anio: number): Observable<ReporteHistorico[]> {
    return this.http.get<ReporteHistorico[]>(`${this.apiUrl}/anio/${anio}`).pipe(
      timeout(8000),
      catchError(error => {
        console.error('[ReporteHistoricoService] Error al obtener por año:', error);
        return of([]);
      })
    );
  }

  obtenerPorCampo(idCampo: number): Observable<ReporteHistorico[]> {
    return this.http.get<ReporteHistorico[]>(`${this.apiUrl}/campo/${idCampo}`).pipe(
      timeout(8000),
      catchError(error => {
        console.error('[ReporteHistoricoService] Error al obtener por campo:', error);
        return of([]);
      })
    );
  }

  obtenerPorPeriodo(anio: number, mes: number): Observable<ReporteHistorico[]> {
    return this.http.get<ReporteHistorico[]>(`${this.apiUrl}/periodo/${anio}/${mes}`).pipe(
      timeout(8000),
      catchError(error => {
        console.error('[ReporteHistoricoService] Error al obtener por periodo:', error);
        return of([]);
      })
    );
  }

  crear(reporte: ReporteHistorico): Observable<ReporteHistorico> {
    return this.http.post<ReporteHistorico>(this.apiUrl, reporte).pipe(
      catchError(error => {
        console.error('[ReporteHistoricoService] Error al crear reporte:', error);
        throw error;
      })
    );
  }

  actualizar(id: number, reporte: ReporteHistorico): Observable<ReporteHistorico> {
    return this.http.put<ReporteHistorico>(`${this.apiUrl}/update/${id}`, reporte).pipe(
      catchError(error => {
        console.error('[ReporteHistoricoService] Error al actualizar reporte:', error);
        throw error;
      })
    );
  }

  eliminar(id: number): Observable<ReporteHistorico> {
    return this.http.patch<ReporteHistorico>(`${this.apiUrl}/delete/${id}`, {}).pipe(
      catchError(error => {
        console.error('[ReporteHistoricoService] Error al eliminar reporte:', error);
        throw error;
      })
    );
  }

  restaurar(id: number): Observable<ReporteHistorico> {
    return this.http.patch<ReporteHistorico>(`${this.apiUrl}/restore/${id}`, {}).pipe(
      catchError(error => {
        console.error('[ReporteHistoricoService] Error al restaurar reporte:', error);
        throw error;
      })
    );
  }
}
