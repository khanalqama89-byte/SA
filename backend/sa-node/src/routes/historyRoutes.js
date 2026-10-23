const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/history
router.get('/', (req, res) => {
  const history = db.history.findByUserId(req.user.id);
  return res.json({
    success: true,
    message: 'History retrieved successfully',
    data: history
  });
});

// GET /api/history/:id
router.get('/:id', (req, res) => {
  const item = db.history.findById(req.params.id);
  if (!item || String(item.userId) !== String(req.user.id)) {
    return res.status(404).json({
      success: false,
      message: 'History item not found',
      data: null
    });
  }

  return res.json({
    success: true,
    message: 'History item retrieved successfully',
    data: item
  });
});

// DELETE /api/history/:id
router.delete('/:id', (req, res) => {
  const deleted = db.history.delete(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'History record not found',
      data: null
    });
  }

  return res.json({
    success: true,
    message: 'History record deleted successfully',
    data: null
  });
});

module.exports = router;
