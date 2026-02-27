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
    // Only log successful verification when debug mode is explicitly enabled
    if (process.env.DEBUG_AUTH === 'true') {
      console.debug('✅ Token verified. User:', req.user);
    }

    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
