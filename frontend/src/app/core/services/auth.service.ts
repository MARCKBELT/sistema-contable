import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface Empresa {
  id: string;
  razon_social: string;
  nombre_comercial: string;
  nit: string;
  actividad_economica: string;
  rol_en_empresa?: string;
  acceso_total?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    usuario: Usuario;
    empresas: Empresa[];
    empresaActiva: Empresa;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';
  private readonly EMPRESAS_KEY = 'empresas';
  private readonly EMPRESA_ACTIVA_KEY = 'empresaActiva';

  // Signals para reactividad
  usuario = signal<Usuario | null>(this.getStoredUser());
  empresas = signal<Empresa[]>(this.getStoredEmpresas());
  empresaActiva = signal<Empresa | null>(this.getStoredEmpresaActiva());
  isAuthenticated = signal<boolean>(!!this.getToken());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success) {
          this.setSession(response.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EMPRESAS_KEY);
    localStorage.removeItem(this.EMPRESA_ACTIVA_KEY);
    
    this.usuario.set(null);
    this.empresas.set([]);
    this.empresaActiva.set(null);
    this.isAuthenticated.set(false);
    
    this.router.navigate(['/login']);
  }

  cambiarEmpresa(empresa: Empresa): void {
    localStorage.setItem(this.EMPRESA_ACTIVA_KEY, JSON.stringify(empresa));
    this.empresaActiva.set(empresa);
    window.location.reload(); // Recargar para aplicar cambios
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(data: LoginResponse['data']): void {
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.usuario));
    localStorage.setItem(this.EMPRESAS_KEY, JSON.stringify(data.empresas));
    localStorage.setItem(this.EMPRESA_ACTIVA_KEY, JSON.stringify(data.empresaActiva));

    this.usuario.set(data.usuario);
    this.empresas.set(data.empresas);
    this.empresaActiva.set(data.empresaActiva);
    this.isAuthenticated.set(true);
  }

  private getStoredUser(): Usuario | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  private getStoredEmpresas(): Empresa[] {
    const empresas = localStorage.getItem(this.EMPRESAS_KEY);
    return empresas ? JSON.parse(empresas) : [];
  }

  private getStoredEmpresaActiva(): Empresa | null {
    const empresa = localStorage.getItem(this.EMPRESA_ACTIVA_KEY);
    return empresa ? JSON.parse(empresa) : null;
  }

  esAdministrador(): boolean {
    return this.usuario()?.rol === 'ADMINISTRADOR';
  }

  esContador(): boolean {
    return this.usuario()?.rol === 'CONTADOR';
  }
}
