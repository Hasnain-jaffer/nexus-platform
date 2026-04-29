const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getUsers,
  getUserById,
  updateProfile, updateProfileRules,
  getEntrepreneurs,
  getInvestors,
} = require('../controllers/userController');

// All user routes require authentication
router.use(protect);

router.get('/',               getUsers);
router.get('/entrepreneurs',  getEntrepreneurs);
router.get('/investors',      getInvestors);
router.get('/:id',            getUserById);
router.put('/:id', updateProfileRules, validate, updateProfile);

module.exports = router;
