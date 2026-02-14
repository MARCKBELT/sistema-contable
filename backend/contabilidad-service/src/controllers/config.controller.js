const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'contable_db',
  user: process.env.POSTGRES_USER || 'contable_user',
  password: process.env.POSTGRES_PASSWORD,
  max: 20
});

// Obtener todos los parámetros o por categoría
exports.obtenerParametros = async (req, res) => {
  try {
    const { categoria } = req.query;
    
    let query = 'SELECT * FROM parametros_sistema WHERE empresa_id = $1';
    const params = ['11111111-1111-1111-1111-111111111111'];
    
    if (categoria) {
      query += ' AND categoria = $2';
      params.push(categoria);
    }
    
    query += ' ORDER BY categoria, nombre';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener parámetros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener parámetros del sistema'
    });
  }
};

// Obtener parámetro por código
exports.obtenerParametroPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM parametros_sistema WHERE codigo = $1 AND empresa_id = $2',
      [codigo, '11111111-1111-1111-1111-111111111111']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parámetro no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener parámetro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener parámetro'
    });
  }
};

// Actualizar parámetro
exports.actualizarParametro = async (req, res) => {
  try {
    const { id } = req.params;
    const { valor } = req.body;
    
    if (!valor) {
      return res.status(400).json({
        success: false,
        message: 'El valor es requerido'
      });
    }
    
    const result = await pool.query(
      'UPDATE parametros_sistema SET valor = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [valor, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parámetro no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Parámetro actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar parámetro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar parámetro'
    });
  }
};
