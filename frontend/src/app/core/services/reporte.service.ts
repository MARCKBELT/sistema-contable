import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LibroDiario {
  fecha: string;
  numero_comprobante: string;
  tipo_comprobante: string;
  glosa: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  debe: number;
  haber: number;
}

export interface LibroMayor {
  cuenta_codigo: string;
  cuenta_nombre: string;
  movimientos: {
    fecha: string;
    numero_comprobante: string;
    glosa: string;
    debe: number;
    haber: number;
    saldo: number;
  }[];
  saldo_inicial: number;
  total_debe: number;
  total_haber: number;
  saldo_final: number;
}

export interface BalanceGeneral {
  activos: {
    corriente: CuentaBalance[];
    no_corriente: CuentaBalance[];
    total: number;
  };
  pasivos: {
    corriente: CuentaBalance[];
    no_corriente: CuentaBalance[];
    total: number;
  };
  patrimonio: {
    cuentas: CuentaBalance[];
    total: number;
  };
}

export interface EstadoResultados {
  ingresos: {
    operacionales: CuentaBalance[];
    no_operacionales: CuentaBalance[];
    total: number;
  };
  gastos: {
    operacionales: CuentaBalance[];
    no_operacionales: CuentaBalance[];
    total: number;
  };
  utilidad_bruta: number;
  utilidad_operativa: number;
  utilidad_neta: number;
}

export interface CuentaBalance {
  codigo: string;
  nombre: string;
  saldo: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  cargando = signal(false);

  constructor(private http: HttpClient) {}

  obtenerLibroDiario(fechaInicio: string, fechaFin: string): Observable<{success: boolean, data: LibroDiario[]}> {
    return this.http.get<{success: boolean, data: LibroDiario[]}>(`${environment.apiUrl}/api/reportes/libro-diario`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
  }

  obtenerLibroMayor(fechaInicio: string, fechaFin: string, cuentaId?: string): Observable<{success: boolean, data: LibroMayor[]}> {
    const params: any = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
    if (cuentaId) params.cuenta_id = cuentaId;
    
    return this.http.get<{success: boolean, data: LibroMayor[]}>(`${environment.apiUrl}/api/reportes/libro-mayor`, { params });
  }

  obtenerBalanceGeneral(fecha: string): Observable<{success: boolean, data: BalanceGeneral}> {
    return this.http.get<{success: boolean, data: BalanceGeneral}>(`${environment.apiUrl}/api/reportes/balance-general`, {
      params: { fecha }
    });
  }

  obtenerEstadoResultados(fechaInicio: string, fechaFin: string): Observable<{success: boolean, data: EstadoResultados}> {
    return this.http.get<{success: boolean, data: EstadoResultados}>(`${environment.apiUrl}/api/reportes/estado-resultados`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
  }

  exportarPDF(tipo: string, params: any): Observable<Blob> {
    return this.http.post(`${environment.apiUrl}/api/reportes/exportar-pdf`, 
      { tipo, ...params },
      { responseType: 'blob' }
    );
  }

  exportarExcel(tipo: string, params: any): Observable<Blob> {
    return this.http.post(`${environment.apiUrl}/api/reportes/exportar-excel`, 
      { tipo, ...params },
      { responseType: 'blob' }
    );
  }
}
