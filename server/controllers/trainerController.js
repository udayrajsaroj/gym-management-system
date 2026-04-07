const User = require('../models/User');
const Workout = require('../models/Workout');

/**
 * @desc    Fetch only members assigned to this specific trainer
 * @route   GET /api/trainer/my-clients
 */
exports.getMyClients = async (req, res) => {
  try {
    console.log("Fetching clients for Trainer ID:", req.user.id);

    const clients = await User.find({ assignedTrainer: req.user.id })
      .select('name email membershipStatus expiryDate')
      .sort({ name: 1 });

    console.log(`Found ${clients.length} athletes assigned to this trainer.`);
    res.json(clients);
  } catch (err) {
    console.error("Trainer GetClients Error:", err);
    res.status(500).json({ message: "Failed to load your athletes" });
  }
};

/**
 * @desc    Get the LATEST workout assigned to a specific member
 * @route   GET /api/trainer/member-workout/:memberId
 */
exports.getMemberWorkout = async (req, res) => {
  try {
    const { memberId } = req.params;

    // FIX 1: Added .sort({ createdAt: -1 }) to get the newest workout first
    const workout = await Workout.findOne({ memberId }).sort({ createdAt: -1 });

    if (!workout) {
      return res.json({ exercises: [], instructions: "" });
    }

    res.json(workout);
  } catch (err) {
    console.error("Fetch Member Workout Error:", err);
    res.status(500).json({ message: "Error retrieving workout data" });
  }
};

/**
 * @desc    Assign new workout OR update today's workout
 * @route   POST /api/trainer/assign-workout
 */
exports.assignWorkout = async (req, res) => {
  try {
    const { memberId, exercises, instructions } = req.body;

    if (!memberId || !exercises || exercises.length === 0) {
      return res.status(400).json({ message: "Member ID and at least one exercise are required" });
    }

    // FIX 2: Check if a workout was already created TODAY
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let workout = await Workout.findOne({
      memberId,
      createdAt: { $gte: startOfDay }
    });

    if (workout) {
      // Agar aaj ka workout already hai, toh use UPDATE karo (Overwrite se bacho)
      workout.exercises = exercises;
      workout.instructions = instructions;
      workout.trainerId = req.user.id;
      await workout.save();
      
      return res.json({ message: "Today's workout updated successfully!", workout });
    } else {
      // Agar aaj ka workout nahi hai, toh NAYA document CREATE karo (History ke liye)
      workout = await Workout.create({
        memberId,
        trainerId: req.user.id,
        exercises,
        instructions
      });

      return res.json({ message: "New workout assigned for today!", workout });
    }
  } catch (err) {
    console.error("Trainer AssignWorkout Error:", err);
    res.status(500).json({ message: "System error: Could not save workout routine" });
  }
};