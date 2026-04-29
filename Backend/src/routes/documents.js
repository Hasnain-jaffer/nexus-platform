const express  = require('express');
const router   = express.Router();
const { protect }  = require('../middleware/auth');
const upload   = require('../middleware/upload');
const {
  uploadDocument,
  getDocuments,
  downloadDocument,
  shareDocument,
  deleteDocument,
} = require('../controllers/documentController');

router.use(protect);

router.post('/upload',          upload.single('file'), uploadDocument);
router.get('/',                 getDocuments);
router.get('/:id/download',     downloadDocument);
router.patch('/:id/share',      shareDocument);
router.delete('/:id',           deleteDocument);

module.exports = router;
