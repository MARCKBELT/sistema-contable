import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { PuctService, CuentaContable } from '../../core/services/puct.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './contabilidad.component.html',
  styleUrl: './contabilidad.component.scss'
})
export class ContabilidadComponent implements OnInit {
  // Formulario nueva cuenta
  mostrarFormulario = signal(false);
  nuevaCuenta = signal({
    codigo: '',
    nombre: '',
    nivel: 5,
    tipo: 'activo' as const,
    naturaleza: 'deudora' as const,
    es_imputable: true
  });

  guardando = signal(false);
  mensaje = signal<{tipo: 'success' | 'error', texto: string} | null>(null);

  // Filtros
  filtroNivel = signal<number | null>(null);
  filtroTipo = signal<string | null>(null);
  busqueda = signal('');

  constructor(
    public puctService: PuctService,
    private authService: AuthService
  ) {}

  get cuentas() {
    return this.puctService.getCuentasFiltradas();
  }

  get cargando() {
    return this.puctService.cargando();
  }

  get usuario() {
    return this.authService.usuario();
  }

  get empresaActiva() {
    return this.authService.empresaActiva();
  }

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas(): void {
    this.puctService.obtenerCuentas().subscribe({
      error: (err) => {
        console.error('Error al cargar cuentas:', err);
        this.mostrarMensaje('error', 'Error al cargar el plan de cuentas');
      }
    });
  }

  aplicarFiltros(): void {
    this.puctService.filtroNivel.set(this.filtroNivel());
    this.puctService.filtroTipo.set(this.filtroTipo());
    this.puctService.busqueda.set(this.busqueda());
  }

  limpiarFiltros(): void {
    this.filtroNivel.set(null);
    this.filtroTipo.set(null);
    this.busqueda.set('');
    this.aplicarFiltros();
  }

  abrirFormulario(): void {
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.nuevaCuenta.set({
      codigo: '',
      nombre: '',
      nivel: 5,
      tipo: 'activo',
      naturaleza: 'deudora',
      es_imputable: true
    });
  }

  crearCuenta(): void {
    const cuenta = this.nuevaCuenta();

    if (!cuenta.codigo || !cuenta.nombre) {
      this.mostrarMensaje('error', 'Código y nombre son obligatorios');
      return;
    }

    // Validar código según nivel
    if (!this.validarCodigo(cuenta.codigo, cuenta.nivel)) {
      this.mostrarMensaje('error', `Código inválido para nivel ${cuenta.nivel}`);
      return;
    }

    this.guardando.set(true);

    this.puctService.crearCuenta(cuenta).subscribe({
      next: () => {
        this.mostrarMensaje('success', 'Cuenta creada correctamente');
        this.cerrarFormulario();
        this.cargarCuentas();
        this.guardando.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.mostrarMensaje('error', err.error?.message || 'Error al crear cuenta');
        this.guardando.set(false);
      }
    });
  }

  validarCodigo(codigo: string, nivel: number): boolean {
    // Nivel 1: 1 dígito (1-5)
    if (nivel === 1) return /^[1-5]$/.test(codigo);
    
    // Nivel 2: 1-1 (2 dígitos)
    if (nivel === 2) return /^\d-\d$/.test(codigo);
    
    // Nivel 3: 1-1-1 (3 dígitos)
    if (nivel === 3) return /^\d-\d-\d$/.test(codigo);
    
    // Nivel 4: 1-1-1-001 (6 dígitos)
    if (nivel === 4) return /^\d-\d-\d-\d{3}$/.test(codigo);
    
    // Nivel 5: 1-1-1-001-001 (9 dígitos)
    if (nivel === 5) return /^\d-\d-\d-\d{3}-\d{3}$/.test(codigo);
    
    return false;
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string): void {
    this.mensaje.set({ tipo, texto });
    setTimeout(() => this.mensaje.set(null), 4000);
  }

  getColorPorTipo(tipo: string): string {
    const colores: Record<string, string> = {
      'activo': '#48bb78',
      'pasivo': '#e53e3e',
      'patrimonio': '#667eea',
      'ingreso': '#38b2ac',
      'gasto': '#ed8936'
    };
    return colores[tipo] || '#718096';
  }

  getIconoPorNivel(nivel: number): string {
    const iconos = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    return iconos[nivel] || '📋';
  }

  puedeCrear(): boolean {
    const rol = this.usuario?.rol || '';
    return this.puctService.esEditable(5, rol);
  }
}
