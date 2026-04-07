const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const cron = require('node-cron');
const User = require('./models/User');
const memberRoutes = require('./routes/memberRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Allows the server to understand JSON
app.use(cors());         // Allows your frontend to talk to this backend
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/ping', (req, res) => {
  res.status(200).send('Awake');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Gym Database Connected Successfully"))
  .catch((err) => console.log("❌ Database Connection Error:", err));

// Basic Route for Testing
app.get('/', (req, res) => {
  res.send("Gym Management System API is running...");
});

cron.schedule('0 0 * * *', async () => {
  console.log("Checking membership validity...");
  const today = new Date();
  
  // Update all users where the expiryDate has passed
  await User.updateMany(
    { expiryDate: { $lt: today }, membershipStatus: 'active' },
    { $set: { membershipStatus: 'expired' } }
  );
  console.log("Membership validation complete.");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});