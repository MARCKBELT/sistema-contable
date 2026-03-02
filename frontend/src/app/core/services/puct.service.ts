import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CuentaContable {
  id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  nivel: number;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  naturaleza: 'deudora' | 'acreedora';
  es_imputable: boolean;
  aplica_comercial: boolean;
  aplica_servicios: boolean;
  aplica_transporte: boolean;
  aplica_industrial: boolean;
  aplica_petrolera: boolean;
  aplica_construccion: boolean;
  aplica_agropecuaria: boolean;
  aplica_minera: boolean;
}

export interface PUCTResponse {
  success: boolean;
  data: CuentaContable[];
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PuctService {
  cuentas = signal<CuentaContable[]>([]);
  cargando = signal(false);
  filtroNivel = signal<number | null>(null);
  filtroTipo = signal<string | null>(null);
  busqueda = signal<string>('');

  constructor(private http: HttpClient) {}

  obtenerCuentas(): Observable<PUCTResponse> {
    this.cargando.set(true);
    return this.http.get<PUCTResponse>(`${environment.apiUrl}/api/contabilidad/cuentas`).pipe(
      tap(response => {
        if (response.success) {
          this.cuentas.set(response.data);
        }
        this.cargando.set(false);
      })
    );
  }

  crearCuenta(cuenta: Partial<CuentaContable>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/contabilidad/cuentas`, cuenta);
  }

  actualizarCuenta(id: string, cuenta: Partial<CuentaContable>): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/contabilidad/cuentas/${id}`, cuenta);
  }

  eliminarCuenta(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/contabilidad/cuentas/${id}`);
  }

  importarPUCT(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', archivo);
    return this.http.post(`${environment.apiUrl}/api/contabilidad/cuentas/importar`, formData);
  }

  getCuentasFiltradas(): CuentaContable[] {
    let resultado = this.cuentas();

    if (this.filtroNivel()) {
      resultado = resultado.filter(c => c.nivel === this.filtroNivel());
    }

    if (this.filtroTipo()) {
      resultado = resultado.filter(c => c.tipo === this.filtroTipo());
    }

    if (this.busqueda()) {
      const search = this.busqueda().toLowerCase();
      resultado = resultado.filter(c => 
        c.codigo.toLowerCase().includes(search) ||
        c.nombre.toLowerCase().includes(search)
      );
    }

    return resultado;
  }

  getCuentasPorNivel(nivel: number): CuentaContable[] {
    return this.cuentas().filter(c => c.nivel === nivel);
  }

  getCuentasPorTipo(tipo: string): CuentaContable[] {
    return this.cuentas().filter(c => c.tipo === tipo);
  }

  getCuentasNivel4(): CuentaContable[] {
    return this.cuentas().filter(c => c.nivel === 4).sort((a, b) => 
      a.codigo.localeCompare(b.codigo)
    );
  }

  obtenerSiguienteCodigoNivel5(codigoPadre: string): string {
    const cuentasHijas = this.cuentas().filter(c => 
      c.nivel === 5 && c.codigo.startsWith(codigoPadre + '-')
    );

    if (cuentasHijas.length === 0) {
      return `${codigoPadre}-001`;
    }

    const numeros = cuentasHijas.map(c => {
      const partes = c.codigo.split('-');
      return parseInt(partes[partes.length - 1]);
    });

    const maximo = Math.max(...numeros);
    const siguiente = (maximo + 1).toString().padStart(3, '0');
    
    return `${codigoPadre}-${siguiente}`;
  }

  esEditable(nivel: number, rol: string): boolean {
    if (nivel <= 3) return false;
    if (nivel === 4) return rol === 'ADMINISTRADOR';
    return nivel === 5;
  }
}
