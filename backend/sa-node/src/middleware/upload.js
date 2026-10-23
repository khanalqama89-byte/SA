const multer = require('multer');

// Store upload in memory buffer (ensures compatibility with Vercel serverless /tmp & cloud runtimes)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Sanitize filename and prevent executable uploads
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.vbs', '.php', '.jsp'];
    const originalName = file.originalname.toLowerCase();

    if (dangerousExtensions.some(ext => originalName.endsWith(ext))) {
      return cb(new Error('Executable and scripted file uploads are strictly prohibited.'), false);
    }

    cb(null, true);
  }
});

module.exports = upload;
