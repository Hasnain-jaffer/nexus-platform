const multer = require('multer');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    // uuid + original extension to avoid collisions
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
