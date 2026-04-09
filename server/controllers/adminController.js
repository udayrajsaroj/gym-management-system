const User = require('../models/User');
const Attendance = require('../models/Attendance');
const bcrypt = require('bcryptjs'); // 👈 Ensure this is installed

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

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already registered" });

    // Hash password before saving
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
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, expiryDate, membershipStatus, password, assignedTrainer } = req.body;
    
    // Find user first
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let updateData = { name, email, role, assignedTrainer };

    // Membership Status Auto-update logic
    if (role === 'member' && expiryDate) {
      updateData.expiryDate = expiryDate;
      const selectedDate = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      updateData.membershipStatus = selectedDate >= today ? 'active' : 'expired';
    } else {
      updateData.membershipStatus = membershipStatus;
    }

    // Password Hashing Fix: Hash only if password is provided
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: "Update successful", user: updatedUser });
  } catch (err) {
    console.error("Update Controller Error:", err);
    res.status(500).json({ message: "Internal Server Error during update" });
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
 * @desc    Membership Alerts (Next 7 days)
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

// --- ATTENDANCE ANALYTICS ---

/**
 * @desc    Overall attendance report
 */
exports.getAttendanceReport = async (req, res) => {
  try {
    const logs = await Attendance.find()
      .populate('memberId', 'name email')
      .sort({ date: -1 })
      .lean();

    // Map to handle deleted/null users gracefully
    const safeLogs = logs.map(log => ({
      ...log,
      memberId: log.memberId || { name: "Unknown User", email: "N/A" }
    }));

    res.status(200).json(safeLogs);
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Failed to fetch attendance report" });
  }
};

/**
 * @desc    Individual member statistics
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
      attendancePercentage: attendancePercentage > 100 ? 100 : attendancePercentage
    });
  } catch (err) {
    console.error("Stats Calc Error:", err);
    res.status(500).json({ message: "Backend error calculating statistics" });
  }
};