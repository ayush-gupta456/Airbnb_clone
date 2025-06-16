import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
// Ensure User model is accessible. Since User is defined in server.js,
// we might need to fetch it differently or restructure.
// For now, assuming User model is registered globally with Mongoose by the time middleware is used.
// This can be fragile. A better approach is to define models in separate files and import them.
// const User = mongoose.model('User'); // Moved inside 'protect' function

const protect = async (req, res, next) => {
  const User = mongoose.model('User'); // Now defined when middleware is executed
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      // Select '-password' to exclude password hash
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Not authorized, token expired' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Optional: Middleware to authorize based on user role (e.g., isHost)
// For now, we only need the 'protect' middleware.
// const authorizeHost = (req, res, next) => {
//   if (req.user && req.user.isHost) {
//     next();
//   } else {
//     res.status(403).json({ success: false, message: 'User is not authorized as a host' });
//   }
// };

export { protect };
