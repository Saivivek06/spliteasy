const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMessages = async (req, res) => {
  const { expenseId } = req.params;
  try {
    const expense = await prisma.expense.findUnique({ where: { id: parseInt(expenseId) } });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: expense.groupId, userId: req.user.id } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not authorized' });

    const messages = await prisma.message.findMany({
      where: { expenseId: parseInt(expenseId) },
      include: { user: { select: { id: true, displayName: true, avatarColor: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getMessages };
