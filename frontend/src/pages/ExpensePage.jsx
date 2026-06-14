import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { useExpenseSocket } from '../hooks/useSocket';
import './ExpensePage.css';

export default function ExpensePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const { sendMessage } = useExpenseSocket(parseInt(id), (msg) => {
    setMessages(prev => {
      if (prev.find(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  });

  useEffect(() => {
    Promise.all([
      api.get(`/expenses/${id}`),
      api.get(`/messages/${id}`),
    ]).then(([exp, msgs]) => {
      setExpense(exp);
      setMessages(msgs);
    }).catch(() => toast.error('Failed to load expense'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    sendMessage(msgInput.trim());
    setMsgInput('');
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!expense) return <div>Expense not found</div>;

  const myShare = expense.splits.find(s => s.userId === user.id);
  const totalShares = expense.splits.reduce((s, x) => s + (x.shares || 0), 0);

  return (
    <div className="expense-page">
      <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="expense-detail-header">
        <div>
          <h1 className="expense-detail-title font-display">{expense.description}</h1>
          <div className="expense-detail-meta">
            Paid by <strong>{expense.paidBy.id === user.id ? 'you' : expense.paidBy.displayName}</strong>
            &nbsp;·&nbsp;<span className="badge badge-purple">{expense.splitType} split</span>
          </div>
        </div>
        <div className="expense-total">₹{expense.amount.toFixed(2)}</div>
      </div>

      <div className="expense-splits-card card">
        <div className="splits-title">How it's split</div>
        <div className="splits-list">
          {expense.splits.map(split => (
            <div key={split.userId} className="split-row">
              <div className="avatar avatar-sm" style={{ background: split.user.avatarColor }}>
                {split.user.displayName[0]}
              </div>
              <span className="split-name">
                {split.userId === user.id ? 'You' : split.user.displayName}
              </span>
              {expense.splitType === 'percentage' && (
                <span className="split-pct">{split.percentage?.toFixed(1)}%</span>
              )}
              {expense.splitType === 'share' && (
                <span className="split-pct">{split.shares} / {totalShares} shares</span>
              )}
              <span className="split-amount">₹{split.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
        {myShare && (
          <div className="my-share">
            Your share: <strong>₹{myShare.amount.toFixed(2)}</strong>
            {expense.paidBy.id === user.id ? ' (you paid)' : ` owed to ${expense.paidBy.displayName}`}
          </div>
        )}
      </div>

      <div className="chat-section">
        <h3 className="chat-title">Comments</h3>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">No comments yet. Start the conversation!</div>
          )}
          {messages.map(msg => {
            const isMe = msg.userId === user.id;
            return (
              <div key={msg.id} className={`message ${isMe ? 'message-me' : 'message-other'}`}>
                {!isMe && (
                  <div className="avatar avatar-sm" style={{ background: msg.user.avatarColor }}>
                    {msg.user.displayName[0]}
                  </div>
                )}
                <div className="message-body">
                  {!isMe && <div className="message-author">{msg.user.displayName}</div>}
                  <div className="message-bubble">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            className="input"
            placeholder="Write a comment…"
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!msgInput.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}
