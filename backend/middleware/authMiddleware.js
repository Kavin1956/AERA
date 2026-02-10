const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    console.error('❌ No token in Authorization header');
    return res.status(401).json({ message: 'No token provided. Please login first.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified. User:', req.user);
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
