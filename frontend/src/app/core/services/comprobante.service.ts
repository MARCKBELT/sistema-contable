import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DetalleComprobante {
  id?: string;
  cuenta_id: string;
  cuenta_codigo?: string;
  cuenta_nombre?: string;
  glosa: string;
  debe: number;
  haber: number;
}

export interface Comprobante {
  id?: string;
  empresa_id?: string;
  numero: string;
  tipo: 'ingreso' | 'egreso' | 'traspaso';
  fecha: string;
  glosa_general: string;
  total_debe: number;
  total_haber: number;
  estado: 'borrador' | 'validado' | 'anulado';
  detalles: DetalleComprobante[];
  created_at?: string;
  updated_at?: string;
}

export interface ComprobanteResponse {
  success: boolean;
  data: Comprobante | Comprobante[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComprobanteService {
  comprobantes = signal<Comprobante[]>([]);
  cargando = signal(false);

  constructor(private http: HttpClient) {}

  obtenerComprobantes(): Observable<ComprobanteResponse> {
    this.cargando.set(true);
    return this.http.get<ComprobanteResponse>(`${environment.apiUrl}/api/contabilidad/comprobantes`).pipe(
      tap(response => {
        if (response.success) {
          this.comprobantes.set(response.data as Comprobante[]);
        }
        this.cargando.set(false);
      })
    );
  }

  obtenerComprobante(id: string): Observable<ComprobanteResponse> {
    return this.http.get<ComprobanteResponse>(`${environment.apiUrl}/api/contabilidad/comprobantes/${id}`);
  }

  crearComprobante(comprobante: Partial<Comprobante>): Observable<ComprobanteResponse> {
    return this.http.post<ComprobanteResponse>(`${environment.apiUrl}/api/contabilidad/comprobantes`, comprobante);
  }

  actualizarComprobante(id: string, comprobante: Partial<Comprobante>): Observable<ComprobanteResponse> {
    return this.http.put<ComprobanteResponse>(`${environment.apiUrl}/api/contabilidad/comprobantes/${id}`, comprobante);
  }

  validarComprobante(id: string): Observable<ComprobanteResponse> {
    return this.http.post<ComprobanteResponse>(`${environment.apiUrl}/api/contabilidad/comprobantes/${id}/validar`, {});
  }

  anularComprobante(id: string, motivo: string): Observable<ComprobanteResponse> {
    return this.http.post<ComprobanteResponse>(`${environment.apiUrl}/api/contabilidad/comprobantes/${id}/anular`, { motivo });
  }

  obtenerSiguienteNumero(tipo: string): Observable<{success: boolean, data: {numero: string}}> {
    return this.http.get<{success: boolean, data: {numero: string}}>(`${environment.apiUrl}/api/contabilidad/comprobantes/siguiente-numero/${tipo}`);
  }

  validarBalance(detalles: DetalleComprobante[]): { valido: boolean, debe: number, haber: number, diferencia: number } {
    const totalDebe = detalles.reduce((sum, d) => sum + (d.debe || 0), 0);
    const totalHaber = detalles.reduce((sum, d) => sum + (d.haber || 0), 0);
    const diferencia = Math.abs(totalDebe - totalHaber);
    
    return {
      valido: diferencia < 0.01, // Tolerancia de 1 centavo
      debe: totalDebe,
      haber: totalHaber,
      diferencia
    };
  }
}
