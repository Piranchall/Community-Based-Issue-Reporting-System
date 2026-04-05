/**
 * middleware/upload.js
 *
 * Multer configuration for optional image uploads on issue reports.
 *
 * Strategy: store uploaded files on disk under uploads/issues/
 * The saved filename is stored in req.file — the route then puts
 * req.file.path (or a URL derived from it) into the `image` DB field.
 *
 * Accepted types: JPEG, PNG, WEBP, GIF — max 5 MB.
 */

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Ensure the upload directory exists at startup
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'issues');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // e.g.  issue-1712001234567-839271234.jpg
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `issue-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = upload;
