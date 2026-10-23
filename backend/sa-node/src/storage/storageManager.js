const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine base storage directory:
// On Vercel / serverless: use os.tmpdir() (/tmp)
// In local dev: use local storage directory or temp dir
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || false;
const BASE_STORAGE_DIR = isServerless 
  ? path.join(os.tmpdir(), 'sa-storage')
  : path.resolve(process.cwd(), 'storage');

const UPLOADS_DIR = path.join(BASE_STORAGE_DIR, 'uploads');
const PROCESSED_DIR = path.join(BASE_STORAGE_DIR, 'processed');
const TEMP_DIR = path.join(BASE_STORAGE_DIR, 'temp');

// Ensure directories exist
[UPLOADS_DIR, PROCESSED_DIR, TEMP_DIR].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn(`Could not create directory ${dir}:`, err.message);
  }
});

// Fast In-Memory Buffer Cache (vital for Serverless Vercel execution across API calls)
const memoryStore = new Map();

class StorageManager {
  /**
   * Save uploaded file buffer to disk and memory
   */
  async saveUpload(fileId, buffer, originalName, mimeType) {
    const ext = path.extname(originalName).toLowerCase();
    const storedName = `${fileId}${ext}`;
    const filePath = path.join(UPLOADS_DIR, storedName);

    try {
      await fs.promises.writeFile(filePath, buffer);
    } catch (err) {
      console.warn('Failed to write file to disk, retaining in memory:', err.message);
    }

    memoryStore.set(fileId, {
      id: fileId,
      buffer,
      originalName,
      mimeType,
      storedName,
      filePath,
      createdAt: new Date()
    });

    return {
      storedName,
      filePath,
      size: buffer.length
    };
  }

  /**
   * Save converted output file buffer
   */
  async saveProcessed(fileId, buffer, outputName, mimeType) {
    const ext = path.extname(outputName).toLowerCase();
    const storedName = `${fileId}${ext}`;
    const filePath = path.join(PROCESSED_DIR, storedName);

    try {
      await fs.promises.writeFile(filePath, buffer);
    } catch (err) {
      console.warn('Failed to write processed file to disk, retaining in memory:', err.message);
    }

    memoryStore.set(fileId, {
      id: fileId,
      buffer,
      originalName: outputName,
      mimeType,
      storedName,
      filePath,
      createdAt: new Date()
    });

    return {
      storedName,
      filePath,
      size: buffer.length
    };
  }

  /**
   * Retrieve file buffer by fileId
   */
  async getFileBuffer(fileId) {
    if (memoryStore.has(fileId)) {
      return memoryStore.get(fileId).buffer;
    }

    // Try finding on disk
    for (const dir of [UPLOADS_DIR, PROCESSED_DIR, TEMP_DIR]) {
      try {
        if (!fs.existsSync(dir)) continue;
        const files = await fs.promises.readdir(dir);
        const match = files.find(f => f.startsWith(fileId));
        if (match) {
          const filePath = path.join(dir, match);
          return await fs.promises.readFile(filePath);
        }
      } catch (err) {
        // Continue searching
      }
    }

    return null;
  }

  /**
   * Get file metadata stored in memory cache
   */
  getMemoryItem(fileId) {
    return memoryStore.get(fileId) || null;
  }

  /**
   * Delete file
   */
  async deleteFile(fileId) {
    const item = memoryStore.get(fileId);
    if (item && item.filePath && fs.existsSync(item.filePath)) {
      try {
        await fs.promises.unlink(item.filePath);
      } catch (e) {}
    }
    memoryStore.delete(fileId);
  }
}

module.exports = new StorageManager();
