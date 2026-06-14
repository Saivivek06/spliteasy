const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createGroup, getGroups, getGroup, addMember, removeMember, getGroupBalances } = require('../controllers/groups');

router.use(authenticate);
router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroup);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.get('/:id/balances', getGroupBalances);

module.exports = router;
