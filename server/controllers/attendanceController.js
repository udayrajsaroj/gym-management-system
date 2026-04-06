const Attendance = require('../models/Attendance');

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
 * @desc    Verify the rotating scan and log attendance
 * @route   POST /api/attendance/verify-scan
 */
exports.verifyScan = async (req, res) => {
  try {
    const { scannedToken } = req.body;

    // 1. SECURITY CHECK: Validate Rotating Token
    const currentWindow = Math.floor(Date.now() / 30000);
    
    // We allow the current window AND the previous one.
    // This gives the member 30-60 seconds to scan before it expires, 
    // handling network lag or slow camera focus.
    const validTokens = [
      `IRONPULSE-SECURE-${currentWindow}`,
      `IRONPULSE-SECURE-${currentWindow - 1}`
    ];

    if (!validTokens.includes(scannedToken)) {
      return res.status(400).json({ 
        message: "QR Code expired or invalid. Please scan the fresh code on the station screen." 
      });
    }

    // 2. DUPLICATE CHECK: Prevent multiple check-ins on the same day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const alreadyCheckedIn = await Attendance.findOne({
      memberId: req.user.id,
      date: { $gte: startOfDay }
    });

    if (alreadyCheckedIn) {
      return res.status(400).json({ 
        message: "You are already checked in for today. Have a great workout!" 
      });
    }

    // 3. SUCCESS: Log the Attendance
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ":" + 
                       now.getMinutes().toString().padStart(2, '0');

    const newAttendance = new Attendance({
      memberId: req.user.id,
      checkInTime: timeString
      // date: defaults to Date.now() via your model
    });

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