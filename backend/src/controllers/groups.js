const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createGroup = async (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });
  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        color: color || '#6366f1',
        createdById: req.user.id,
        members: { create: { userId: req.user.id, role: 'admin' } },
      },
      include: { members: { include: { user: { select: { id: true, displayName: true, username: true, avatarColor: true } } } } },
    });
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroups = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, avatarColor: true } } } },
        _count: { select: { expenses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroup = async (req, res) => {
  const { id } = req.params;
  try {
    const group = await prisma.group.findFirst({
      where: { id: parseInt(id), members: { some: { userId: req.user.id } } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, avatarColor: true } } } },
      },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addMember = async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  try {
    const group = await prisma.group.findFirst({
      where: { id: parseInt(id), members: { some: { userId: req.user.id, role: 'admin' } } },
    });
    if (!group) return res.status(403).json({ error: 'Not authorized' });

    const userToAdd = await prisma.user.findUnique({ where: { username } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: parseInt(id), userId: userToAdd.id } },
    });
    if (existing) return res.status(409).json({ error: 'User already in group' });

    const member = await prisma.groupMember.create({
      data: { groupId: parseInt(id), userId: userToAdd.id },
      include: { user: { select: { id: true, displayName: true, username: true, avatarColor: true } } },
    });
    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  const { id, userId } = req.params;
  try {
    const group = await prisma.group.findFirst({
      where: { id: parseInt(id), members: { some: { userId: req.user.id, role: 'admin' } } },
    });
    if (!group) return res.status(403).json({ error: 'Not authorized' });
    if (parseInt(userId) === group.createdById) {
      return res.status(400).json({ error: 'Cannot remove group creator' });
    }
    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: parseInt(id), userId: parseInt(userId) } },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroupBalances = async (req, res) => {
  const { id } = req.params;
  try {
    const group = await prisma.group.findFirst({
      where: { id: parseInt(id), members: { some: { userId: req.user.id } } },
      include: { members: { include: { user: { select: { id: true, displayName: true, username: true, avatarColor: true } } } } },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const expenses = await prisma.expense.findMany({
      where: { groupId: parseInt(id) },
      include: { splits: true },
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: parseInt(id) },
    });

    // net[userId] = amount they are owed (positive) or owe (negative)
    const net = {};
    group.members.forEach(m => { net[m.userId] = 0; });

    expenses.forEach(exp => {
      net[exp.paidById] = (net[exp.paidById] || 0) + exp.amount;
      exp.splits.forEach(split => {
        net[split.userId] = (net[split.userId] || 0) - split.amount;
      });
    });

    settlements.forEach(s => {
      net[s.fromId] = (net[s.fromId] || 0) + s.amount;
      net[s.toId] = (net[s.toId] || 0) - s.amount;
    });

    // Build simplified debts using greedy algorithm
    const debts = [];
    const creditors = [];
    const debtors = [];

    Object.entries(net).forEach(([userId, balance]) => {
      const member = group.members.find(m => m.userId === parseInt(userId));
      if (!member) return;
      const entry = { userId: parseInt(userId), user: member.user, balance: parseFloat(balance.toFixed(2)) };
      if (balance > 0.01) creditors.push({ ...entry });
      else if (balance < -0.01) debtors.push({ ...entry, balance: Math.abs(entry.balance) });
    });

    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => b.balance - a.balance);

    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const c = creditors[ci];
      const d = debtors[di];
      const amount = Math.min(c.balance, d.balance);
      if (amount > 0.01) {
        debts.push({ from: d.user, to: c.user, amount: parseFloat(amount.toFixed(2)) });
      }
      c.balance -= amount;
      d.balance -= amount;
      if (c.balance < 0.01) ci++;
      if (d.balance < 0.01) di++;
    }

    const memberBalances = group.members.map(m => ({
      user: m.user,
      balance: parseFloat((net[m.userId] || 0).toFixed(2)),
    }));

    res.json({ memberBalances, debts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createGroup, getGroups, getGroup, addMember, removeMember, getGroupBalances };
