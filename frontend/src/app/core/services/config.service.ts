import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Parametro {
  id: string;
  nombre: string;
  valor: string;
  categoria: string;
  tipo_dato: string;
  descripcion: string;
  editable: boolean;
}

export interface ConfigResponse {
  success: boolean;
  data: Parametro[];
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  parametros = signal<Parametro[]>([]);
  cargando = signal(false);

  constructor(private http: HttpClient) {}

  obtenerParametros(): Observable<ConfigResponse> {
    this.cargando.set(true);
    return this.http.get<ConfigResponse>(`${environment.apiUrl}/api/config/parametros`).pipe(
      tap(response => {
        if (response.success) {
          this.parametros.set(response.data);
        }
        this.cargando.set(false);
      })
    );
  }

  actualizarParametro(id: string, valor: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/config/parametros/${id}`, { valor });
  }

  obtenerPorCategoria(categoria: string): Parametro[] {
    return this.parametros().filter(p => p.categoria === categoria);
  }

  obtenerPorNombre(nombre: string): Parametro | undefined {
    return this.parametros().find(p => p.nombre === nombre);
  }
}
