const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createDeal, createDealRules,
  getDeals,
  updateDeal,
  deleteDeal,
} = require('../controllers/dealController');

router.use(protect);

router.post('/', createDealRules, validate, createDeal);
router.get('/',                   getDeals);
router.patch('/:id',              updateDeal);
router.delete('/:id',             deleteDeal);

module.exports = router;
