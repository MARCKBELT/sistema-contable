const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

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

app.delete('/api/contabilidad/cuentas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.headers['x-empresa-id'];

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

// ==================== IMPORTACIÓN PUCT ====================

const upload = multer({ dest: '/tmp/' });

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

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          cuentas.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    for (const cuenta of cuentas) {
      try {
        const existe = await pool.query(
          'SELECT id FROM contabilidad.cuentas_contables WHERE empresa_id = $1 AND codigo = $2',
          [empresaId, cuenta.codigo]
        );

        if (existe.rows.length > 0) {
          duplicadas++;
          continue;
        }

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
      errores: errores.slice(0, 10)
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

// ==================== COMPROBANTES ====================

// Obtener todos los comprobantes
app.get('/api/contabilidad/comprobantes', async (req, res) => {
  try {
    const empresaId = req.headers['x-empresa-id'];
    
    if (!empresaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de empresa no proporcionado'
      });
    }

    const result = await pool.query(`
      SELECT 
        id,
        (prefijo || '-' || LPAD(numero::text, 5, '0')) as numero,
        tipo,
        fecha,
        glosa,
        total_debe,
        total_haber,
        CASE 
          WHEN anulado = true THEN 'anulado'
          ELSE 'validado'
        END as estado,
        created_at
      FROM contabilidad.comprobantes 
      WHERE empresa_id = $1
      ORDER BY fecha DESC, numero DESC
    `, [empresaId]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        glosa_general: row.glosa // Mapear para el frontend
      }))
    });
  } catch (error) {
    console.error('Error al obtener comprobantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comprobantes',
      error: error.message
    });
  }
});

// Obtener siguiente número
app.get('/api/contabilidad/comprobantes/siguiente-numero/:tipo', async (req, res) => {
  try {
    const empresaId = req.headers['x-empresa-id'];
    const { tipo } = req.params;

    const tipoUpper = tipo.toUpperCase();
    const prefijo = tipoUpper.substring(0, 3);

    const result = await pool.query(`
      SELECT numero FROM contabilidad.comprobantes 
      WHERE empresa_id = $1 AND tipo = $2
      ORDER BY numero DESC 
      LIMIT 1
    `, [empresaId, tipoUpper]);

    let siguienteNumero;
    if (result.rows.length === 0) {
      siguienteNumero = `${prefijo}-00001`;
    } else {
      const ultimoNumero = result.rows[0].numero;
      const siguiente = ultimoNumero + 1;
      siguienteNumero = `${prefijo}-${String(siguiente).padStart(5, '0')}`;
    }

    res.json({
      success: true,
      data: { numero: siguienteNumero }
    });
  } catch (error) {
    console.error('Error al obtener siguiente número:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener siguiente número',
      error: error.message
    });
  }
});

// Crear comprobante
app.post('/api/contabilidad/comprobantes', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const empresaId = req.headers['x-empresa-id'];
    const { numero, tipo, fecha, glosa_general: glosa, detalles } = req.body;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de empresa no proporcionado'
      });
    }

    // Separar prefijo y número
    const partes = numero.split('-');
    const prefijo = partes[0];
    const numeroInt = parseInt(partes[1]);

    // Validar balance
    const totalDebe = detalles.reduce((sum, d) => sum + parseFloat(d.debe || 0), 0);
    const totalHaber = detalles.reduce((sum, d) => sum + parseFloat(d.haber || 0), 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Comprobante desbalanceado: Debe=${totalDebe}, Haber=${totalHaber}`
      });
    }

    await client.query('BEGIN');

    // Insertar comprobante
    const compResult = await client.query(`
      INSERT INTO contabilidad.comprobantes 
      (empresa_id, numero, prefijo, tipo, fecha, glosa, total_debe, total_haber, anulado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
      RETURNING *
    `, [empresaId, numeroInt, prefijo, tipo.toUpperCase(), fecha, glosa, totalDebe, totalHaber]);

    const comprobanteId = compResult.rows[0].id;

    // Insertar detalles
        for (const detalle of detalles) {
      await client.query(`
        INSERT INTO contabilidad.detalle_comprobantes 
        (comprobante_id, cuenta_id, debe, haber)
        VALUES ($1, $2, $3, $4)
      `, [comprobanteId, detalle.cuenta_id, detalle.debe || 0, detalle.haber || 0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: compResult.rows[0],
      message: 'Comprobante creado correctamente'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear comprobante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear comprobante',
      error: error.message
    });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`📊 Contabilidad Service corriendo en puerto ${PORT}`);
});
