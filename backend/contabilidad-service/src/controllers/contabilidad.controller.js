const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'contable_db',
  user: process.env.POSTGRES_USER || 'contable_user',
  password: process.env.POSTGRES_PASSWORD,
  max: 20
});

/**
 * CONTROLADOR: Contabilidad
 * 
 * Propósito: Gestionar el Plan de Cuentas y Comprobantes Contables
 * 
 * Endpoints:
 * - GET /api/contabilidad/cuentas - Listar cuentas
 * - GET /api/contabilidad/cuentas/:id - Obtener una cuenta
 * - POST /api/contabilidad/comprobantes - Crear comprobante
 * - GET /api/contabilidad/comprobantes - Listar comprobantes
 * - GET /api/contabilidad/libro-diario - Libro Diario
 * - GET /api/contabilidad/libro-mayor/:cuenta_id - Libro Mayor por cuenta
 */

/**
 * OBTENER TODAS LAS CUENTAS
 * Propósito: Listar el Plan de Cuentas completo o filtrado
 */
exports.obtenerCuentas = async (req, res) => {
  try {
    const { tipo, es_imputable, nivel } = req.query;
    
    let query = 'SELECT * FROM cuentas_contables WHERE empresa_id = $1 AND activo = true';
    const params = ['11111111-1111-1111-1111-111111111111'];
    
    if (tipo) {
      query += ' AND tipo = $' + (params.length + 1);
      params.push(tipo);
    }
    
    if (es_imputable !== undefined) {
      query += ' AND es_imputable = $' + (params.length + 1);
      params.push(es_imputable === 'true');
    }
    
    if (nivel) {
      query += ' AND nivel = $' + (params.length + 1);
      params.push(parseInt(nivel));
    }
    
    query += ' ORDER BY codigo';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas contables'
    });
  }
};

/**
 * OBTENER UNA CUENTA POR ID
 */
exports.obtenerCuentaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM cuentas_contables WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuenta'
    });
  }
};

/**
 * CREAR COMPROBANTE
 * Propósito: Registrar un asiento contable con validación de partida doble
 */
exports.crearComprobante = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tipo, fecha, glosa, detalles } = req.body;
    
    // Validaciones
    if (!tipo || !fecha || !glosa || !detalles || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }
    
    // Calcular totales
    let totalDebe = 0;
    let totalHaber = 0;
    
    detalles.forEach(d => {
      totalDebe += parseFloat(d.debe || 0);
      totalHaber += parseFloat(d.haber || 0);
    });
    
    // Validar partida doble
    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'El comprobante no está cuadrado. Debe = Haber'
      });
    }
    
    await client.query('BEGIN');
    
    // Generar número de comprobante
    const numeroResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(numero_comprobante FROM '[0-9]+') AS INTEGER)), 0) + 1 as siguiente
       FROM comprobantes WHERE empresa_id = $1`,
      ['11111111-1111-1111-1111-111111111111']
    );
    const numeroComprobante = numeroResult.rows[0].siguiente.toString().padStart(6, '0');
    
    // Insertar comprobante
    const comprobanteResult = await client.query(
      `INSERT INTO comprobantes 
       (empresa_id, numero_comprobante, tipo, fecha, glosa, total_debe, total_haber, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'aprobado')
       RETURNING *`,
      ['11111111-1111-1111-1111-111111111111', numeroComprobante, tipo, fecha, glosa, totalDebe, totalHaber]
    );
    
    const comprobante = comprobanteResult.rows[0];
    
    // Insertar detalles
    for (let i = 0; i < detalles.length; i++) {
      const detalle = detalles[i];
      await client.query(
        `INSERT INTO detalle_comprobantes 
         (comprobante_id, cuenta_id, glosa, debe, haber, orden)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [comprobante.id, detalle.cuenta_id, detalle.glosa, detalle.debe || 0, detalle.haber || 0, i + 1]
      );
      
      // Actualizar saldo de la cuenta
      const debe = parseFloat(detalle.debe || 0);
      const haber = parseFloat(detalle.haber || 0);
      
      await client.query(
        `UPDATE cuentas_contables 
         SET saldo_actual = saldo_actual + $1
         WHERE id = $2`,
        [debe - haber, detalle.cuenta_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Comprobante creado exitosamente',
      data: comprobante
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear comprobante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear comprobante'
    });
  } finally {
    client.release();
  }
};

/**
 * LISTAR COMPROBANTES
 */
exports.obtenerComprobantes = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo } = req.query;
    
    let query = `
      SELECT c.*, u.nombres || ' ' || u.apellidos as usuario
      FROM comprobantes c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.empresa_id = $1
    `;
    const params = ['11111111-1111-1111-1111-111111111111'];
    
    if (fecha_desde) {
      query += ' AND c.fecha >= $' + (params.length + 1);
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      query += ' AND c.fecha <= $' + (params.length + 1);
      params.push(fecha_hasta);
    }
    
    if (tipo) {
      query += ' AND c.tipo = $' + (params.length + 1);
      params.push(tipo);
    }
    
    query += ' ORDER BY c.fecha DESC, c.numero_comprobante DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener comprobantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comprobantes'
    });
  }
};

/**
 * LIBRO DIARIO
 * Propósito: Mostrar todos los movimientos en orden cronológico
 */
exports.obtenerLibroDiario = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    
    let query = `
      SELECT 
        c.fecha,
        c.numero_comprobante,
        c.tipo,
        c.glosa as glosa_comprobante,
        d.glosa as glosa_detalle,
        cu.codigo,
        cu.nombre as cuenta,
        d.debe,
        d.haber
      FROM comprobantes c
      INNER JOIN detalle_comprobantes d ON c.id = d.comprobante_id
      INNER JOIN cuentas_contables cu ON d.cuenta_id = cu.id
      WHERE c.empresa_id = $1 AND c.estado = 'aprobado'
    `;
    const params = ['11111111-1111-1111-1111-111111111111'];
    
    if (fecha_desde) {
      query += ' AND c.fecha >= $' + (params.length + 1);
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      query += ' AND c.fecha <= $' + (params.length + 1);
      params.push(fecha_hasta);
    }
    
    query += ' ORDER BY c.fecha, c.numero_comprobante, d.orden';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener libro diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener libro diario'
    });
  }
};

/**
 * LIBRO MAYOR POR CUENTA
 * Propósito: Mostrar todos los movimientos de una cuenta específica
 */
exports.obtenerLibroMayor = async (req, res) => {
  try {
    const { cuenta_id } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;
    
    // Obtener información de la cuenta
    const cuentaResult = await pool.query(
      'SELECT * FROM cuentas_contables WHERE id = $1',
      [cuenta_id]
    );
    
    if (cuentaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }
    
    const cuenta = cuentaResult.rows[0];
    
    // Obtener movimientos
    let query = `
      SELECT 
        c.fecha,
        c.numero_comprobante,
        c.tipo,
        d.glosa,
        d.debe,
        d.haber
      FROM detalle_comprobantes d
      INNER JOIN comprobantes c ON d.comprobante_id = c.id
      WHERE d.cuenta_id = $1 AND c.estado = 'aprobado'
    `;
    const params = [cuenta_id];
    
    if (fecha_desde) {
      query += ' AND c.fecha >= $' + (params.length + 1);
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      query += ' AND c.fecha <= $' + (params.length + 1);
      params.push(fecha_hasta);
    }
    
    query += ' ORDER BY c.fecha, c.numero_comprobante';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: {
        cuenta: cuenta,
        movimientos: result.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener libro mayor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener libro mayor'
    });
  }
};
