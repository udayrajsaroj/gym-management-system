const express = require('express');
const router = express.Router();
const { sendOTP, verifyAndRegister, login } = require('../controllers/authController');

// Naye OTP wale routes
router.post('/send-otp', sendOTP);
router.post('/verify-and-register', verifyAndRegister);

// Purana Login route
router.post('/login', login);

module.exports = router;