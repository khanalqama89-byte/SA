const fs = require('fs');
const path = require('path');
const os = require('os');
const { TOOLS } = require('../config/tools');

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || false;
const DB_FILE_PATH = isServerless
  ? path.join(os.tmpdir(), 'sa_data_store.json')
  : path.resolve(process.cwd(), 'database', 'sa_store.json');

// In-Memory Database Store
const state = {
  users: [],
  files: [],
  conversionJobs: [],
  conversionHistory: [],
  tools: JSON.parse(JSON.stringify(TOOLS))
};

// Load initial state from disk if exists
try {
  if (fs.existsSync(DB_FILE_PATH)) {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.users) state.users = parsed.users;
    if (parsed.files) state.files = parsed.files;
    if (parsed.conversionJobs) state.conversionJobs = parsed.conversionJobs;
    if (parsed.conversionHistory) state.conversionHistory = parsed.conversionHistory;
    if (parsed.tools && parsed.tools.length) state.tools = parsed.tools;
  }
} catch (e) {
  console.warn('Failed to load state from disk, using clean memory state:', e.message);
}

// Persist helper
function persist() {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    // Non-fatal if serverless filesystem is restricted
  }
}

const db = {
  users: {
    find() {
      return state.users;
    },
    findById(id) {
      return state.users.find(u => String(u.id) === String(id));
    },
    findByEmail(email) {
      if (!email) return null;
      return state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    count() {
      return state.users.length;
    },
    create(userData) {
      const newUser = {
        id: state.users.length ? Math.max(...state.users.map(u => Number(u.id))) + 1 : 1,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'USER',
        enabled: userData.enabled !== false,
        createdAt: new Date().toISOString()
      };
      state.users.push(newUser);
      persist();
      return newUser;
    }
  },

  files: {
    find() {
      return state.files;
    },
    findById(id) {
      return state.files.find(f => f.id === id);
    },
    count() {
      return state.files.length;
    },
    create(fileData) {
      const record = {
        id: fileData.id,
        userId: fileData.userId || null,
        originalName: fileData.originalName,
        storedName: fileData.storedName,
        extension: fileData.extension,
        mimeType: fileData.mimeType,
        size: fileData.size,
        storagePath: fileData.storagePath,
        fileType: fileData.fileType || 'DOCUMENT',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      state.files.push(record);
      persist();
      return record;
    },
    delete(id) {
      const idx = state.files.findIndex(f => f.id === id);
      if (idx !== -1) {
        state.files.splice(idx, 1);
        persist();
        return true;
      }
      return false;
    }
  },

  tools: {
    findAll() {
      return state.tools;
    },
    findEnabled() {
      return state.tools.filter(t => t.enabled);
    },
    findBySlug(slug) {
      return state.tools.find(t => t.slug === slug);
    },
    findById(id) {
      return state.tools.find(t => String(t.id) === String(id));
    },
    toggle(id, enabled) {
      const tool = state.tools.find(t => String(t.id) === String(id));
      if (tool) {
        tool.enabled = enabled;
        persist();
      }
      return tool;
    }
  },

  conversionJobs: {
    find() {
      return state.conversionJobs;
    },
    findById(id) {
      return state.conversionJobs.find(j => j.id === id);
    },
    findByStatus(status) {
      return state.conversionJobs.filter(j => j.status === status);
    },
    count() {
      return state.conversionJobs.length;
    },
    create(jobData) {
      const job = {
        id: jobData.id,
        userId: jobData.userId || null,
        sourceFileId: jobData.sourceFileId,
        outputFileId: jobData.outputFileId || null,
        sourceFormat: jobData.sourceFormat,
        targetFormat: jobData.targetFormat,
        status: jobData.status || 'QUEUED',
        progress: jobData.progress || 0,
        errorMessage: jobData.errorMessage || null,
        outputFileName: jobData.outputFileName || null,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null
      };
      state.conversionJobs.push(job);
      persist();
      return job;
    },
    update(id, updates) {
      const job = state.conversionJobs.find(j => j.id === id);
      if (job) {
        Object.assign(job, updates);
        persist();
      }
      return job;
    }
  },

  history: {
    findByUserId(userId) {
      return state.conversionHistory
        .filter(h => String(h.userId) === String(userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    findById(id) {
      return state.conversionHistory.find(h => String(h.id) === String(id));
    },
    create(entry) {
      const item = {
        id: state.conversionHistory.length ? Math.max(...state.conversionHistory.map(h => Number(h.id))) + 1 : 1,
        userId: entry.userId,
        jobId: entry.jobId,
        toolName: entry.toolName,
        sourceFileName: entry.sourceFileName,
        outputFileName: entry.outputFileName || null,
        status: entry.status || 'COMPLETED',
        createdAt: new Date().toISOString()
      };
      state.conversionHistory.push(item);
      persist();
      return item;
    },
    delete(id, userId) {
      const idx = state.conversionHistory.findIndex(h => String(h.id) === String(id) && String(h.userId) === String(userId));
      if (idx !== -1) {
        state.conversionHistory.splice(idx, 1);
        persist();
        return true;
      }
      return false;
    }
  }
};

module.exports = db;
