const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createRequest, createRequestRules,
  getRequests,
  updateStatus,
} = require('../controllers/collaborationController');

router.use(protect);

router.post('/', createRequestRules, validate, createRequest);
router.get('/',                      getRequests);
router.patch('/:id',                 updateStatus);

module.exports = router;
