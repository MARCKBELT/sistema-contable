import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ConfigService, Parametro } from '../../core/services/config.service';
import { User } from '../../shared/models/user.model';

/**
 * COMPONENTE: DashboardComponent
 * 
 * Propósito: Mostrar la pantalla principal después del login con:
 * - Información del usuario y empresa
 * - Tarjetas de acceso a los módulos principales
 * - Estadísticas en tiempo real (salario mínimo, tipos de cambio, SIAT)
 * 
 * Ciclo de vida:
 * 1. OnInit: Se ejecuta cuando el componente se carga
 * 2. Obtiene los datos del usuario desde AuthService
 * 3. Carga los parámetros del sistema desde ConfigService
 * 4. Actualiza las estadísticas con datos reales
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  /**
   * SIGNAL: user
   * Propósito: Almacenar los datos del usuario logueado
   * Se actualiza automáticamente desde AuthService
   */
  user = signal<User | null>(null);

  /**
   * SIGNAL: cards
   * Propósito: Definir las tarjetas de los módulos principales
   * Cada tarjeta tiene: título, descripción, icono, color y ruta
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
    }
  ]);

  /**
   * SIGNAL: stats
   * Propósito: Almacenar las estadísticas que se muestran en el dashboard
   * Inicialmente tienen valores por defecto, luego se actualizan desde la BD
   */
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

  /**
   * CONSTRUCTOR
   * 
   * Propósito: Inyectar los servicios necesarios
   * @param authService - Servicio de autenticación para obtener datos del usuario
   * @param configService - Servicio de configuración para obtener parámetros
   * @param router - Servicio de navegación para cambiar de página
   */
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private router: Router
  ) {}

  /**
   * MÉTODO: ngOnInit
   * 
   * Propósito: Se ejecuta automáticamente cuando el componente se carga
   * 
   * Acciones:
   * 1. Obtiene los datos del usuario logueado
   * 2. Carga los parámetros del sistema
   * 3. Actualiza las estadísticas con datos reales
   */
  ngOnInit() {
    // Obtener usuario actual desde el servicio de autenticación
    this.user.set(this.authService.currentUser());
    
    // Cargar parámetros del sistema
    this.cargarParametros();
  }

  /**
   * MÉTODO: cargarParametros
   * 
   * Propósito: Obtener los parámetros desde el backend y actualizar las estadísticas
   * 
   * Proceso:
   * 1. Llama al API para obtener todos los parámetros
   * 2. Busca parámetros específicos (salario mínimo, tipos de cambio)
   * 3. Actualiza el signal de stats con los valores reales
   */
  cargarParametros() {
    this.configService.obtenerParametros().subscribe({
      next: (response) => {
        if (response.success) {
          const parametros = response.data;
          
          // Buscar parámetros específicos por código
          const salarioMinimo = this.buscarParametro(parametros, 'SALARIO_MINIMO_NACIONAL');
          const tipoCambioOficial = this.buscarParametro(parametros, 'TIPO_CAMBIO_OFICIAL');
          const siatAmbiente = this.buscarParametro(parametros, 'SIAT_AMBIENTE');
          
          // Actualizar las estadísticas con los valores reales
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
        // Si hay error, mantener los valores "Cargando..."
      }
    });
  }

  /**
   * MÉTODO: buscarParametro
   * 
   * Propósito: Buscar un parámetro específico en el array de parámetros
   * 
   * @param parametros - Array de todos los parámetros
   * @param codigo - Código del parámetro a buscar (ej: 'SALARIO_MINIMO_NACIONAL')
   * @returns El parámetro encontrado o undefined
   * 
   * Ejemplo:
   *   const salario = this.buscarParametro(parametros, 'SALARIO_MINIMO_NACIONAL');
   *   console.log(salario.valor); // "3300"
   */
  private buscarParametro(parametros: Parametro[], codigo: string): Parametro | undefined {
    return parametros.find(p => p.codigo === codigo);
  }

  /**
   * MÉTODO: navigateTo
   * 
   * Propósito: Navegar a una ruta específica cuando se hace clic en una tarjeta
   * 
   * @param route - Ruta a la que navegar (ej: '/contabilidad')
   * 
   * Ejemplo de uso en el template:
   *   <div (click)="navigateTo('/contabilidad')">...</div>
   */
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  /**
   * MÉTODO: logout
   * 
   * Propósito: Cerrar sesión del usuario
   * 
   * Proceso:
   * 1. Llama al método logout del AuthService
   * 2. Redirige al login
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}