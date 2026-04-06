const User = require('../models/User');
const Workout = require('../models/Workout');

/**
 * @desc    Fetch only members assigned to this specific trainer
 * @route   GET /api/trainer/my-clients
 */
exports.getMyClients = async (req, res) => {
  try {
    // req.user.id comes from the 'protect' middleware token
    console.log("Fetching clients for Trainer ID:", req.user.id);

    const clients = await User.find({ assignedTrainer: req.user.id })
      .select('name email membershipStatus expiryDate')
      .sort({ name: 1 }); // Sorted alphabetically

    console.log(`Found ${clients.length} athletes assigned to this trainer.`);
    res.json(clients);
  } catch (err) {
    console.error("Trainer GetClients Error:", err);
    res.status(500).json({ message: "Failed to load your athletes" });
  }
};

/**
 * @desc    Get the current workout assigned to a specific member
 * @route   GET /api/trainer/member-workout/:memberId
 */
exports.getMemberWorkout = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Find the workout linked to this specific member
    const workout = await Workout.findOne({ memberId });

    if (!workout) {
      // Return empty structure if no workout exists yet
      return res.json({ exercises: [], instructions: "" });
    }

    res.json(workout);
  } catch (err) {
    console.error("Fetch Member Workout Error:", err);
    res.status(500).json({ message: "Error retrieving workout data" });
  }
};

/**
 * @desc    Create or Update a workout for a member (Upsert)
 * @route   POST /api/trainer/assign-workout
 */
exports.assignWorkout = async (req, res) => {
  try {
    const { memberId, exercises, instructions } = req.body;

    // Validation
    if (!memberId || !exercises || exercises.length === 0) {
      return res.status(400).json({ message: "Member ID and at least one exercise are required" });
    }

    // findOneAndUpdate with 'upsert' creates a new doc if one isn't found
    const workout = await Workout.findOneAndUpdate(
      { memberId },
      { 
        trainerId: req.user.id, 
        exercises, 
        instructions, 
        updatedAt: Date.now() 
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ 
      message: "Workout synchronized and pushed to member dashboard!", 
      workout 
    });
  } catch (err) {
    console.error("Trainer AssignWorkout Error:", err);
    res.status(500).json({ message: "System error: Could not save workout routine" });
  }
};