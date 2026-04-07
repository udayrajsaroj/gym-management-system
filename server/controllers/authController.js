const User = require('../models/User');
const OTP = require('../models/OTP'); // OTP model jo humne banaya tha
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g., 'yourgym@gmail.com'
    pass: process.env.EMAIL_PASS  // Gmail App Password
  }
});

/**
 * STEP 1: Send OTP to User's Email
 */
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTP if user is requesting again, then save new one
    await OTP.findOneAndDelete({ email });
    await OTP.create({ email, otp });

    // Send Email
    const mailOptions = {
      from: `"IronPulse Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your IronPulse Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Welcome to IronPulse Fitness!</h2>
          <p>Your OTP for account registration is:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
          <p style="color: #64748b; font-size: 12px;">This code is valid for 5 minutes. Do not share it with anyone.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully to your email!" });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please check email configuration." });
  }
};

/**
 * STEP 2: Verify OTP and Register User
 */
exports.verifyAndRegister = async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;

    // 1. Verify OTP
    const validOTP = await OTP.findOne({ email, otp });
    if (!validOTP) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 2. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || 'member',
      membershipStatus: 'active' // By default active, admin can change expiry later
    });
    
    await newUser.save();

    // 4. Delete the OTP document so it can't be reused
    await OTP.deleteOne({ email });

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * LOGIN LOGIC (Unchanged)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

    // Create the "ID Card" (Token) with the User's Role
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};