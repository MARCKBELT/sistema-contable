import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ConfigService, Parametro } from '../../core/services/config.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user = signal<User | null>(null);

  /**
   * TARJETAS: Incluye los 4 módulos principales + Configuración
   */
  cards = signal([
    {
      title: 'Contabilidad',
      description: 'Plan de Cuentas',
      icon: 'description',
      color: '#2563EB',
      route: '/contabilidad'
    },
    {
      title: 'Nóminas',
      description: 'Planillas',
      icon: 'groups',
      color: '#7C3AED',
      route: '/nominas'
    },
    {
      title: 'Facturación',
      description: 'SIAT Integrado',
      icon: 'receipt_long',
      color: '#10B981',
      route: '/facturacion'
    },
    {
      title: 'Reportes',
      description: 'Análisis',
      icon: 'assessment',
      color: '#F59E0B',
      route: '/reportes'
    },
    {
      title: 'Configuración',
      description: 'Parámetros',
      icon: 'settings',
      color: '#6366F1',
      route: '/configuracion'
    }
  ]);

  stats = signal([
    {
      label: 'Tipos de Cambio',
      value: 'Cargando...',
      icon: 'currency_exchange',
      color: '#2563EB'
    },
    {
      label: 'Salario Mínimo',
      value: 'Cargando...',
      icon: 'payments',
      color: '#7C3AED'
    },
    {
      label: 'SIAT Integrado',
      value: 'Activo',
      icon: 'check_circle',
      color: '#10B981'
    }
  ]);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user.set(this.authService.currentUser());
    this.cargarParametros();
  }

  cargarParametros() {
    this.configService.obtenerParametros().subscribe({
      next: (response) => {
        if (response.success) {
          const parametros = response.data;
          
          const salarioMinimo = this.buscarParametro(parametros, 'SALARIO_MINIMO_NACIONAL');
          const tipoCambioOficial = this.buscarParametro(parametros, 'TIPO_CAMBIO_OFICIAL');
          const siatAmbiente = this.buscarParametro(parametros, 'SIAT_AMBIENTE');
          
          this.stats.set([
            {
              label: 'Tipos de Cambio',
              value: tipoCambioOficial 
                ? `Bs ${tipoCambioOficial.valor} / $us 1` 
                : 'No disponible',
              icon: 'currency_exchange',
              color: '#2563EB'
            },
            {
              label: 'Salario Mínimo',
              value: salarioMinimo 
                ? `Bs ${parseFloat(salarioMinimo.valor).toLocaleString('es-BO')}` 
                : 'No disponible',
              icon: 'payments',
              color: '#7C3AED'
            },
            {
              label: 'SIAT Integrado',
              value: siatAmbiente?.valor === '2' ? 'Pruebas' : 'Producción',
              icon: 'check_circle',
              color: '#10B981'
            }
          ]);
        }
      },
      error: (error) => {
        console.error('Error al cargar parámetros:', error);
      }
    });
  }

  private buscarParametro(parametros: Parametro[], codigo: string): Parametro | undefined {
    return parametros.find(p => p.codigo === codigo);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}