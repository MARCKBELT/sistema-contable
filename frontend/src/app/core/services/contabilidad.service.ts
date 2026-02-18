import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * INTERFAZ: Cuenta Contable
 */
export interface CuentaContable {
  id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  nivel: number;
  cuenta_padre_id: string | null;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  naturaleza: 'deudora' | 'acreedora';
  es_imputable: boolean;
  descripcion?: string;
  saldo_inicial: number;
  saldo_actual: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * INTERFAZ: Detalle de Comprobante
 */
export interface DetalleComprobante {
  cuenta_id: string;
  glosa: string;
  debe: number;
  haber: number;
}

/**
 * INTERFAZ: Comprobante
 */
export interface Comprobante {
  id?: string;
  tipo: 'ingreso' | 'egreso' | 'traspaso';
  fecha: string;
  glosa: string;
  detalles: DetalleComprobante[];
  total_debe?: number;
  total_haber?: number;
  estado?: string;
}

/**
 * SERVICIO: ContabilidadService
 * 
 * Propósito: Gestionar Plan de Cuentas y Comprobantes Contables
 */
@Injectable({
  providedIn: 'root'
})
export class ContabilidadService {
  private apiUrl = `${environment.apiUrl}/contabilidad`;
  
  cuentas = signal<CuentaContable[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las cuentas contables
   */
  obtenerCuentas(params?: { tipo?: string; es_imputable?: boolean }): Observable<{ success: boolean; data: CuentaContable[] }> {
    let url = `${this.apiUrl}/cuentas`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.tipo) queryParams.append('tipo', params.tipo);
      if (params.es_imputable !== undefined) queryParams.append('es_imputable', params.es_imputable.toString());
      if (queryParams.toString()) url += '?' + queryParams.toString();
    }
    
    return this.http.get<{ success: boolean; data: CuentaContable[] }>(url);
  }

  /**
   * Crear un comprobante contable
   */
  crearComprobante(comprobante: Comprobante): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/comprobantes`,
      comprobante
    );
  }

  /**
   * Listar comprobantes
   */
  obtenerComprobantes(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/comprobantes`
    );
  }
}
