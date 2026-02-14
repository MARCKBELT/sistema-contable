require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'nominas-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Rutas placeholder
app.get('/api/nominas/empleados', (req, res) => {
  res.json({ message: 'Endpoint de empleados' });
});

app.get('/api/nominas/planillas', (req, res) => {
  res.json({ message: 'Endpoint de planillas' });
});

app.get('/api/nominas/configuracion', (req, res) => {
  res.json({ 
    salario_minimo_nacional: parseFloat(process.env.SALARIO_MINIMO_NACIONAL) || 2750,
    aporte_laboral_afp: 12.71,
    aporte_patronal: 17.21
  });
});

app.listen(PORT, () => {
  console.log('👥 Nóminas Service corriendo en puerto', PORT);
});
