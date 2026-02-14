import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Parametro {
  id: string;
  codigo: string;
  nombre: string;
  valor: string;
  tipo: string;
  categoria: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private apiUrl = `${environment.apiUrl}/config`;
  parametros = signal<Parametro[]>([]);

  constructor(private http: HttpClient) {}

  obtenerParametros(categoria?: string): Observable<{ success: boolean; data: Parametro[] }> {
    const url = categoria ? `${this.apiUrl}/parametros?categoria=${categoria}` : `${this.apiUrl}/parametros`;
    return this.http.get<{ success: boolean; data: Parametro[] }>(url);
  }

  obtenerParametroPorCodigo(codigo: string): Observable<{ success: boolean; data: Parametro }> {
    return this.http.get<{ success: boolean; data: Parametro }>(`${this.apiUrl}/parametros/${codigo}`);
  }

  actualizarParametro(id: string, valor: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/parametros/${id}`, { valor });
  }
}
