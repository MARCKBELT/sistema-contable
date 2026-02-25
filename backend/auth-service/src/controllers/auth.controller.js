const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Login de usuario
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const userResult = await pool.query(
      'SELECT * FROM auth.usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const usuario = userResult.rows[0];

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, usuario.password);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Obtener empresas del usuario
    const empresasResult = await pool.query(`
      SELECT 
        e.id, 
        e.razon_social, 
        e.nombre_comercial, 
        e.nit, 
        e.actividad_economica,
        ue.rol_en_empresa,
        ue.acceso_total
      FROM auth.empresas e
      INNER JOIN auth.usuarios_empresas ue ON e.id = ue.empresa_id
      WHERE ue.usuario_id = $1 AND e.activa = true
      ORDER BY e.razon_social
    `, [usuario.id]);

    if (empresasResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene acceso a ninguna empresa'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        empresas: empresasResult.rows.map(e => e.id)
      },
      process.env.JWT_SECRET || 'contable_jwt_secret_2026_multiempresa_bolivia',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        },
        empresas: empresasResult.rows,
        empresaActiva: empresasResult.rows[0] // Primera empresa por defecto
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
};

/**
 * Verificar token
 */
const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'contable_jwt_secret_2026_multiempresa_bolivia'
    );

    res.json({
      success: true,
      data: decoded
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

/**
 * Obtener información del usuario actual
 */
const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'contable_jwt_secret_2026_multiempresa_bolivia'
    );

    const userResult = await pool.query(
      'SELECT id, nombre, email, rol FROM auth.usuarios WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener empresas
    const empresasResult = await pool.query(`
      SELECT 
        e.id, 
        e.razon_social, 
        e.nombre_comercial, 
        e.nit, 
        e.actividad_economica
      FROM auth.empresas e
      INNER JOIN auth.usuarios_empresas ue ON e.id = ue.empresa_id
      WHERE ue.usuario_id = $1 AND e.activa = true
    `, [decoded.id]);

    res.json({
      success: true,
      data: {
        usuario: userResult.rows[0],
        empresas: empresasResult.rows
      }
    });

  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
};

module.exports = {
  login,
  verifyToken,
  me
};
