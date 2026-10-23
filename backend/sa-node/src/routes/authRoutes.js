const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Seed initial admin user if no users exist
if (db.users.count() === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.users.create({
    name: 'Administrator',
    email: 'admin@sa.local',
    password: hash,
    role: 'ADMIN',
    enabled: true
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
        data: null
      });
    }

    const existing = db.users.findByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        data: null
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.users.create({
      name,
      email,
      password: hashedPassword,
      role: 'USER',
      enabled: true
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        enabled: user.enabled,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Registration failed',
      data: null
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        data: null
      });
    }

    const user = db.users.findByEmail(email);
    if (!user || !user.enabled) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        type: 'Bearer',
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Login failed',
      data: null
    });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      data: null
    });
  }
  return res.json({
    success: true,
    message: 'User retrieved successfully',
    data: req.user
  });
});

module.exports = router;
