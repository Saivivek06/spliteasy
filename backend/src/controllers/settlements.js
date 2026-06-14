const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSettlement = async (req, res) => {
  const { groupId, toId, amount, note } = req.body;
  if (!groupId || !toId || !amount) {
    return res.status(400).json({ error: 'groupId, toId, and amount are required' });
  }
  try {
    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: parseInt(groupId), userId: req.user.id } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not a group member' });

    const settlement = await prisma.settlement.create({
      data: {
        groupId: parseInt(groupId),
        fromId: req.user.id,
        toId: parseInt(toId),
        amount: parseFloat(amount),
        note,
      },
      include: {
        from: { select: { id: true, displayName: true, avatarColor: true } },
        to: { select: { id: true, displayName: true, avatarColor: true } },
      },
    });
    res.status(201).json(settlement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroupSettlements = async (req, res) => {
  const { groupId } = req.params;
  try {
    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: parseInt(groupId), userId: req.user.id } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not a group member' });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: parseInt(groupId) },
      include: {
        from: { select: { id: true, displayName: true, avatarColor: true } },
        to: { select: { id: true, displayName: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(settlements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createSettlement, getGroupSettlements };
