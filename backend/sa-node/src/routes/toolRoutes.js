const express = require('express');
const db = require('../database/db');

const router = express.Router();

// GET /api/tools
router.get('/', (req, res) => {
  const tools = db.tools.findEnabled();
  return res.json({
    success: true,
    message: 'Tools retrieved successfully',
    data: tools
  });
});

// GET /api/tools/:slug
router.get('/:slug', (req, res) => {
  const tool = db.tools.findBySlug(req.params.slug);
  if (!tool) {
    return res.status(404).json({
      success: false,
      message: `Tool not found: ${req.params.slug}`,
      data: null
    });
  }
  return res.json({
    success: true,
    message: 'Tool retrieved successfully',
    data: tool
  });
});

module.exports = router;
