const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANTE: CORS antes de parsear body
app.use(cors());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Proxy a Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  logLevel: 'debug',
  timeout: 30000,
  proxyTimeout: 30000
}));

// Proxy a Contabilidad Service
app.use('/api/contabilidad', createProxyMiddleware({
  target: 'http://contabilidad-service:3002',
  changeOrigin: true
}));

// Proxy a Config
app.use('/api/config', createProxyMiddleware({
  target: 'http://contabilidad-service:3002',
  changeOrigin: true
}));

// Proxy a Nóminas Service
app.use('/api/nominas', createProxyMiddleware({
  target: 'http://nominas-service:3003',
  changeOrigin: true
}));

// Proxy a Facturación Service
app.use('/api/facturacion', createProxyMiddleware({
  target: 'http://facturacion-service:3004',
  changeOrigin: true
}));

app.listen(PORT, () => {
  console.log(`🚪 API Gateway corriendo en puerto ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando...');
  process.exit(0);
});
