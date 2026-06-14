const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createSettlement, getGroupSettlements } = require('../controllers/settlements');

router.use(authenticate);
router.post('/', createSettlement);
router.get('/group/:groupId', getGroupSettlements);

module.exports = router;
