import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ComprobanteService, Comprobante, DetalleComprobante } from '../../core/services/comprobante.service';
import { PuctService, CuentaContable } from '../../core/services/puct.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-comprobantes',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './comprobantes.component.html',
  styleUrl: './comprobantes.component.scss'
})
export class ComprobantesComponent implements OnInit {
  mostrarFormulario = signal(false);

  // Datos del formulario
  tipoComprobante = signal<'ingreso' | 'egreso' | 'traspaso'>('ingreso');
  numeroComprobante = signal('');
  fechaComprobante = signal(this.getFechaHoy());
  glosaGeneral = signal('');

  detalles = signal<DetalleComprobante[]>([]);

  // Detalle en edición
  cuentaSeleccionada = signal('');
  glosaDetalle = signal('');
  montoDetalle = signal(0);
  tipoMovimiento = signal<'debe' | 'haber'>('debe');

  guardando = signal(false);
  mensaje = signal<{tipo: 'success' | 'error', texto: string} | null>(null);

  constructor(
    public comprobanteService: ComprobanteService,
    public puctService: PuctService,
    private authService: AuthService
  ) {}

  get comprobantes() {
    return this.comprobanteService.comprobantes();
  }

  get cargando() {
    return this.comprobanteService.cargando();
  }

  get cuentasImputables() {
    return this.puctService.cuentas().filter(c => c.es_imputable);
  }

  get usuario() {
    return this.authService.usuario();
  }

  get empresaActiva() {
    return this.authService.empresaActiva();
  }

  get balance() {
    return this.comprobanteService.validarBalance(this.detalles());
  }

  get puedeGuardar() {
    return this.balance.valido && this.detalles().length >= 2;
  }

  ngOnInit(): void {
    this.cargarComprobantes();
    this.cargarCuentas();
    this.cuentasFiltradas.set(this.cuentasImputables);
  }

  cargarComprobantes(): void {
    this.comprobanteService.obtenerComprobantes().subscribe({
      error: (err) => {
        console.error('Error al cargar comprobantes:', err);
        this.mostrarMensaje('error', 'Error al cargar comprobantes');
      }
    });
  }

  cargarCuentas(): void {
    this.puctService.obtenerCuentas().subscribe({
      error: (err) => {
        console.error('Error al cargar cuentas:', err);
      }
    });
  }

  abrirFormulario(): void {
    this.mostrarFormulario.set(true);
    this.obtenerSiguienteNumero();
    this.limpiarFormulario();
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.tipoComprobante.set('ingreso');
    this.fechaComprobante.set(this.getFechaHoy());
    this.glosaGeneral.set('');
    this.detalles.set([]);
    this.limpiarDetalle();
  }

  limpiarDetalle(): void {
    this.cuentaSeleccionada.set('');
    this.glosaDetalle.set('');
    this.montoDetalle.set(0);
    this.tipoMovimiento.set('debe');
  }

  obtenerSiguienteNumero(): void {
    this.comprobanteService.obtenerSiguienteNumero(this.tipoComprobante()).subscribe({
      next: (response) => {
        this.numeroComprobante.set(response.data.numero);
      },
      error: (err) => {
        console.error('Error al obtener número:', err);
      }
    });
  }

  onTipoChange(): void {
    this.obtenerSiguienteNumero();
  }

  agregarDetalle(): void {
    if (!this.cuentaSeleccionada() || this.montoDetalle() <= 0) {
      this.mostrarMensaje('error', 'Seleccione una cuenta y monto válido');
      return;
    }

    const cuenta = this.cuentasImputables.find(c => c.id === this.cuentaSeleccionada());
    if (!cuenta) return;

    const detalle: DetalleComprobante = {
      cuenta_id: cuenta.id,
      cuenta_codigo: cuenta.codigo,
      cuenta_nombre: cuenta.nombre,
      glosa: this.glosaDetalle() || this.glosaGeneral(),
      debe: this.tipoMovimiento() === 'debe' ? this.montoDetalle() : 0,
      haber: this.tipoMovimiento() === 'haber' ? this.montoDetalle() : 0
    };

    this.detalles.set([...this.detalles(), detalle]);
    this.limpiarDetalle();
  }

  eliminarDetalle(index: number): void {
    const nuevosDetalles = [...this.detalles()];
    nuevosDetalles.splice(index, 1);
    this.detalles.set(nuevosDetalles);
  }

