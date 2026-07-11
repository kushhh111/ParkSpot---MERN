/**
 * Middleware to restrict route access to specific user roles.
 * Must be used after the 'protect' middleware.
 * @param {...string} roles - List of allowed roles (driver, owner, admin)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Authorisation failed: User data not found on request context',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorised to access this resource`,
      });
    }

    next();
  };
};

module.exports = { authorize };
