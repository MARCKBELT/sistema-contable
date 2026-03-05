import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ReporteService, LibroDiario, LibroMayor, BalanceGeneral, EstadoResultados } from '../../core/services/reporte.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  tipoReporte = signal<'diario' | 'mayor' | 'balance' | 'resultados'>('diario');
  fechaInicio = signal(this.getPrimerDiaMes());
  fechaFin = signal(this.getFechaHoy());
  
  // Datos de reportes
  libroDiario = signal<LibroDiario[]>([]);
  libroMayor = signal<LibroMayor[]>([]);
  balanceGeneral = signal<BalanceGeneral | null>(null);
  estadoResultados = signal<EstadoResultados | null>(null);

  cargando = signal(false);
  mensaje = signal<{tipo: 'success' | 'error', texto: string} | null>(null);

  constructor(
    private reporteService: ReporteService,
    private authService: AuthService
  ) {}

  get empresaActiva() {
    return this.authService.empresaActiva();
  }

  ngOnInit(): void {
    this.generarReporte();
  }

  generarReporte(): void {
    this.cargando.set(true);

    switch(this.tipoReporte()) {
      case 'diario':
        this.reporteService.obtenerLibroDiario(this.fechaInicio(), this.fechaFin()).subscribe({
          next: (response) => {
            this.libroDiario.set(response.data);
            this.cargando.set(false);
          },
          error: (err) => {
            console.error('Error:', err);
            this.mostrarMensaje('error', 'Error al generar libro diario');
            this.cargando.set(false);
          }
        });
        break;

      case 'mayor':
        this.reporteService.obtenerLibroMayor(this.fechaInicio(), this.fechaFin()).subscribe({
          next: (response) => {
            this.libroMayor.set(response.data);
            this.cargando.set(false);
          },
          error: (err) => {
            console.error('Error:', err);
            this.mostrarMensaje('error', 'Error al generar libro mayor');
            this.cargando.set(false);
          }
        });
        break;

      case 'balance':
        this.reporteService.obtenerBalanceGeneral(this.fechaFin()).subscribe({
          next: (response) => {
            this.balanceGeneral.set(response.data);
            this.cargando.set(false);
          },
          error: (err) => {
            console.error('Error:', err);
            this.mostrarMensaje('error', 'Error al generar balance general');
            this.cargando.set(false);
          }
        });
        break;

      case 'resultados':
        this.reporteService.obtenerEstadoResultados(this.fechaInicio(), this.fechaFin()).subscribe({
          next: (response) => {
            this.estadoResultados.set(response.data);
            this.cargando.set(false);
          },
          error: (err) => {
            console.error('Error:', err);
            this.mostrarMensaje('error', 'Error al generar estado de resultados');
            this.cargando.set(false);
          }
        });
        break;
    }
  }

  onTipoReporteChange(): void {
    this.generarReporte();
  }

  getPrimerDiaMes(): string {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  }

  getFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string): void {
    this.mensaje.set({ tipo, texto });
    setTimeout(() => this.mensaje.set(null), 4000);
  }

  formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(valor);
  }

  exportarPDF(): void {
    const params = {
      fecha_inicio: this.fechaInicio(),
      fecha_fin: this.fechaFin()
    };

    this.reporteService.exportarPDF(this.tipoReporte(), params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.tipoReporte()}_${this.fechaFin()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.mostrarMensaje('success', 'PDF generado correctamente');
      },
      error: (err) => {
        console.error('Error:', err);
        this.mostrarMensaje('error', 'Error al generar PDF');
      }
    });
  }

  exportarExcel(): void {
    const params = {
      fecha_inicio: this.fechaInicio(),
      fecha_fin: this.fechaFin()
    };

    this.reporteService.exportarExcel(this.tipoReporte(), params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.tipoReporte()}_${this.fechaFin()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.mostrarMensaje('success', 'Excel generado correctamente');
      },
      error: (err) => {
        console.error('Error:', err);
        this.mostrarMensaje('error', 'Error al generar Excel');
      }
    });
  }
}
