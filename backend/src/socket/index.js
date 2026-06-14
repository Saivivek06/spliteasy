const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const setupSocket = (io) => {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join expense room for real-time chat
    socket.on('join_expense', (expenseId) => {
      socket.join(`expense_${expenseId}`);
    });

    socket.on('leave_expense', (expenseId) => {
      socket.leave(`expense_${expenseId}`);
    });

    // Send message in expense chat
    socket.on('send_message', async ({ expenseId, content }) => {
      if (!content?.trim() || !expenseId) return;
      try {
        // Verify access
        const expense = await prisma.expense.findUnique({ where: { id: parseInt(expenseId) } });
        if (!expense) return;
        const isMember = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId: expense.groupId, userId: socket.userId } },
        });
        if (!isMember) return;

        const message = await prisma.message.create({
          data: { expenseId: parseInt(expenseId), userId: socket.userId, content: content.trim() },
          include: { user: { select: { id: true, displayName: true, avatarColor: true } } },
        });

        io.to(`expense_${expenseId}`).emit('new_message', message);
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};

module.exports = setupSocket;
