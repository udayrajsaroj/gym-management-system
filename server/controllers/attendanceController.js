const Attendance = require('../models/Attendance');
const moment = require('moment-timezone'); // IST handle karne ke liye

/**
 * Helper to generate a time-windowed token
 * Math.floor(Date.now() / 30000) ensures the number changes every 30 seconds
 */
const generateRotatingToken = () => {
  const window = Math.floor(Date.now() / 30000); 
  return `IRONPULSE-SECURE-${window}`;
};

/**
 * @desc    Generate a rotating token for the Gym's QR display
 * @route   GET /api/attendance/gym-token
 */
exports.getGymToken = (req, res) => {
  try {
    const gymToken = generateRotatingToken();
    res.json({ qrValue: gymToken });
  } catch (err) {
    res.status(500).json({ message: "Error generating token" });
  }
};

/**
 * @desc    Verify the rotating scan and log attendance (IST FIXED)
 * @route   POST /api/attendance/verify-scan
 */
exports.verifyScan = async (req, res) => {
  try {
    const { scannedToken } = req.body;

    // 1. SECURITY CHECK: Validate Rotating Token
    const currentWindow = Math.floor(Date.now() / 30000);
    
    const validTokens = [
      `IRONPULSE-SECURE-${currentWindow}`,
      `IRONPULSE-SECURE-${currentWindow - 1}`
    ];

    if (!validTokens.includes(scannedToken)) {
      return res.status(400).json({ 
        message: "QR Code expired or invalid. Please scan the fresh code on the station screen." 
      });
    }

    // --- IST FIX START ---
    
    // 2. IST TIME CALCULATION: Pure logic ko India Time par forced kiya hai
    const nowIST = moment().tz("Asia/Kolkata");
    const todayStartIST = nowIST.clone().startOf('day').toDate(); // Aaj raat 12:00 AM IST
    const todayEndIST = nowIST.clone().endOf('day').toDate();     // Aaj raat 11:59 PM IST

    // 3. DUPLICATE CHECK: IST ke hisaab se check karein
    const alreadyCheckedIn = await Attendance.findOne({
      memberId: req.user.id,
      date: { $gte: todayStartIST, $lte: todayEndIST }
    });

    if (alreadyCheckedIn) {
      return res.status(400).json({ 
        message: "You are already checked in for today (IST). Have a great workout!" 
      });
    }

    // 4. TIME FORMATTING: Indian Format (e.g., 06:01 AM)
    const timeString = nowIST.format('hh:mm A');

    // 5. SUCCESS: Log the Attendance
    const newAttendance = new Attendance({
      memberId: req.user.id,
      checkInTime: timeString,
      date: nowIST.toDate() // Database mein bhi IST converted date save hogi
    });

    // --- IST FIX END ---

    await newAttendance.save();

    res.status(201).json({ 
      message: "Attendance Verified! Welcome to IronPulse.", 
      time: timeString 
    });

  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).json({ message: "System error during QR verification" });
  }
};