const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  addUser, 
  updateUser, 
  deleteUser, 
  getExpiringMembers,
  // 👇 NAYE FUNCTIONS IMPORT KIYE 👇
  getAttendanceReport,
  getMemberStats 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Existing User Management Routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/add-user', protect, authorize('admin'), addUser);
router.put('/update-user/:id', protect, authorize('admin'), updateUser);
router.delete('/delete-user/:id', protect, authorize('admin'), deleteUser);
router.get('/alerts', protect, authorize('admin'), getExpiringMembers);

// --- NEW ATTENDANCE ANALYTICS ROUTES ---

/**
 * @route   GET /api/admin/attendance-report
 * @desc    Get all attendance logs for all members
 */
router.get('/attendance-report', protect, authorize('admin'), getAttendanceReport);

/**
 * @route   GET /api/admin/member-stats/:id
 * @desc    Get specific member's present/absent analytics
 */
router.get('/member-stats/:id', protect, authorize('admin'), getMemberStats);

module.exports = router;