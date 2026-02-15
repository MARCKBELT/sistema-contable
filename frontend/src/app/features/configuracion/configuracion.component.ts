import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService, Parametro } from '../../core/services/config.service';

/**
 * COMPONENTE: ConfiguracionComponent
 * 
 * Propósito: Gestionar los parámetros configurables del sistema
 * 
 * Funcionalidades:
 * 1. Listar todos los parámetros organizados por categoría
 * 2. Editar valores de parámetros
 * 3. Guardar cambios en la base de datos
 * 4. Filtrar por categoría (Laboral, Financiero, Tributario)
 * 5. Búsqueda de parámetros
 * 
 * Ejemplo de parámetros:
 * - Salario Mínimo Nacional
 * - Tipos de Cambio
 * - Aportes Laborales
 * - Configuración SIAT
 */
@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss'
})
export class ConfiguracionComponent implements OnInit {
  /**
   * SIGNAL: parametros
   * Propósito: Almacenar todos los parámetros del sistema
   */
  parametros = signal<Parametro[]>([]);

  /**
   * SIGNAL: parametrosFiltrados
   * Propósito: Almacenar los parámetros después de aplicar filtros
   */
  parametrosFiltrados = signal<Parametro[]>([]);

  /**
   * SIGNAL: categoriaSeleccionada
   * Propósito: Categoría actualmente seleccionada para filtrar
   * Valores: 'todas' | 'laboral' | 'financiero' | 'tributario'
   */
  categoriaSeleccionada = signal<string>('todas');

  /**
   * SIGNAL: parametroEditando
   * Propósito: Parámetro que se está editando actualmente
   */
  parametroEditando = signal<Parametro | null>(null);

  /**
   * SIGNAL: valorTemporal
   * Propósito: Valor temporal mientras se edita (antes de guardar)
   */
  valorTemporal = signal<string>('');

  /**
   * SIGNAL: cargando
   * Propósito: Indicador de carga mientras se obtienen/guardan datos
   */
  cargando = signal<boolean>(false);

  /**
   * SIGNAL: mensaje
   * Propósito: Mensaje de éxito/error para mostrar al usuario
   */
  mensaje = signal<{ tipo: 'success' | 'error', texto: string } | null>(null);

  /**
   * CATEGORÍAS DISPONIBLES
   * Propósito: Lista de categorías para el filtro
   */
  categorias = [
    { value: 'todas', label: 'Todas las categorías', icon: 'apps' },
    { value: 'laboral', label: 'Laboral', icon: 'groups' },
    { value: 'financiero', label: 'Financiero', icon: 'account_balance' },
    { value: 'tributario', label: 'Tributario', icon: 'receipt_long' }
  ];

  constructor(private configService: ConfigService) {}

  /**
   * MÉTODO: ngOnInit
   * Propósito: Se ejecuta al cargar el componente
   * Acción: Cargar todos los parámetros
   */
  ngOnInit() {
    this.cargarParametros();
  }

  /**
   * MÉTODO: cargarParametros
   * Propósito: Obtener todos los parámetros desde el backend
   * 
   * Proceso:
   * 1. Activa el indicador de carga
   * 2. Llama al API
   * 3. Almacena los parámetros
   * 4. Aplica los filtros actuales
   */
  cargarParametros() {
    this.cargando.set(true);
    
    this.configService.obtenerParametros().subscribe({
      next: (response) => {
        if (response.success) {
          this.parametros.set(response.data);
          this.aplicarFiltros();
        }
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar parámetros:', error);
        this.mostrarMensaje('error', 'Error al cargar los parámetros del sistema');
        this.cargando.set(false);
      }
    });
  }

  /**
   * MÉTODO: aplicarFiltros
   * Propósito: Filtrar parámetros según la categoría seleccionada
   * 
   * Lógica:
   * - Si categoría = 'todas' → Mostrar todos
   * - Si categoría específica → Filtrar solo esa categoría
   */
  aplicarFiltros() {
    const categoria = this.categoriaSeleccionada();
    
    if (categoria === 'todas') {
      this.parametrosFiltrados.set(this.parametros());
    } else {
      const filtrados = this.parametros().filter(p => p.categoria === categoria);
      this.parametrosFiltrados.set(filtrados);
    }
  }

