import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ConfigService, Parametro } from '../../core/services/config.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss'
})
export class ConfiguracionComponent implements OnInit {
  parametroEditando = signal<string | null>(null);
  valorTemporal = signal<string>('');
  guardando = signal(false);
  mensaje = signal<{tipo: 'success' | 'error', texto: string} | null>(null);

  constructor(private configService: ConfigService) {}

  // Usar getters en lugar de signals directos
  get parametros() {
    return this.configService.parametros();
  }

  get cargando() {
    return this.configService.cargando();
  }

  get categorias() {
    const cats = new Set(this.parametros.map(p => p.categoria));
    return Array.from(cats);
  }

  ngOnInit(): void {
    this.cargarParametros();
  }

  cargarParametros(): void {
    this.configService.obtenerParametros().subscribe({
      error: (err) => {
        console.error('Error al cargar parámetros:', err);
        this.mostrarMensaje('error', 'Error al cargar parámetros');
      }
    });
  }

  obtenerPorCategoria(categoria: string): Parametro[] {
    return this.parametros.filter(p => p.categoria === categoria);
  }

  iniciarEdicion(parametro: Parametro): void {
    if (!parametro.editable) return;
    this.parametroEditando.set(parametro.id);
    this.valorTemporal.set(parametro.valor);
  }

  cancelarEdicion(): void {
    this.parametroEditando.set(null);
    this.valorTemporal.set('');
  }

  guardarParametro(parametro: Parametro): void {
    if (!this.valorTemporal() || this.valorTemporal() === parametro.valor) {
      this.cancelarEdicion();
      return;
    }

    this.guardando.set(true);

    this.configService.actualizarParametro(parametro.id, this.valorTemporal()).subscribe({
      next: (response) => {
        this.mostrarMensaje('success', 'Parámetro actualizado correctamente');
        this.cargarParametros();
        this.cancelarEdicion();
        this.guardando.set(false);
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.mostrarMensaje('error', 'Error al guardar parámetro');
        this.guardando.set(false);
      }
    });
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string): void {
    this.mensaje.set({ tipo, texto });
    setTimeout(() => this.mensaje.set(null), 4000);
  }

  getNombreCategoria(categoria: string): string {
    const nombres: Record<string, string> = {
      'SALARIAL': 'Parámetros Salariales',
      'CAMBIARIA': 'Tipo de Cambio',
      'UFV': 'UFV',
      'IMPUESTOS': 'Impuestos',
      'APORTES': 'Aportes',
      'BENEFICIOS': 'Beneficios Sociales',
      'SISTEMA': 'Sistema'
    };
    return nombres[categoria] || categoria;
  }

  getIconoCategoria(categoria: string): string {
    const iconos: Record<string, string> = {
      'SALARIAL': '💰',
      'CAMBIARIA': '💵',
      'UFV': '📊',
      'IMPUESTOS': '🧾',
      'APORTES': '📈',
      'BENEFICIOS': '🎁',
      'SISTEMA': '⚙️'
    };
    return iconos[categoria] || '📋';
  }
}
