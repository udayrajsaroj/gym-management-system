const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Workout = require('../models/Workout');

exports.getMyDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get Member & Workout
    const member = await User.findById(req.user.id).populate('assignedTrainer', 'name');
    const workout = await Workout.findOne({ memberId: req.user.id });

    // 2. CHECK ATTENDANCE STATUS FOR TODAY
    const attendance = await Attendance.findOne({
      memberId: req.user.id,
      date: { $gte: today }
    });

    res.json({
      member,
      workout: workout || { exercises: [], instructions: "No workout assigned yet." },
      // Send attendance info to frontend
      attendanceStatus: !!attendance, 
      checkInTime: attendance ? attendance.checkInTime : null
    });
  } catch (err) {
    res.status(500).json({ message: "Error loading dashboard" });
  }
};