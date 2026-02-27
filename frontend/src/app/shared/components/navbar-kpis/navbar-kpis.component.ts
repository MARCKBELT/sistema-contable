import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../../core/services/config.service';

interface KPI {
  id: string;
  icono: string;
  label: string;
  valor: string;
  parametroNombre: string;
}

@Component({
  selector: 'app-navbar-kpis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-kpis.component.html',
  styleUrl: './navbar-kpis.component.scss'
})
export class NavbarKpisComponent implements OnInit {
  kpisDisponibles: KPI[] = [
    { id: '1', icono: '💰', label: 'Salario Mínimo', valor: '-', parametroNombre: 'SALARIO_MINIMO_NACIONAL' },
    { id: '2', icono: '💵', label: 'Dólar', valor: '-', parametroNombre: 'TIPO_CAMBIO_USD_BOB' },
    { id: '3', icono: '📊', label: 'UFV', valor: '-', parametroNombre: 'UFV_ACTUAL' },
    { id: '4', icono: '🧾', label: 'IVA', valor: '-', parametroNombre: 'ALICUOTA_IVA' }
  ];

  kpisSeleccionados = signal<string[]>(['1', '2', '3']); // Por defecto 3
  mostrarSelector = signal(false);

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    // Cargar KPIs seleccionados del localStorage
    const guardados = localStorage.getItem('kpisSeleccionados');
    if (guardados) {
      this.kpisSeleccionados.set(JSON.parse(guardados));
    }

    // Cargar valores de parámetros
    this.cargarValores();
  }

  cargarValores(): void {
    this.configService.obtenerParametros().subscribe({
      next: (response) => {
        if (response.success) {
          this.kpisDisponibles.forEach(kpi => {
            const parametro = response.data.find(p => p.nombre === kpi.parametroNombre);
            if (parametro) {
              kpi.valor = this.formatearValor(parametro.valor, kpi.parametroNombre);
            }
          });
        }
      }
    });
  }

  formatearValor(valor: string, nombre: string): string {
    if (nombre === 'SALARIO_MINIMO_NACIONAL') {
      return `Bs ${parseFloat(valor).toLocaleString('es-BO')}`;
    }
    if (nombre === 'TIPO_CAMBIO_USD_BOB') {
      return `Bs ${valor}`;
    }
    if (nombre === 'ALICUOTA_IVA') {
      return `${valor}%`;
    }
    return valor;
  }

  get kpisMostrar(): KPI[] {
    return this.kpisDisponibles.filter(k => this.kpisSeleccionados().includes(k.id));
  }

  toggleKpi(kpiId: string): void {
    const seleccionados = this.kpisSeleccionados();
    const index = seleccionados.indexOf(kpiId);
    
    if (index > -1) {
      // Si está, quitarlo (pero mantener al menos 1)
      if (seleccionados.length > 1) {
        const nuevos = seleccionados.filter(id => id !== kpiId);
        this.kpisSeleccionados.set(nuevos);
        localStorage.setItem('kpisSeleccionados', JSON.stringify(nuevos));
      }
    } else {
      // Si no está, agregarlo (máximo 4)
      if (seleccionados.length < 4) {
        const nuevos = [...seleccionados, kpiId];
        this.kpisSeleccionados.set(nuevos);
        localStorage.setItem('kpisSeleccionados', JSON.stringify(nuevos));
      }
    }
  }

  toggleSelector(): void {
    this.mostrarSelector.set(!this.mostrarSelector());
  }

  cerrarSelector(): void {
    this.mostrarSelector.set(false);
  }
}
