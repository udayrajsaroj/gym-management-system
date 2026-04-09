const User = require('../models/User');
const Attendance = require('../models/Attendance');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get all users (Trainers and Members)
 * @route   GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('assignedTrainer', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(users);
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

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

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
    console.error("Add User Error:", err);
    res.status(500).json({ message: "Error creating user profile" });
  }
};

/**
 * @desc    Update user details or renew membership
 * @route   PUT /api/admin/update-user/:id
 * @FIXED   Trainer/Admin update issue resolved
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, expiryDate, membershipStatus, password, assignedTrainer } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Initial update object with common fields
    let updateData = { 
      name: name || user.name, 
      email: email || user.email, 
      role: role || user.role, 
    };

    // 1. Password Update Logic
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // 2. Role Specific Data Handling (The Fix)
    if (updateData.role === 'member') {
      updateData.assignedTrainer = assignedTrainer !== undefined ? assignedTrainer : user.assignedTrainer;
      
      if (expiryDate && expiryDate.trim() !== "") {
        updateData.expiryDate = expiryDate;
        const selectedDate = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        updateData.membershipStatus = selectedDate >= today ? 'active' : 'expired';
      } else {
        updateData.membershipStatus = membershipStatus || user.membershipStatus;
      }
    } else {
      // 🚨 FIXED: Admin/Trainer ke liye non-member fields ko reset karna zaroori hai
      // Isse Mongoose Date validation crash nahi hota
      updateData.membershipStatus = 'none';
      updateData.expiryDate = null;
      updateData.assignedTrainer = null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: "Update successful", user: updatedUser });
  } catch (err) {
    console.error("Update Controller Error:", err.message);
    res.status(500).json({ message: "Internal Server Error: Update failed." });
  }
};

/**
 * @desc    Delete a user
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
 * @desc    Get members whose plans expire soon
 */
exports.getExpiringMembers = async (req, res) => {
  try {
    const today = new Date();
    const alertWindow = new Date();
    alertWindow.setDate(today.getDate() + 7);

    const alerts = await User.find({
      role: 'member',
      expiryDate: { $lte: alertWindow, $gte: today }
    }).select('name email expiryDate membershipStatus');

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching membership alerts" });
  }
};

/**
 * @desc    Attendance Report
 */
exports.getAttendanceReport = async (req, res) => {
  try {
    const logs = await Attendance.find()
      .populate('memberId', 'name email')
      .sort({ date: -1 })
      .lean();

    const safeLogs = logs.map(log => ({
      ...log,
      memberId: log.memberId || { name: "Deleted User", email: "N/A" }
    }));

    res.status(200).json(safeLogs);
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Failed to fetch attendance report" });
  }
};

/**
 * @desc    Member stats
 */
exports.getMemberStats = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await User.findById(memberId);
    
    if (!member) return res.status(404).json({ message: "Member not found" });

    const totalPresent = await Attendance.countDocuments({ memberId });
    const joinDate = new Date(member.createdAt);
    const today = new Date();
    
    const diffTime = Math.abs(today - joinDate);
    const totalDaysSinceJoined = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const totalAbsent = totalDaysSinceJoined - totalPresent;
    const attendancePercentage = ((totalPresent / totalDaysSinceJoined) * 100).toFixed(1);

    res.status(200).json({
      name: member.name,
      totalPresent,
      totalAbsent: totalAbsent < 0 ? 0 : totalAbsent,
      totalDaysSinceJoined,
      attendancePercentage: attendancePercentage > 100 ? "100.0" : attendancePercentage
    });
  } catch (err) {
    console.error("Stats Calc Error:", err);
    res.status(500).json({ message: "Backend error calculating statistics" });
  }
};