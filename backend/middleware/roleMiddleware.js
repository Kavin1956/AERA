module.exports = (requiredRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ message: 'User role not found in token' });
    }

    // Allow if user's role matches any of the required roles
    if (Array.isArray(requiredRoles)) {
      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({ message: `Access denied: This action requires one of these roles: ${requiredRoles.join(', ')}` });
      }
    } else {
      if (userRole !== requiredRoles) {
        return res.status(403).json({ message: `Access denied: This action requires ${requiredRoles} role` });
      }
    }

    next();
  };
};
