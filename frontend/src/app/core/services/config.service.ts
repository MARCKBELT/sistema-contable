import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * INTERFAZ: Define la estructura de un parámetro del sistema
 * 
 * Propósito: Asegurar que todos los parámetros tengan la misma estructura
 * Ejemplo: { codigo: 'SALARIO_MINIMO_NACIONAL', valor: '3300', tipo: 'number' }
 */
export interface Parametro {
  id: string;              // UUID único del parámetro
  codigo: string;          // Código identificador (ej: SALARIO_MINIMO_NACIONAL)
  nombre: string;          // Nombre legible (ej: Salario Mínimo Nacional)
  valor: string;           // Valor actual del parámetro
  tipo: string;            // Tipo de dato: number, text, boolean, date
  categoria: string;       // Categoría: laboral, financiero, tributario
  descripcion?: string;    // Descripción opcional
  es_editable: boolean;    // Si se puede editar o no
}

/**
 * SERVICIO: ConfigService
 * 
 * Propósito: Gestionar la comunicación con el API de configuración
 * Funciones principales:
 * 1. Obtener todos los parámetros del sistema
 * 2. Filtrar parámetros por categoría (laboral, financiero, etc.)
 * 3. Obtener un parámetro específico por su código
 * 4. Actualizar valores de parámetros
 */
@Injectable({
  providedIn: 'root'  // Disponible en toda la aplicación
})
export class ConfigService {
  // URL base del API de configuración
  private apiUrl = `${environment.apiUrl}/config`;
  
  /**
   * SIGNAL: Estado reactivo de parámetros
   * 
   * Propósito: Almacenar los parámetros en memoria y notificar automáticamente
   *            cuando cambian, para que los componentes se actualicen
   */
  parametros = signal<Parametro[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * MÉTODO: obtenerParametros
   * 
   * Propósito: Consultar parámetros desde el backend
   * 
   * @param categoria - Opcional. Filtra por categoría (laboral, financiero, tributario)
   * @returns Observable con la respuesta del servidor
   * 
   * Ejemplo de uso:
   *   this.configService.obtenerParametros('laboral').subscribe(response => {
   *     console.log(response.data); // Array de parámetros laborales
   *   });
   */
  obtenerParametros(categoria?: string): Observable<{ success: boolean; data: Parametro[] }> {
    const url = categoria 
      ? `${this.apiUrl}/parametros?categoria=${categoria}` 
      : `${this.apiUrl}/parametros`;
    
    return this.http.get<{ success: boolean; data: Parametro[] }>(url);
  }

  /**
   * MÉTODO: obtenerParametroPorCodigo
   * 
   * Propósito: Obtener un parámetro específico por su código
   * 
   * @param codigo - Código del parámetro (ej: 'SALARIO_MINIMO_NACIONAL')
   * @returns Observable con el parámetro solicitado
   * 
   * Ejemplo de uso:
   *   this.configService.obtenerParametroPorCodigo('SALARIO_MINIMO_NACIONAL')
   *     .subscribe(response => {
   *       console.log(response.data.valor); // "3300"
   *     });
   */
  obtenerParametroPorCodigo(codigo: string): Observable<{ success: boolean; data: Parametro }> {
    return this.http.get<{ success: boolean; data: Parametro }>(
      `${this.apiUrl}/parametros/${codigo}`
    );
  }

  /**
   * MÉTODO: actualizarParametro
   * 
   * Propósito: Actualizar el valor de un parámetro
   * 
   * @param id - UUID del parámetro a actualizar
   * @param valor - Nuevo valor para el parámetro
   * @returns Observable con el resultado de la actualización
   * 
   * Ejemplo de uso:
   *   this.configService.actualizarParametro(parametroId, '3500')
   *     .subscribe(response => {
   *       console.log(response.message); // "Parámetro actualizado exitosamente"
   *     });
   */
  actualizarParametro(id: string, valor: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.apiUrl}/parametros/${id}`, 
      { valor }
    );
  }
}
