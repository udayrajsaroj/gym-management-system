const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  checkInTime: { type: String, required: true } // e.g., "14:30"
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);