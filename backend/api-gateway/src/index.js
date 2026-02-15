require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * MIDDLEWARES DE SEGURIDAD
 * Propósito: Proteger la aplicación con headers de seguridad y CORS
 */
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * RATE LIMITING
 * Propósito: Limitar el número de peticiones por IP para evitar abusos
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por ventana
  message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.'
});
app.use('/api/', limiter);

// Logging de peticiones
app.use(morgan('combined'));

/**
 * HEALTH CHECK
 * Propósito: Verificar que el gateway esté funcionando
 */
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * CONFIGURACIÓN DE PROXY
 * Propósito: Opciones comunes para todos los proxies
 */
const proxyOptions = {
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(503).json({ 
      error: 'Servicio no disponible',
      message: 'Por favor, intente nuevamente más tarde.'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`📤 Proxy: ${req.method} ${req.path} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`📥 Response: ${proxyRes.statusCode} from ${req.path}`);
  }
};

/**
 * PROXY: Auth Service
 * Propósito: Manejar autenticación (login, registro, perfil)
 */
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  ...proxyOptions
}));

/**
 * PROXY: Config Service (en Contabilidad)
 * Propósito: Manejar parámetros del sistema (salario mínimo, tipos de cambio, etc.)
 */
app.use('/api/config', createProxyMiddleware({
  target: process.env.CONTABILIDAD_SERVICE_URL || 'http://contabilidad-service:3002',
  ...proxyOptions
}));

/**
 * PROXY: Contabilidad Service
 * Propósito: Manejar contabilidad (plan de cuentas, comprobantes, etc.)
 */
app.use('/api/contabilidad', createProxyMiddleware({
  target: process.env.CONTABILIDAD_SERVICE_URL || 'http://contabilidad-service:3002',
  ...proxyOptions
}));

/**
 * PROXY: Nóminas Service
 * Propósito: Manejar nóminas (empleados, planillas, etc.)
 */
app.use('/api/nominas', createProxyMiddleware({
  target: process.env.NOMINAS_SERVICE_URL || 'http://nominas-service:3003',
  ...proxyOptions
}));

/**
 * PROXY: Facturación Service
 * Propósito: Manejar facturación (clientes, productos, facturas, SIAT)
 */
app.use('/api/facturacion', createProxyMiddleware({
  target: process.env.FACTURACION_SERVICE_URL || 'http://facturacion-service:3004',
  ...proxyOptions
}));

/**
 * MANEJO DE ERRORES 404
 * Propósito: Responder cuando una ruta no existe
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

/**
 * MANEJO DE ERRORES GLOBAL
 * Propósito: Capturar cualquier error no manejado
 */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error inesperado'
  });
});

/**
 * INICIAR SERVIDOR
 */
app.listen(PORT, () => {
  console.log('🚪 API Gateway corriendo en puerto', PORT);
  console.log('📍 Ambiente:', process.env.NODE_ENV || 'development');
  console.log('🔗 Auth:', process.env.AUTH_SERVICE_URL || 'http://auth-service:3001');
  console.log('🔗 Contabilidad:', process.env.CONTABILIDAD_SERVICE_URL || 'http://contabilidad-service:3002');
  console.log('🔗 Nóminas:', process.env.NOMINAS_SERVICE_URL || 'http://nominas-service:3003');
  console.log('🔗 Facturación:', process.env.FACTURACION_SERVICE_URL || 'http://facturacion-service:3004');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando...');
  process.exit(0);
});