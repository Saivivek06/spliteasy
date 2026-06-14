const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createExpense, getGroupExpenses, getExpense, deleteExpense, getMyBalances } = require('../controllers/expenses');

router.use(authenticate);
router.get('/my-balances', getMyBalances);
router.post('/', createExpense);
router.get('/group/:groupId', getGroupExpenses);
router.get('/:id', getExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
