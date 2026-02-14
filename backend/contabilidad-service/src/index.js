require('dotenv').config();
const express = require('express');
const cors = require('cors');
const configRoutes = require('./routes/config.routes');

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

// Rutas de configuración
app.use('/api/config', configRoutes);

// Rutas placeholder anteriores
app.get('/api/contabilidad/plan-cuentas', (req, res) => {
  res.json({ message: 'Endpoint de plan de cuentas' });
});

app.get('/api/contabilidad/comprobantes', (req, res) => {
  res.json({ message: 'Endpoint de comprobantes' });
});

app.get('/api/contabilidad/tipos-cambio', (req, res) => {
  res.json({ 
    oficial: parseFloat(process.env.TIPO_CAMBIO_OFICIAL) || 6.96,
    referencial: parseFloat(process.env.TIPO_CAMBIO_REFERENCIAL) || 8.90,
    paralelo: parseFloat(process.env.TIPO_CAMBIO_PARALELO) || 9.60
  });
});

app.listen(PORT, () => {
  console.log('📊 Contabilidad Service corriendo en puerto', PORT);
});
