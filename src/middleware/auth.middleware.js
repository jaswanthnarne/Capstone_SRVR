const jwt = require('jsonwebtoken');

/**
 * Verify JWT and attach decoded payload to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Require a specific role
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  next();
};

/**
 * Team leads can only access their own team's data.
 * Checks req.params.teamId or req.body.teamId against the JWT-embedded teamId.
 */
const requireOwnTeam = (req, res, next) => {
  if (req.user.role === 'trainer') return next(); // trainers bypass scope check
  const requestedTeamId = req.params.teamId || req.body.teamId;
  if (requestedTeamId && requestedTeamId !== req.user.teamId) {
    return res.status(403).json({ success: false, message: 'Forbidden: not your team' });
  }
  next();
};

module.exports = { authenticate, requireRole, requireOwnTeam };
