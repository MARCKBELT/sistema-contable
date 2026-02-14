const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const pool = require('../config/database');

// Esquemas de validación
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email no es válido',
    'any.required': 'El email es obligatorio'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es obligatoria'
  })
});

const registerSchema = Joi.object({
  empresa_id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  nombres: Joi.string().required(),
  apellidos: Joi.string().required(),
  ci: Joi.string().optional(),
  rol: Joi.string().valid('super_admin', 'admin', 'contador', 'auditor', 'usuario').required(),
  cargo: Joi.string().optional()
});

// LOGIN
exports.login = async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    // Buscar usuario
    const result = await pool.query(
      `SELECT u.*, e.razon_social as empresa_nombre, e.nit as empresa_nit
       FROM usuarios u
       LEFT JOIN empresas e ON u.empresa_id = e.id
       WHERE u.email = $1 AND u.activo = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        empresa_id: user.empresa_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Actualizar último acceso
    await pool.query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          rol: user.rol,
          cargo: user.cargo,
          empresa: {
            id: user.empresa_id,
            nombre: user.empresa_nombre,
            nit: user.empresa_nit
          }
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// REGISTER
exports.register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Validar datos
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { empresa_id, email, password, nombres, apellidos, ci, rol, cargo } = value;

    // Verificar si el email ya existe
    const existingUser = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usuario
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO usuarios (empresa_id, email, password_hash, nombres, apellidos, ci, rol, cargo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, nombres, apellidos, rol, cargo`,
      [empresa_id, email, passwordHash, nombres, apellidos, ci, rol, cargo]
    );

    await client.query('COMMIT');

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: newUser
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  } finally {
    client.release();
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT u.id, u.email, u.nombres, u.apellidos, u.ci, u.telefono, u.rol, u.cargo,
              u.foto_url, u.activo, u.ultimo_acceso,
              e.id as empresa_id, e.razon_social as empresa_nombre, e.nit as empresa_nit
       FROM usuarios u
       LEFT JOIN empresas e ON u.empresa_id = e.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          ci: user.ci,
          telefono: user.telefono,
          rol: user.rol,
          cargo: user.cargo,
          foto_url: user.foto_url,
          activo: user.activo,
          ultimo_acceso: user.ultimo_acceso,
          empresa: {
            id: user.empresa_id,
            nombre: user.empresa_nombre,
            nit: user.empresa_nit
          }
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    // Aquí podrías invalidar el token en Redis si implementas blacklist
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Validar que todos los campos estén presentes
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña actual y nueva contraseña son requeridos'
      });
    }

    // Buscar usuario
    const result = await client.query(
      'SELECT id, email, password_hash FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await client.query('BEGIN');
    
    await client.query(
      'UPDATE usuarios SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, user.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  } finally {
    client.release();
  }
};
