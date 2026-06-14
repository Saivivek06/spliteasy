import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const token = localStorage.getItem('token');
    const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    socketInstance = io(url, { auth: { token }, transports: ['websocket', 'polling'] });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) { socketInstance.disconnect(); socketInstance = null; }
};

export const useExpenseSocket = (expenseId, onMessage) => {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    if (!expenseId) return;
    const socket = getSocket();
    socket.emit('join_expense', expenseId);
    const handler = (msg) => cbRef.current(msg);
    socket.on('new_message', handler);
    return () => {
      socket.emit('leave_expense', expenseId);
      socket.off('new_message', handler);
    };
  }, [expenseId]);

  const sendMessage = (content) => {
    getSocket().emit('send_message', { expenseId, content });
  };

  return { sendMessage };
};
