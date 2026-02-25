require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'auth-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Rutas
app.use('/api/auth', authRoutes);

// Verificar conexión a BD
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Conexión a base de datos verificada');
    app.listen(PORT, () => {
      console.log(`🔐 Auth Service corriendo en puerto ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a base de datos:', err);
    process.exit(1);
  });
