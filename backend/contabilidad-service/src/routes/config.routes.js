const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');

// Obtener todos los parámetros (opcionalmente filtrados por categoría)
router.get('/parametros', configController.obtenerParametros);

// Obtener parámetro por código
router.get('/parametros/:codigo', configController.obtenerParametroPorCodigo);

// Actualizar parámetro
router.put('/parametros/:id', configController.actualizarParametro);

module.exports = router;
