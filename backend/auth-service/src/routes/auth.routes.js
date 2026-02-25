const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.get('/verify', authController.verifyToken);
router.get('/me', authController.me);

module.exports = router;
