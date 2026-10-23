const express = require('express');
const db = require('../database/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.users.find().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    enabled: u.enabled,
    createdAt: u.createdAt
  }));

  return res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: users
  });
});

// GET /api/admin/jobs
router.get('/jobs', (req, res) => {
  const { status } = req.query;
  const jobs = status ? db.conversionJobs.findByStatus(status) : db.conversionJobs.find();
  return res.json({
    success: true,
    message: 'Jobs retrieved successfully',
    data: jobs
  });
});

// GET /api/admin/tools
router.get('/tools', (req, res) => {
  return res.json({
    success: true,
    message: 'Tools retrieved successfully',
    data: db.tools.findAll()
  });
});

// PATCH /api/admin/tools/:id/toggle
router.patch('/tools/:id/toggle', (req, res) => {
  const enabled = req.query.enabled === 'true';
  const updated = db.tools.toggle(req.params.id, enabled);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Tool not found',
      data: null
    });
  }

  return res.json({
    success: true,
    message: 'Tool status updated',
    data: updated
  });
});

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const jobs = db.conversionJobs.find();
  const stats = {
    totalUsers: db.users.count(),
    totalFiles: db.files.count(),
    totalJobs: jobs.length,
    queuedJobs: jobs.filter(j => j.status === 'QUEUED').length,
    processingJobs: jobs.filter(j => j.status === 'PROCESSING').length,
    completedJobs: jobs.filter(j => j.status === 'COMPLETED').length,
    failedJobs: jobs.filter(j => j.status === 'FAILED').length
  };

  return res.json({
    success: true,
    message: 'Platform statistics retrieved',
    data: stats
  });
});

module.exports = router;
