require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'facturacion-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Rutas placeholder
app.get('/api/facturacion/clientes', (req, res) => {
  res.json({ message: 'Endpoint de clientes' });
});

app.get('/api/facturacion/productos', (req, res) => {
  res.json({ message: 'Endpoint de productos' });
});

app.get('/api/facturacion/facturas', (req, res) => {
  res.json({ message: 'Endpoint de facturas' });
});

app.get('/api/facturacion/siat/config', (req, res) => {
  res.json({ 
    ambiente: process.env.SIAT_AMBIENTE || 2,
    modalidad: process.env.SIAT_MODALIDAD || 1,
    url_servicios: process.env.SIAT_URL_SERVICIOS
  });
});

app.listen(PORT, () => {
  console.log('🧾 Facturación Service corriendo en puerto', PORT);
});
