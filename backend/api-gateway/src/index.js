const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use(morgan('combined'));

// ============================================
// IMPORTANTE: NO usar body-parser antes del proxy
// El proxy necesita recibir el raw stream
// ============================================

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.'
});
app.use('/api/', limiter);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// CONFIGURACIÓN DE PROXY
// ============================================
const createProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    logLevel: 'info',
    // CRÍTICO: Preservar el body original
    parseReqBody: false,
    onError: (err, req, res) => {
      console.error('❌ Proxy error:', err.message);
      res.status(503).json({ 
        error: 'Servicio no disponible',
        message: 'Por favor, intente nuevamente más tarde.'
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`📤 Proxy: ${req.method} ${req.path} -> ${target}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`📥 Response: ${proxyRes.statusCode} from ${req.path}`);
    }
  });
};

// ============================================
// RUTAS DE PROXY
// ============================================

// Auth Service
app.use('/api/auth', createProxy(process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'));

// Contabilidad Service  
app.use('/api/contabilidad', createProxy(process.env.CONTABILIDAD_SERVICE_URL || 'http://contabilidad-service:3002'));

// Nóminas Service
app.use('/api/nominas', createProxy(process.env.NOMINAS_SERVICE_URL || 'http://nominas-service:3003'));

// Facturación Service
app.use('/api/facturacion', createProxy(process.env.FACTURACION_SERVICE_URL || 'http://facturacion-service:3004'));

// ============================================
// MANEJO DE ERRORES 404
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error inesperado'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log('🚪 API Gateway corriendo en puerto', PORT);
  console.log('📍 Ambiente:', process.env.NODE_ENV || 'development');
  console.log('🔗 Auth Service:', process.env.AUTH_SERVICE_URL || 'http://auth-service:3001');
  console.log('🔗 Contabilidad:', process.env.CONTABILIDAD_SERVICE_URL || 'http://contabilidad-service:3002');
  console.log('🔗 Nóminas:', process.env.NOMINAS_SERVICE_URL || 'http://nominas-service:3003');
  console.log('🔗 Facturación:', process.env.FACTURACION_SERVICE_URL || 'http://facturacion-service:3004');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando...');
  process.exit(0);
});