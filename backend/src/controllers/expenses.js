const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const calculateSplits = (amount, splitType, members, splitData) => {
  const splits = [];
  if (splitType === 'equal') {
    const each = amount / members.length;
    members.forEach(userId => splits.push({ userId, amount: parseFloat(each.toFixed(2)) }));
    // Fix rounding
    const total = splits.reduce((s, x) => s + x.amount, 0);
    if (Math.abs(total - amount) > 0.001) splits[0].amount += parseFloat((amount - total).toFixed(2));
  } else if (splitType === 'unequal') {
    let total = 0;
    members.forEach(userId => {
      const a = parseFloat(splitData[userId] || 0);
      total += a;
      splits.push({ userId, amount: a });
    });
    if (Math.abs(total - amount) > 0.01) throw new Error(`Unequal amounts sum to ${total}, expected ${amount}`);
  } else if (splitType === 'percentage') {
    let totalPct = 0;
    members.forEach(userId => {
      const pct = parseFloat(splitData[userId] || 0);
      totalPct += pct;
      splits.push({ userId, amount: parseFloat(((pct / 100) * amount).toFixed(2)), percentage: pct });
    });
    if (Math.abs(totalPct - 100) > 0.01) throw new Error(`Percentages sum to ${totalPct}, expected 100`);
  } else if (splitType === 'share') {
    const totalShares = members.reduce((s, userId) => s + parseFloat(splitData[userId] || 1), 0);
    members.forEach(userId => {
      const sh = parseFloat(splitData[userId] || 1);
      splits.push({ userId, amount: parseFloat(((sh / totalShares) * amount).toFixed(2)), shares: sh });
    });
  } else {
    throw new Error('Invalid split type');
  }
  return splits;
};

const createExpense = async (req, res) => {
  const { groupId, description, amount, splitType, paidById, splitData, memberIds } = req.body;
  if (!groupId || !description || !amount || !splitType || !paidById) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: parseInt(groupId), userId: req.user.id } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not a group member' });

    const members = memberIds?.map(Number) || [];
    if (!members.length) {
      const gm = await prisma.groupMember.findMany({ where: { groupId: parseInt(groupId) } });
      members.push(...gm.map(m => m.userId));
    }

    let splits;
    try {
      splits = calculateSplits(parseFloat(amount), splitType, members, splitData || {});
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const expense = await prisma.expense.create({
      data: {
        groupId: parseInt(groupId),
        description,
        amount: parseFloat(amount),
        splitType,
        paidById: parseInt(paidById),
        splits: { create: splits },
      },
      include: {
        paidBy: { select: { id: true, displayName: true, username: true, avatarColor: true } },
        splits: { include: { user: { select: { id: true, displayName: true, username: true, avatarColor: true } } } },
        messages: { include: { user: { select: { id: true, displayName: true, avatarColor: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroupExpenses = async (req, res) => {
  const { groupId } = req.params;
  try {
    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: parseInt(groupId), userId: req.user.id } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not a group member' });

    const expenses = await prisma.expense.findMany({
      where: { groupId: parseInt(groupId) },
      include: {
        paidBy: { select: { id: true, displayName: true, username: true, avatarColor: true } },
        splits: { include: { user: { select: { id: true, displayName: true, username: true, avatarColor: true } } } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
      include: {
        paidBy: { select: { id: true, displayName: true, username: true, avatarColor: true } },
        splits: { include: { user: { select: { id: true, displayName: true, username: true, avatarColor: true } } } },
        messages: {
          include: { user: { select: { id: true, displayName: true, avatarColor: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: expense.groupId, userId: req.user.id } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not authorized' });

    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await prisma.expense.findUnique({ where: { id: parseInt(id) } });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const isAdmin = await prisma.groupMember.findFirst({
      where: { groupId: expense.groupId, userId: req.user.id, role: 'admin' },
    });
    if (!isAdmin && expense.paidById !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.expense.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyBalances = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: { members: { include: { user: { select: { id: true, displayName: true, avatarColor: true } } } } },
    });

    const allExpenses = await prisma.expense.findMany({
      where: { group: { members: { some: { userId: req.user.id } } } },
      include: { splits: true, group: { select: { id: true, name: true } } },
    });

    const allSettlements = await prisma.settlement.findMany({
      where: { OR: [{ fromId: req.user.id }, { toId: req.user.id }] },
    });

    // Per-person balance across all groups
    const personBalance = {};

    allExpenses.forEach(exp => {
      if (exp.paidById === req.user.id) {
        exp.splits.forEach(split => {
          if (split.userId !== req.user.id) {
            personBalance[split.userId] = (personBalance[split.userId] || 0) + split.amount;
          }
        });
      } else {
        const mySplit = exp.splits.find(s => s.userId === req.user.id);
        if (mySplit) {
          personBalance[exp.paidById] = (personBalance[exp.paidById] || 0) - mySplit.amount;
        }
      }
    });

    allSettlements.forEach(s => {
      if (s.fromId === req.user.id) {
        personBalance[s.toId] = (personBalance[s.toId] || 0) + s.amount;
      } else {
        personBalance[s.fromId] = (personBalance[s.fromId] || 0) - s.amount;
      }
    });

    const totalOwed = Object.values(personBalance).filter(v => v > 0).reduce((a, b) => a + b, 0);
    const totalOwe = Math.abs(Object.values(personBalance).filter(v => v < 0).reduce((a, b) => a + b, 0));

    res.json({ totalOwed: parseFloat(totalOwed.toFixed(2)), totalOwe: parseFloat(totalOwe.toFixed(2)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createExpense, getGroupExpenses, getExpense, deleteExpense, getMyBalances };
