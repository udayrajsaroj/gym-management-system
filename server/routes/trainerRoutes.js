const express = require('express');
const router = express.Router();
// ADD getMemberWorkout TO THIS LIST 👇
const { getMyClients, assignWorkout, getMemberWorkout } = require('../controllers/trainerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-clients', protect, authorize('trainer'), getMyClients);
router.get('/member-workout/:memberId', protect, authorize('trainer'), getMemberWorkout);
router.post('/assign-workout', protect, authorize('trainer'), assignWorkout);

module.exports = router;