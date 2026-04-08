const express = require('express');
const router = express.Router();

// Sirf 'login' ko import karein, baaki sab hata dein
const { login } = require('../controllers/authController');

// Login route
router.post('/login', login);

module.exports = router;