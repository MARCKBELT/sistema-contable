const express = require('express');
const router = express.Router();
const contabilidadController = require('../controllers/contabilidad.controller');

/**
 * RUTAS: Contabilidad
 * 
 * Plan de Cuentas y Comprobantes Contables
 */

// Plan de Cuentas
router.get('/cuentas', contabilidadController.obtenerCuentas);

// Comprobantes
router.post('/comprobantes', contabilidadController.crearComprobante);
router.get('/comprobantes', contabilidadController.obtenerComprobantes);

module.exports = router;
