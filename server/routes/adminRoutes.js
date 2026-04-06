const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  addUser, 
  updateUser, 
  deleteUser, 
  getExpiringMembers 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/add-user', protect, authorize('admin'), addUser);
router.put('/update-user/:id', protect, authorize('admin'), updateUser);
router.delete('/delete-user/:id', protect, authorize('admin'), deleteUser);
router.get('/alerts', protect, authorize('admin'), getExpiringMembers);

module.exports = router;