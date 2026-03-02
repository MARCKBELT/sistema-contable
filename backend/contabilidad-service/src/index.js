const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'contable_db',
  user: process.env.DB_USER || 'contable_user',
  password: process.env.DB_PASSWORD || 'contable_pass_2026',
});

app.get('/health', (req, res) => {
  res.json({ service: 'contabilidad-service', status: 'UP' });
});

// ==================== CONFIGURACIÓN ====================

// Obtener todos los parámetros
app.get('/api/config/parametros', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM shared.parametros_sistema 
      ORDER BY categoria, nombre
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener parámetros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener parámetros',
      error: error.message
    });
  }
});

// Actualizar parámetro
app.put('/api/config/parametros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { valor } = req.body;

    const result = await pool.query(`
      UPDATE shared.parametros_sistema 
      SET valor = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND editable = true
      RETURNING *
    `, [valor, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parámetro no encontrado o no es editable'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Parámetro actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar parámetro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar parámetro',
      error: error.message
    });
  }
});

// ==================== PUCT ====================

// Obtener todas las cuentas de la empresa
app.get('/api/contabilidad/cuentas', async (req, res) => {
  try {
    const empresaId = req.headers['x-empresa-id'];
    
    if (!empresaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de empresa no proporcionado'
      });
    }

    const result = await pool.query(`
      SELECT * FROM contabilidad.cuentas_contables 
      WHERE empresa_id = $1
      ORDER BY codigo
    `, [empresaId]);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas',
      error: error.message
    });
  }
});

// Crear nueva cuenta
app.post('/api/contabilidad/cuentas', async (req, res) => {
  try {
    const empresaId = req.headers['x-empresa-id'];
    const { codigo, nombre, nivel, tipo, naturaleza, es_imputable } = req.body;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de empresa no proporcionado'
      });
    }

    // Verificar que no exista la cuenta
    const existe = await pool.query(
      'SELECT id FROM contabilidad.cuentas_contables WHERE empresa_id = $1 AND codigo = $2',
      [empresaId, codigo]
    );

    if (existe.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta con ese código'
      });
    }

    const result = await pool.query(`
      INSERT INTO contabilidad.cuentas_contables 
      (empresa_id, codigo, nombre, nivel, tipo, naturaleza, es_imputable)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [empresaId, codigo, nombre, nivel, tipo, naturaleza, es_imputable || false]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Cuenta creada correctamente'
    });
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cuenta',
      error: error.message
    });
  }
});

// Actualizar cuenta
app.put('/api/contabilidad/cuentas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.headers['x-empresa-id'];
    const { nombre, es_imputable } = req.body;

    const result = await pool.query(`
      UPDATE contabilidad.cuentas_contables 
      SET nombre = $1, es_imputable = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND empresa_id = $4
      RETURNING *
    `, [nombre, es_imputable, id, empresaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Cuenta actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cuenta',
      error: error.message
    });
  }
});

// Eliminar cuenta
app.delete('/api/contabilidad/cuentas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.headers['x-empresa-id'];

    // Verificar que no tenga movimientos
    const tieneMovimientos = await pool.query(`
      SELECT COUNT(*) as total 
      FROM contabilidad.detalle_comprobantes 
      WHERE cuenta_id = $1
    `, [id]);

    if (parseInt(tieneMovimientos.rows[0].total) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una cuenta con movimientos'
      });
    }

    const result = await pool.query(
      'DELETE FROM contabilidad.cuentas_contables WHERE id = $1 AND empresa_id = $2 RETURNING *',
      [id, empresaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cuenta eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cuenta',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`📊 Contabilidad Service corriendo en puerto ${PORT}`);
});

// ==================== IMPORTACIÓN PUCT ====================

const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: '/tmp/' });

// Importar PUCT desde CSV
app.post('/api/contabilidad/cuentas/importar', upload.single('file'), async (req, res) => {
  try {
    const empresaId = req.headers['x-empresa-id'];
    
    if (!empresaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de empresa no proporcionado'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo'
      });
    }

    const cuentas = [];
    let errores = [];
    let importadas = 0;
    let duplicadas = 0;

    // Leer CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          cuentas.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insertar cuentas
    for (const cuenta of cuentas) {
      try {
        // Verificar si ya existe
        const existe = await pool.query(
          'SELECT id FROM contabilidad.cuentas_contables WHERE empresa_id = $1 AND codigo = $2',
          [empresaId, cuenta.codigo]
        );

        if (existe.rows.length > 0) {
          duplicadas++;
          continue;
        }

        // Insertar cuenta
        await pool.query(`
          INSERT INTO contabilidad.cuentas_contables 
          (empresa_id, codigo, nombre, nivel, tipo, naturaleza, es_imputable,
           aplica_comercial, aplica_servicios, aplica_transporte, aplica_industrial,
           aplica_petrolera, aplica_construccion, aplica_agropecuaria, aplica_minera)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          empresaId,
          cuenta.codigo,
          cuenta.nombre,
          parseInt(cuenta.nivel),
          cuenta.tipo,
          cuenta.naturaleza,
          cuenta.es_imputable === 'true',
          cuenta.aplica_comercial === 'true',
          cuenta.aplica_servicios === 'true',
          cuenta.aplica_transporte === 'true',
          cuenta.aplica_industrial === 'true',
          cuenta.aplica_petrolera === 'true',
          cuenta.aplica_construccion === 'true',
          cuenta.aplica_agropecuaria === 'true',
          cuenta.aplica_minera === 'true'
        ]);

        importadas++;
      } catch (error) {
        errores.push(`Error en cuenta ${cuenta.codigo}: ${error.message}`);
      }
    }

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Importación completada',
      data: {
        total: cuentas.length,
        importadas,
        duplicadas,
        errores: errores.length
      },
      errores: errores.slice(0, 10) // Solo primeros 10 errores
    });

  } catch (error) {
    console.error('Error en importación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al importar PUCT',
      error: error.message
    });
  }
});
