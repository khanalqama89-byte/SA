const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const storageManager = require('../storage/storageManager');
const { executeConversion } = require('../converters');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/conversions (supports direct multipart upload, base64 data, or sourceFileId)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    let { toolSlug, sourceFileId, fileBase64, originalName, options = {} } = req.body;

    if (typeof options === 'string') {
      try { options = JSON.parse(options); } catch {}
    }

    if (!toolSlug) {
      return res.status(400).json({
        success: false,
        message: 'toolSlug is required',
        data: null
      });
    }

    const tool = db.tools.findBySlug(toolSlug);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: `Tool not found: ${toolSlug}`,
        data: null
      });
    }

    let inputBuffer = null;
    let fileName = originalName || 'document';

    // 1. Direct file upload via multipart
    if (req.file) {
      inputBuffer = req.file.buffer;
      fileName = req.file.originalname;
    }
    // 2. Direct Base64 payload
    else if (fileBase64) {
      inputBuffer = Buffer.from(fileBase64, 'base64');
    }
    // 3. Pre-uploaded file reference
    else if (sourceFileId) {
      const sourceFile = db.files.findById(sourceFileId);
      if (sourceFile) {
        fileName = sourceFile.originalName;
      }
      inputBuffer = await storageManager.getFileBuffer(sourceFileId);
    }

    if (!inputBuffer) {
      return res.status(400).json({
        success: false,
        message: 'No file data found for conversion. Please select a valid document.',
        data: null
      });
    }

    const jobId = uuidv4();
    const userId = req.user ? req.user.id : null;

    // Create tracking record
    const job = db.conversionJobs.create({
      id: jobId,
      userId,
      sourceFileId: sourceFileId || jobId,
      sourceFormat: tool.sourceFormat,
      targetFormat: tool.targetFormat,
      status: 'PROCESSING',
      progress: 60
    });

    // Execute conversion synchronously (completes in ~200-500ms, preventing Lambda freeze)
    const result = await executeConversion(toolSlug, inputBuffer, options);

    // Formulate output filename
    const originalBase = path.parse(fileName).name;
    const outputFileName = `${originalBase}_converted${result.extension}`;
    const outputFileId = uuidv4();

    // Cache output in storage
    const { filePath, size } = await storageManager.saveProcessed(
      outputFileId,
      result.buffer,
      outputFileName,
      result.mimeType
    );

    db.files.create({
      id: outputFileId,
      userId,
      originalName: outputFileName,
      storedName: `${outputFileId}${result.extension}`,
      extension: result.extension,
      mimeType: result.mimeType,
      size,
      storagePath: filePath,
      fileType: 'PROCESSED'
    });

    // Mark job completed
    db.conversionJobs.update(jobId, {
      status: 'COMPLETED',
      progress: 100,
      outputFileId,
      outputFileName,
      completedAt: new Date().toISOString()
    });

    if (userId) {
      db.history.create({
        userId,
        jobId,
        toolName: tool.name,
        sourceFileName: fileName,
        outputFileName,
        status: 'COMPLETED'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversion completed successfully',
      data: {
        jobId: job.id,
        status: 'COMPLETED',
        progress: 100,
        originalFileName: fileName,
        originalSize: inputBuffer.length,
        sourceFormat: tool.sourceFormat,
        targetFormat: tool.targetFormat,
        outputFileId,
        outputFileName,
        mimeType: result.mimeType,
        size: result.buffer.length,
        fileBase64: result.buffer.toString('base64'),
        downloadUrl: `/api/conversions/${jobId}/download`
      }
    });
  } catch (err) {
    console.error('Job execution error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Conversion failed unexpectedly',
      data: null
    });
  }
});

// GET /api/conversions/:id and /api/conversions/:id/status
const getStatusHandler = (req, res) => {
  const job = db.conversionJobs.findById(req.params.id);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: `Conversion job not found: ${req.params.id}`,
      data: null
    });
  }

  return res.json({
    success: true,
    message: 'Job status retrieved successfully',
    data: {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      errorMessage: job.errorMessage,
      outputFileId: job.outputFileId,
      outputFileName: job.outputFileName,
      createdAt: job.createdAt,
      completedAt: job.completedAt
    }
  });
};

router.get('/:id', getStatusHandler);
router.get('/:id/status', getStatusHandler);

// GET /api/conversions/:id/download and /:id/download/:filename
const downloadHandler = async (req, res) => {
  try {
    const job = db.conversionJobs.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Conversion job not found',
        data: null
      });
    }

    if (!job.outputFileId) {
      return res.status(404).json({
        success: false,
        message: 'No output file generated for this job yet',
        data: null
      });
    }

    const outputFileRecord = db.files.findById(job.outputFileId);
    const buffer = await storageManager.getFileBuffer(job.outputFileId);

    if (!buffer) {
      return res.status(404).json({
        success: false,
        message: 'Output file data could not be retrieved from storage',
        data: null
      });
    }

    const filename = req.params.filename || job.outputFileName || (outputFileRecord ? outputFileRecord.originalName : 'converted_document');
    const mimeType = outputFileRecord ? outputFileRecord.mimeType : 'application/octet-stream';

    // Set download headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.send(buffer);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to download file',
      data: null
    });
  }
};

router.get('/:id/download', downloadHandler);
router.get('/:id/download/:filename', downloadHandler);

// POST /api/conversions/:id/cancel
router.post('/:id/cancel', (req, res) => {
  const job = db.conversionJobs.findById(req.params.id);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Conversion job not found',
      data: null
    });
  }

  if (job.status === 'QUEUED' || job.status === 'PROCESSING') {
    db.conversionJobs.update(req.params.id, {
      status: 'CANCELLED',
      errorMessage: 'Job cancelled by user'
    });
  }

  return res.json({
    success: true,
    message: 'Job cancelled successfully',
    data: null
  });
});

module.exports = router;
