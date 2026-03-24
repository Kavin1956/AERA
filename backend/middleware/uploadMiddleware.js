const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const issueUploadsDir = path.join(uploadsRoot, 'issues');

const ensureUploadDirectory = () => {
  if (!fs.existsSync(issueUploadsDir)) {
    fs.mkdirSync(issueUploadsDir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureUploadDirectory();
      cb(null, issueUploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeBaseName = path
      .basename(file.originalname || 'issue-image', extension)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 60);

    cb(null, `${Date.now()}-${safeBaseName || 'issue-image'}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
    return;
  }

  cb(new Error('Only image files are allowed'));
};

const uploadIssueImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  uploadIssueImage
};
