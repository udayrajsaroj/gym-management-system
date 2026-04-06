const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'trainer', 'member'], 
    default: 'member' 
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'expired', 'none'],
    default: 'none'
  },
  expiryDate: { type: Date }, // Important for the Admin validation feature
  assignedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Links members to trainers
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);