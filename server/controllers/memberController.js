const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Workout = require('../models/Workout');

/**
 * @desc    Get Member Dashboard Data (Member Details + Latest Workout + Attendance)
 * @route   GET /api/member/dashboard
 */
exports.getMyDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get Member & Trainer details
    const member = await User.findById(req.user.id).populate('assignedTrainer', 'name');
    
    // 2. Hamesha sabse latest (newest) workout fetch karein
    const workout = await Workout.findOne({ memberId: req.user.id }).sort({ createdAt: -1 });

    // 3. CHECK ATTENDANCE STATUS FOR TODAY
    const attendance = await Attendance.findOne({
      memberId: req.user.id,
      date: { $gte: today }
    });

    res.json({
      member,
      // Agar workout milta hai toh pura object bhejo, varna default exercises array
      workout: workout || { exercises: [], instructions: "No workout assigned yet.", completedExercises: [] },
      attendanceStatus: !!attendance, 
      checkInTime: attendance ? attendance.checkInTime : null
    });
  } catch (err) {
    console.error("Dashboard Load Error:", err);
    res.status(500).json({ message: "Error loading dashboard" });
  }
};

/**
 * @desc    Save/Update Workout Progress (Checkboxes)
 * @route   POST /api/member/update-progress
 */
exports.updateWorkoutProgress = async (req, res) => {
  try {
    const { workoutId, completedExercises } = req.body;

    // Workout find karke sirf progress array update kar rahe hain
    const workout = await Workout.findById(workoutId);
    
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // Security Check: Kya ye workout isi member ka hai?
    if (workout.memberId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access to this workout" });
    }

    workout.completedExercises = completedExercises;
    await workout.save();

    res.status(200).json({ message: "Progress saved successfully!" });
  } catch (error) {
    console.error("Progress Save Error:", error);
    res.status(500).json({ message: "Server error while saving progress" });
  }
};