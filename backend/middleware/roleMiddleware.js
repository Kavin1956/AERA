module.exports = (role) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    console.log(`🔐 Role check: User role = '${userRole}', Required role = '${role}'`);
    
    if (userRole !== role) {
      console.error(`❌ Access denied: ${userRole} !== ${role}`);
      return res.status(403).json({ 
        message: 'Access denied',
        details: `Your role '${userRole}' is not authorized for this action. Required: '${role}'`
      });
    }
    
    console.log(`✅ Role authorized: ${userRole}`);
    next();
  };
};