  /**
   * MÉTODO: cambiarCategoria
   * Propósito: Cambiar la categoría de filtro
   * 
   * @param categoria - Nueva categoría a filtrar
   */
  cambiarCategoria(categoria: string) {
    this.categoriaSeleccionada.set(categoria);
    this.aplicarFiltros();
  }

  /**
   * MÉTODO: iniciarEdicion
   * Propósito: Entrar en modo de edición para un parámetro
   * 
   * @param parametro - Parámetro a editar
   * 
   * Acción:
   * 1. Guarda el parámetro en edición
   * 2. Copia el valor actual a valorTemporal
   */
  iniciarEdicion(parametro: Parametro) {
    if (!parametro.es_editable) return;
    
    this.parametroEditando.set(parametro);
    this.valorTemporal.set(parametro.valor);
  }

  /**
   * MÉTODO: cancelarEdicion
   * Propósito: Cancelar la edición sin guardar cambios
   */
  cancelarEdicion() {
    this.parametroEditando.set(null);
    this.valorTemporal.set('');
  }

  /**
   * MÉTODO: guardarParametro
   * Propósito: Guardar el valor editado en la base de datos
   * 
   * Proceso:
   * 1. Valida que haya un valor
   * 2. Llama al API para actualizar
   * 3. Actualiza la lista local
   * 4. Muestra mensaje de éxito/error
   */
  guardarParametro() {
    const parametro = this.parametroEditando();
    const nuevoValor = this.valorTemporal();
    
    if (!parametro || !nuevoValor) return;
    
    this.cargando.set(true);
    
    this.configService.actualizarParametro(parametro.id, nuevoValor).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar el parámetro en la lista local
          const parametrosActualizados = this.parametros().map(p => 
            p.id === parametro.id ? { ...p, valor: nuevoValor } : p
          );
          this.parametros.set(parametrosActualizados);
          this.aplicarFiltros();
          
          this.mostrarMensaje('success', `${parametro.nombre} actualizado correctamente`);
          this.cancelarEdicion();
        }
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al guardar parámetro:', error);
        this.mostrarMensaje('error', 'Error al guardar el parámetro');
        this.cargando.set(false);
      }
    });
  }

  /**
   * MÉTODO: mostrarMensaje
   * Propósito: Mostrar un mensaje temporal al usuario
   * 
   * @param tipo - Tipo de mensaje: 'success' o 'error'
   * @param texto - Texto del mensaje
   * 
   * El mensaje se oculta automáticamente después de 3 segundos
   */
  mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    this.mensaje.set({ tipo, texto });
    
    setTimeout(() => {
      this.mensaje.set(null);
    }, 3000);
  }

  /**
   * MÉTODO: obtenerIconoCategoria
   * Propósito: Obtener el icono de Material Icons según la categoría
   * 
   * @param categoria - Categoría del parámetro
   * @returns Nombre del icono de Material Icons
   */
  obtenerIconoCategoria(categoria: string): string {
    const iconos: { [key: string]: string } = {
      'laboral': 'groups',
      'financiero': 'account_balance',
      'tributario': 'receipt_long'
    };
    return iconos[categoria] || 'settings';
  }

  /**
   * MÉTODO: obtenerColorCategoria
   * Propósito: Obtener el color según la categoría
   * 
   * @param categoria - Categoría del parámetro
   * @returns Color en formato hexadecimal
   */
  obtenerColorCategoria(categoria: string): string {
    const colores: { [key: string]: string } = {
      'laboral': '#7C3AED',      // Púrpura
      'financiero': '#2563EB',   // Azul
      'tributario': '#10B981'    // Verde
    };
    return colores[categoria] || '#718096';
  }

  /**
   * MÉTODO: formatearValor
   * Propósito: Formatear el valor para mostrarlo de forma legible
   * 
   * @param parametro - Parámetro a formatear
   * @returns Valor formateado según el tipo
   * 
   * Ejemplos:
   * - number → 3,300
   * - boolean → Sí/No
   * - text → Texto normal
   */
  formatearValor(parametro: Parametro): string {
    if (parametro.tipo === 'number') {
      const numero = parseFloat(parametro.valor);
      return isNaN(numero) ? parametro.valor : numero.toLocaleString('es-BO');
    }
    
    if (parametro.tipo === 'boolean') {
      return parametro.valor === 'true' ? 'Sí' : 'No';
    }
    
    return parametro.valor;
  }
}
