const express = require('express');
const router = express.Router();
const { getGymToken, verifyScan } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/gym-token', getGymToken); // Publicly accessible for the gym display
router.post('/verify-scan', protect, verifyScan);

module.exports = router;