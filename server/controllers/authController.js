const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // 👈 Token ke liye zaroori hai
const nodemailer = require('nodemailer');

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * @desc    Admin adds a new user (Member or Trainer)
 * @route   POST /api/admin/add-user
 */
exports.addUser = async (req, res) => {
  try {
    const { name, email, password, role, membershipStatus, expiryDate, assignedTrainer } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      membershipStatus: role === 'member' ? (membershipStatus || 'active') : 'none',
      expiryDate: role === 'member' && expiryDate ? expiryDate : null,
      assignedTrainer: role === 'member' && assignedTrainer ? assignedTrainer : null
    });

    // 4. Send Welcome Email (Background process)
    const mailOptions = {
      from: `"IronPulse Gym" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to IronPulse Fitness! 💪",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #2563eb; text-align: center; font-style: italic; font-weight: 900; letter-spacing: -1px; font-size: 28px;">
            IRON<span style="color: #0f172a;">PULSE</span>
          </h2>
          <h3 style="color: #1e293b; margin-top: 30px;">Hi ${name},</h3>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Welcome to the family! Your account has been successfully created.
          </p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <p style="color: #475569; font-size: 15px;"><strong>Email:</strong> ${email}</p>
            <p style="color: #475569; font-size: 15px;"><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #475569; font-size: 14px;">Login to scan your QR code and unlock your routine.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions).catch(err => console.error("Email Error:", err));

    res.status(201).json({ message: "User created successfully!", user: newUser });

  } catch (error) {
    console.error("Add User Error:", error);
    res.status(500).json({ message: "Server error while creating user." });
  }
};

/**
 * @desc    User Login (FIX FOR RENDER ERROR)
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email }).populate('assignedTrainer', 'name');
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Create JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 4. Send Response
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
      membershipStatus: user.membershipStatus,
      assignedTrainer: user.assignedTrainer
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};