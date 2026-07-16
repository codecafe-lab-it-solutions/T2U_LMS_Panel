const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = /\.(jpeg|jpg|png|gif|webp|pdf|mp4|webm|mov|avi|mkv)$/i;
const ALLOWED_MIME = /^(image\/(jpeg|jpg|png|gif|webp)|application\/pdf|video\/(mp4|webm|quicktime|x-msvideo|x-matroska))$/i;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_EXT.test(file.originalname) || ALLOWED_MIME.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and videos are allowed'));
    }
  },
});

// POST /api/upload — upload a single file
router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large (max 500MB).' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/api/upload/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
  });
});

// GET /api/upload/:filename — serve a previously uploaded file
router.get('/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  // Upload filenames are timestamp+random and never reused, so they're safe to cache
  // aggressively — this is what avoids re-downloading the same video/image from disk on
  // every repeat view. `acceptRanges` (on by default in `send`, set explicitly here for
  // clarity) is what lets browsers seek within a video without fetching the whole file.
  res.sendFile(filePath, { acceptRanges: true, maxAge: '365d', immutable: true });
});

module.exports = router;
