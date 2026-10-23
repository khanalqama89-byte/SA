const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const upload = require('../middleware/upload');
const storageManager = require('../storage/storageManager');
const db = require('../database/db');

const router = express.Router();

// POST /api/files/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        data: null
      });
    }

    const fileId = uuidv4();
    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const mimeType = req.file.mimetype || 'application/octet-stream';
    const userId = req.user ? req.user.id : null;

    // Save to storage manager (memory cache + disk/tmp)
    const { storedName, filePath, size } = await storageManager.saveUpload(
      fileId,
      req.file.buffer,
      originalName,
      mimeType
    );

    // Save metadata record
    const fileRecord = db.files.create({
      id: fileId,
      userId,
      originalName,
      storedName,
      extension: ext,
      mimeType,
      size,
      storagePath: filePath,
      fileType: 'DOCUMENT'
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        extension: fileRecord.extension,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        fileType: fileRecord.fileType,
        createdAt: fileRecord.createdAt,
        expiresAt: fileRecord.expiresAt
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'File upload failed',
      data: null
    });
  }
});

// GET /api/files/:id
router.get('/:id', (req, res) => {
  const fileRecord = db.files.findById(req.params.id);
  if (!fileRecord) {
    return res.status(404).json({
      success: false,
      message: 'File not found',
      data: null
    });
  }

  return res.json({
    success: true,
    message: 'File retrieved successfully',
    data: {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      extension: fileRecord.extension,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      fileType: fileRecord.fileType,
      createdAt: fileRecord.createdAt,
      expiresAt: fileRecord.expiresAt
    }
  });
});

// DELETE /api/files/:id
router.delete('/:id', async (req, res) => {
  const fileRecord = db.files.findById(req.params.id);
  if (!fileRecord) {
    return res.status(404).json({
      success: false,
      message: 'File not found',
      data: null
    });
  }

  await storageManager.deleteFile(req.params.id);
  db.files.delete(req.params.id);

  return res.json({
    success: true,
    message: 'File deleted successfully',
    data: null
  });
});

module.exports = router;
