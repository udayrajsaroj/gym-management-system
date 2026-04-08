const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  memberId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Date ko sirf 'YYYY-MM-DD' store karne ke liye hum use karte hain
  date: { 
    type: Date, 
    default: () => new Date().setHours(0, 0, 0, 0) // Hamesha din ki shuruat store karega
  },
  checkInTime: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

// Ek Member ek din mein sirf EK hi baar scan kar sake (Duplicate entry rokne ke liye)
AttendanceSchema.index({ memberId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);