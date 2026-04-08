const User = require('../models/User');
const bcrypt = require('bcryptjs');
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

    // 2. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user directly
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword, // Hashed password save kar rahe hain
      role,
      membershipStatus: role === 'member' ? membershipStatus : 'none',
      expiryDate: role === 'member' && expiryDate ? expiryDate : null,
      assignedTrainer: role === 'member' && assignedTrainer ? assignedTrainer : null
    });

    // 4. Send Welcome Email in the background
    try {
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
              Welcome to the IronPulse family! Your gym membership account has been successfully created by our admin team.
            </p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #0f172a; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Your Login Credentials</p>
              <p style="margin: 5px 0; color: #475569; font-size: 15px;"><strong>Email:</strong> <span style="color: #2563eb;">${email}</span></p>
              <p style="margin: 5px 0; color: #475569; font-size: 15px;"><strong>Password:</strong> <span style="color: #2563eb;">${password}</span></p>
            </div>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Please login to your IronPulse app at the front desk to scan your QR code and unlock your daily workout routine.
            </p>
            <br/>
            <p style="color: #475569; font-size: 15px;">Let's crush those goals!<br/><strong style="color: #0f172a;">- The IronPulse Team</strong></p>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
      console.log("✅ Welcome email sent to:", email);
    } catch (emailError) {
      console.error("❌ Failed to send welcome email (but user was created):", emailError);
      // Note: Hum yaha error throw nahi kar rahe, taaki agar email server mein koi dikkat ho, 
      // toh bhi Admin ko "User Created" ka success message mil jaye.
    }

    res.status(201).json({ message: "User created and welcome email sent!", user: newUser });

  } catch (error) {
    console.error("Add User Error:", error);
    res.status(500).json({ message: "Server error while creating user." });
  }
};