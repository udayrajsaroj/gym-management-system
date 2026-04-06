const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded; // This adds the user ID and ROLE to the request
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Function to check specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not allowed to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };