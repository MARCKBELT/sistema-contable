import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService, CuentaContable, Comprobante, DetalleComprobante } from '../../core/services/contabilidad.service';

/**
 * COMPONENTE: ContabilidadComponent
 * 
 * Propósito: Gestionar Plan de Cuentas y Comprobantes Contables
 * 
 * Vistas:
 * 1. Plan de Cuentas (ver todas las cuentas jerárquicamente)
 * 2. Nuevo Comprobante (registrar asientos contables)
 * 3. Lista de Comprobantes
 */
@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contabilidad.component.html',
  styleUrl: './contabilidad.component.scss'
})
export class ContabilidadComponent implements OnInit {
  // Vista actual
  vistaActual = signal<'plan-cuentas' | 'nuevo-comprobante' | 'comprobantes'>('plan-cuentas');
  
  // Plan de Cuentas
  cuentas = signal<CuentaContable[]>([]);
  cuentasImputables = signal<CuentaContable[]>([]);
  cargandoCuentas = signal<boolean>(false);
  
  // Nuevo Comprobante
  nuevoComprobante = signal<Comprobante>({
    tipo: 'traspaso',
    fecha: new Date().toISOString().split('T')[0],
    glosa: '',
    detalles: []
  });
  
  // Mensaje
  mensaje = signal<{ tipo: 'success' | 'error', texto: string } | null>(null);

  constructor(private contabilidadService: ContabilidadService) {}

  ngOnInit() {
    this.cargarCuentas();
  }

  /**
   * Cargar Plan de Cuentas
   */
  cargarCuentas() {
    this.cargandoCuentas.set(true);
    
    // Cargar todas las cuentas
    this.contabilidadService.obtenerCuentas().subscribe({
      next: (response) => {
        if (response.success) {
          this.cuentas.set(response.data);
        }
        this.cargandoCuentas.set(false);
      },
      error: (error) => {
        console.error('Error al cargar cuentas:', error);
        this.cargandoCuentas.set(false);
      }
    });
    
    // Cargar cuentas imputables para el formulario
    this.contabilidadService.obtenerCuentas({ es_imputable: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.cuentasImputables.set(response.data);
        }
      }
    });
  }

  /**
   * Cambiar vista
   */
  cambiarVista(vista: 'plan-cuentas' | 'nuevo-comprobante' | 'comprobantes') {
    this.vistaActual.set(vista);
  }

  /**
   * Agregar línea al comprobante
   */
  agregarLinea() {
    const comprobante = this.nuevoComprobante();
    comprobante.detalles.push({
      cuenta_id: '',
      glosa: '',
      debe: 0,
      haber: 0
    });
    this.nuevoComprobante.set({ ...comprobante });
  }

  /**
   * Eliminar línea del comprobante
   */
  eliminarLinea(index: number) {
    const comprobante = this.nuevoComprobante();
    comprobante.detalles.splice(index, 1);
    this.nuevoComprobante.set({ ...comprobante });
  }

  /**
   * Calcular totales
   */
  calcularTotales(): { debe: number; haber: number } {
    const comprobante = this.nuevoComprobante();
    let debe = 0;
    let haber = 0;
    
    comprobante.detalles.forEach(d => {
      debe += parseFloat(d.debe?.toString() || '0');
      haber += parseFloat(d.haber?.toString() || '0');
    });
    
    return { debe, haber };
  }

  /**
   * Validar si está cuadrado
   */
  estaCuadrado(): boolean {
    const { debe, haber } = this.calcularTotales();
    return Math.abs(debe - haber) < 0.01;
  }

  /**
   * Guardar comprobante
   */
  guardarComprobante() {
    const comprobante = this.nuevoComprobante();
    
    // Validaciones
    if (!comprobante.glosa) {
      this.mostrarMensaje('error', 'Debe ingresar una glosa');
      return;
    }
    
    if (comprobante.detalles.length < 2) {
      this.mostrarMensaje('error', 'Debe tener al menos 2 líneas en el comprobante');
      return;
    }
    
    if (!this.estaCuadrado()) {
      this.mostrarMensaje('error', 'El comprobante no está cuadrado (Debe = Haber)');
      return;
    }
    
    this.contabilidadService.crearComprobante(comprobante).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('success', 'Comprobante creado exitosamente');
          this.limpiarFormulario();
        }
      },
      error: (error) => {
        console.error('Error al crear comprobante:', error);
        this.mostrarMensaje('error', 'Error al crear el comprobante');
      }
    });
  }

  /**
   * Limpiar formulario
   */
  limpiarFormulario() {
    this.nuevoComprobante.set({
      tipo: 'traspaso',
      fecha: new Date().toISOString().split('T')[0],
      glosa: '',
      detalles: []
    });
  }

  /**
   * Mostrar mensaje
   */
  mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    this.mensaje.set({ tipo, texto });
    setTimeout(() => {
      this.mensaje.set(null);
    }, 3000);
  }

  /**
   * Obtener color por tipo de cuenta
   */
  obtenerColorTipo(tipo: string): string {
    const colores: { [key: string]: string } = {
      'activo': '#2563EB',
      'pasivo': '#EF4444',
      'patrimonio': '#8B5CF6',
      'ingreso': '#10B981',
      'gasto': '#F59E0B'
    };
    return colores[tipo] || '#718096';
  }
}
