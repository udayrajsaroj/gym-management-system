const User = require('../models/User');
const Attendance = require('../models/Attendance'); // 👈 Import check karein
const bcrypt = require('bcryptjs');

/**
 * @desc    Get all users (Trainers and Members)
 * @route   GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server Error: Could not fetch users" });
  }
};

/**
 * @desc    Add a new user (Member or Trainer)
 * @route   POST /api/admin/add-user
 */
exports.addUser = async (req, res) => {
  try {
    const { name, email, password, role, expiryDate, assignedTrainer } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let status = 'active';
    if (role === 'member' && expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(expiryDate) < today) status = 'expired';
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      membershipStatus: role === 'member' ? status : 'none',
      expiryDate: role === 'member' ? expiryDate : null,
      assignedTrainer: role === 'member' ? assignedTrainer : null 
    });

    await newUser.save();
    res.status(201).json({ message: `${role} created successfully!` });
  } catch (err) {
    res.status(500).json({ message: "Error creating user profile" });
  }
};

/**
 * @desc    Update user details or renew membership
 * @route   PUT /api/admin/update-user/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, expiryDate, membershipStatus, password, assignedTrainer } = req.body;
    let updateData = { name, email, role, expiryDate, membershipStatus, assignedTrainer };

    if (role === 'member' && expiryDate) {
      const selectedDate = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); 

      if (selectedDate >= today) {
        updateData.membershipStatus = 'active';
      } else {
        updateData.membershipStatus = 'expired';
      }
    }

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Update successful", user: updatedUser });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Error updating user information" });
  }
};

/**
 * @desc    Delete a user (Member or Trainer)
 * @route   DELETE /api/admin/delete-user/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed from system" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

/**
 * @desc    Get members whose plans expire in the next 7 days
 * @route   GET /api/admin/expiring-soon
 */
exports.getExpiringMembers = async (req, res) => {
  try {
    const today = new Date();
    const alertWindow = new Date();
    alertWindow.setDate(today.getDate() + 7);

    const alerts = await User.find({
      role: 'member',
      expiryDate: { $lte: alertWindow }
    }).select('name email expiryDate membershipStatus');

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching membership alerts" });
  }
};

// --- ATTENDANCE ANALYTICS FUNCTIONS ---

/**
 * @desc    Get overall attendance logs for Admin
 * @route   GET /api/admin/attendance-report
 */
exports.getAttendanceReport = async (req, res) => {
  try {
    const logs = await Attendance.find()
      .populate('memberId', 'name email')
      .sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Failed to fetch attendance report" });
  }
};

/**
 * @desc    Get Present/Absent stats for a specific member
 * @route   GET /api/admin/member-stats/:id
 */
exports.getMemberStats = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await User.findById(memberId);
    
    if (!member) return res.status(404).json({ message: "Member not found" });

    // 1. Aaj tak kitni baar present tha
    const totalPresent = await Attendance.countDocuments({ memberId });

    // 2. Joining date se aaj tak ke total din
    const joinDate = new Date(member.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    const totalDaysSinceJoined = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // 3. Calculation
    const totalAbsent = totalDaysSinceJoined - totalPresent;
    const attendancePercentage = ((totalPresent / totalDaysSinceJoined) * 100).toFixed(1);

    res.json({
      name: member.name,
      totalPresent,
      totalAbsent: totalAbsent < 0 ? 0 : totalAbsent,
      totalDaysSinceJoined,
      attendancePercentage: attendancePercentage > 100 ? 100 : attendancePercentage
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: "Error calculating member stats" });
  }
};