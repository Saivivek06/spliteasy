const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getMessages } = require('../controllers/messages');

router.use(authenticate);
router.get('/:expenseId', getMessages);

module.exports = router;
