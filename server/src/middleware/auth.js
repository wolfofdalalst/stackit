const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

// Middleware to authenticate access token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Authorization header:', authHeader);
  console.log('Extracted token:', token);

  if (!token) {
    console.warn('No token provided in Authorization header');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }

    console.log('Decoded JWT payload:', decoded);

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, role, avatar_url, bio, reputation, created_at, updated_at')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        console.warn('User not found or database error:', error);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Authenticated user:', user);
      req.user = user;
      next();
    } catch (error) {
      console.error('Unexpected error during authentication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

// Middleware to authorize user roles
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };