const express = require('express');
const router = express.Router();
const { getMyDashboard, updateWorkoutProgress } = require('../controllers/memberController'); // 👈 Yahan add kiya
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getMyDashboard);
router.post('/update-progress', protect, updateWorkoutProgress);

module.exports = router;