const mongoose = require('mongoose');

const WorkoutSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exercises: [
    {
      name: { type: String, required: true },
      sets: { type: String },
      reps: { type: String },
      weight: { type: String }
    }
  ],
  instructions: { type: String }, // General notes like "Keep rest to 60s"
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Workout', WorkoutSchema);