const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.findById(decoded.id);
    if (user && user.enabled) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication required',
      data: null
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin privilege required',
      data: null
    });
  }
  next();
}

module.exports = {
  authMiddleware,
  requireAuth,
  requireAdmin,
  JWT_SECRET
};