  crearComprobante(): void {
    if (!this.puedeGuardar) {
      this.mostrarMensaje('error', 'El comprobante debe tener al menos 2 movimientos y estar balanceado');
      return;
    }

    const comprobante: Partial<Comprobante> = {
      numero: this.numeroComprobante(),
      tipo: this.tipoComprobante(),
      fecha: this.fechaComprobante(),
      glosa_general: this.glosaGeneral(),
      detalles: this.detalles()
    };

    this.guardando.set(true);

    this.comprobanteService.crearComprobante(comprobante).subscribe({
      next: () => {
        this.mostrarMensaje('success', 'Comprobante creado correctamente');
        this.cerrarFormulario();
        this.cargarComprobantes();
        this.guardando.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.mostrarMensaje('error', err.error?.message || 'Error al crear comprobante');
        this.guardando.set(false);
      }
    });
  }

  getFechaHoy(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string): void {
    this.mensaje.set({ tipo, texto });
    setTimeout(() => this.mensaje.set(null), 4000);
  }

  getColorTipo(tipo: string): string {
    const colores: Record<string, string> = {
      'ingreso': '#48bb78',
      'egreso': '#e53e3e',
      'traspaso': '#667eea'
    };
    return colores[tipo] || '#718096';
  }

  getIconoTipo(tipo: string): string {
    const iconos: Record<string, string> = {
      'ingreso': '💰',
      'egreso': '💸',
      'traspaso': '🔄'
    };
    return iconos[tipo] || '📝';
  }

  formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(valor);
  }
}

  // Nuevas propiedades para búsqueda de cuentas
  busquedaCuenta = signal('');
  cuentasFiltradas = signal<CuentaContable[]>([]);
  tipoCuentaSeleccionada = signal<'A' | 'P' | 'C' | 'I' | 'G'>('A');

  filtrarCuentas(): void {
    const busqueda = this.busquedaCuenta().toLowerCase();
    if (!busqueda) {
      this.cuentasFiltradas.set(this.cuentasImputables);
      return;
    }

    const filtradas = this.cuentasImputables.filter(c =>
      c.codigo.toLowerCase().includes(busqueda) ||
      c.nombre.toLowerCase().includes(busqueda)
    );
    this.cuentasFiltradas.set(filtradas);
  }

  seleccionarCuentaDesdeBusqueda(): void {
    const texto = this.busquedaCuenta();
    const codigo = texto.split(' - ')[0];
    const cuenta = this.cuentasImputables.find(c => c.codigo === codigo);

    if (cuenta) {
      this.cuentaSeleccionada.set(cuenta.id);

      // Detectar tipo automáticamente
      switch(cuenta.tipo) {
        case 'activo': this.tipoCuentaSeleccionada.set('A'); break;
        case 'pasivo': this.tipoCuentaSeleccionada.set('P'); break;
        case 'patrimonio': this.tipoCuentaSeleccionada.set('C'); break;
        case 'ingreso': this.tipoCuentaSeleccionada.set('I'); break;
        case 'gasto': this.tipoCuentaSeleccionada.set('G'); break;
      }
    }
  }

  // Nuevas propiedades para búsqueda de cuentas
  busquedaCuenta = signal('');
  cuentasFiltradas = signal<CuentaContable[]>([]);
  tipoCuentaSeleccionada = signal<'A' | 'P' | 'C' | 'I' | 'G'>('A');

  filtrarCuentas(): void {
    const busqueda = this.busquedaCuenta().toLowerCase();
    if (!busqueda) {
      this.cuentasFiltradas.set(this.cuentasImputables);
      return;
    }

    const filtradas = this.cuentasImputables.filter(c =>
      c.codigo.toLowerCase().includes(busqueda) ||
      c.nombre.toLowerCase().includes(busqueda)
    );
    this.cuentasFiltradas.set(filtradas);
  }

  seleccionarCuentaDesdeBusqueda(): void {
    const texto = this.busquedaCuenta();
    const codigo = texto.split(' - ')[0];
    const cuenta = this.cuentasImputables.find(c => c.codigo === codigo);

    if (cuenta) {
      this.cuentaSeleccionada.set(cuenta.id);

      // Detectar tipo automáticamente
      switch(cuenta.tipo) {
        case 'activo': this.tipoCuentaSeleccionada.set('A'); break;
        case 'pasivo': this.tipoCuentaSeleccionada.set('P'); break;
        case 'patrimonio': this.tipoCuentaSeleccionada.set('C'); break;
        case 'ingreso': this.tipoCuentaSeleccionada.set('I'); break;
        case 'gasto': this.tipoCuentaSeleccionada.set('G'); break;
      }
    }
  }
