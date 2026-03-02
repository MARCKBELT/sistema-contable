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
  mostrarFormulario = signal(false);
  mostrarImportador = signal(false);
  
  // Formulario mejorado
  cuentaPadreSeleccionada = signal<string>('');
  codigoGenerado = signal<string>('');
  nombreCuenta = signal<string>('');
  tipoSeleccionado = signal<'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'>('activo');
  naturalezaSeleccionada = signal<'deudora' | 'acreedora'>('deudora');
  esImputable = signal(true);

  archivoSeleccionado = signal<File | null>(null);
  importando = signal(false);
  resultadoImportacion = signal<any>(null);

  guardando = signal(false);
  mensaje = signal<{tipo: 'success' | 'error', texto: string} | null>(null);

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

  get cuentasNivel4() {
    return this.puctService.getCuentasNivel4();
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
    this.limpiarFormulario();
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.cuentaPadreSeleccionada.set('');
    this.codigoGenerado.set('');
    this.nombreCuenta.set('');
    this.tipoSeleccionado.set('activo');
    this.naturalezaSeleccionada.set('deudora');
    this.esImputable.set(true);
  }

  onCuentaPadreChange(codigoPadre: string): void {
    if (!codigoPadre) {
      this.codigoGenerado.set('');
      return;
    }

    // Generar código automáticamente
    const siguienteCodigo = this.puctService.obtenerSiguienteCodigoNivel5(codigoPadre);
    this.codigoGenerado.set(siguienteCodigo);

    // Obtener info de la cuenta padre para sugerir tipo y naturaleza
    const cuentaPadre = this.puctService.cuentas().find(c => c.codigo === codigoPadre);
    if (cuentaPadre) {
      this.tipoSeleccionado.set(cuentaPadre.tipo);
      this.naturalezaSeleccionada.set(cuentaPadre.naturaleza);
    }
  }

  abrirImportador(): void {
    this.mostrarImportador.set(true);
    this.resultadoImportacion.set(null);
  }

  cerrarImportador(): void {
    this.mostrarImportador.set(false);
    this.archivoSeleccionado.set(null);
    this.resultadoImportacion.set(null);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoSeleccionado.set(input.files[0]);
    }
  }

  importarPUCT(): void {
    const archivo = this.archivoSeleccionado();
    
    if (!archivo) {
      this.mostrarMensaje('error', 'Seleccione un archivo CSV');
      return;
    }

    this.importando.set(true);

    this.puctService.importarPUCT(archivo).subscribe({
      next: (response) => {
        console.log('Importación exitosa:', response);
        this.resultadoImportacion.set(response.data);
        this.mostrarMensaje('success', `${response.data.importadas} cuentas importadas correctamente`);
        this.cargarCuentas();
        this.importando.set(false);
      },
      error: (err) => {
        console.error('Error en importación:', err);
        this.mostrarMensaje('error', err.error?.message || 'Error al importar archivo');
        this.importando.set(false);
      }
    });
  }

  descargarPlantilla(): void {
    const csvContent = `codigo,nombre,nivel,tipo,naturaleza,es_imputable,aplica_comercial,aplica_servicios,aplica_transporte,aplica_industrial,aplica_petrolera,aplica_construccion,aplica_agropecuaria,aplica_minera
1-1-1-001-001,Caja Moneda Nacional,5,activo,deudora,true,true,true,true,true,true,true,true,true
5-2-1-001-001,Sueldos y Salarios,5,gasto,deudora,true,true,true,true,true,true,true,true,true`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-puct.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  crearCuenta(): void {
    const codigo = this.codigoGenerado();
    const nombre = this.nombreCuenta();

    if (!codigo || !nombre) {
      this.mostrarMensaje('error', 'Seleccione una cuenta padre e ingrese el nombre');
      return;
    }

    const cuenta = {
      codigo,
      nombre,
      nivel: 5,
      tipo: this.tipoSeleccionado(),
      naturaleza: this.naturalezaSeleccionada(),
      es_imputable: this.esImputable()
    };

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
