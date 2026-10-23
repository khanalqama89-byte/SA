const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const storageManager = require('../storage/storageManager');
const { executeConversion } = require('../converters');

const router = express.Router();

/**
 * Background worker to run conversion job
 */
async function processJob(jobId, toolSlug, sourceFileId, options = {}) {
  try {
    db.conversionJobs.update(jobId, {
      status: 'PROCESSING',
      progress: 50,
      startedAt: new Date().toISOString()
    });

    const fileRecord = db.files.findById(sourceFileId);
    if (!fileRecord) {
      throw new Error('Source file record not found');
    }

    const inputBuffer = await storageManager.getFileBuffer(sourceFileId);
    if (!inputBuffer) {
      throw new Error('Could not read source file data from storage');
    }

    db.conversionJobs.update(jobId, { progress: 75 });

    // Execute conversion
    const result = await executeConversion(toolSlug, inputBuffer, options);

    // Formulate output filename
    const originalBase = path.parse(fileRecord.originalName).name;
    const outputFileName = `${originalBase}_converted${result.extension}`;
    const outputFileId = uuidv4();

    // Save processed file
    const { filePath, size } = await storageManager.saveProcessed(
      outputFileId,
      result.buffer,
      outputFileName,
      result.mimeType
    );

    // Create file record for output
    db.files.create({
      id: outputFileId,
      userId: fileRecord.userId,
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

    // Record in history if user was authenticated
    if (fileRecord.userId) {
      const tool = db.tools.findBySlug(toolSlug);
      db.history.create({
        userId: fileRecord.userId,
        jobId,
        toolName: tool ? tool.name : toolSlug,
        sourceFileName: fileRecord.originalName,
        outputFileName,
        status: 'COMPLETED'
      });
    }
  } catch (err) {
    console.error(`Conversion job ${jobId} failed:`, err.message);
    db.conversionJobs.update(jobId, {
      status: 'FAILED',
      progress: 0,
      errorMessage: err.message || 'Conversion failed unexpectedly',
      completedAt: new Date().toISOString()
    });
  }
}

// POST /api/conversions
router.post('/', async (req, res) => {
  try {
    const { toolSlug, sourceFileId, options = {} } = req.body;

    if (!toolSlug || !sourceFileId) {
      return res.status(400).json({
        success: false,
        message: 'toolSlug and sourceFileId are required',
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

    const sourceFile = db.files.findById(sourceFileId);
    if (!sourceFile) {
      return res.status(404).json({
        success: false,
        message: 'Source file not found',
        data: null
      });
    }

    const jobId = uuidv4();
    const userId = req.user ? req.user.id : null;

    const job = db.conversionJobs.create({
      id: jobId,
      userId,
      sourceFileId,
      sourceFormat: tool.sourceFormat,
      targetFormat: tool.targetFormat,
      status: 'QUEUED',
      progress: 15
    });

    // Run conversion asynchronously
    setImmediate(() => {
      processJob(jobId, toolSlug, sourceFileId, options);
    });

    return res.status(202).json({
      success: true,
      message: 'Conversion job initiated',
      data: {
        jobId: job.id,
        status: job.status,
        message: 'Conversion job initiated'
      }
    });
  } catch (err) {
    console.error('Job creation error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to start conversion job',
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
