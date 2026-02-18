require('dotenv').config();
const express = require('express');
const cors = require('cors');
const configRoutes = require('./routes/config.routes');
const contabilidadRoutes = require('./routes/contabilidad.routes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'contabilidad-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Rutas (SIN el prefijo /api porque el Gateway lo agrega)
app.use('/api/config', configRoutes);
app.use('/api/contabilidad', contabilidadRoutes);

app.listen(PORT, () => {
  console.log('📊 Contabilidad Service corriendo en puerto', PORT);
});